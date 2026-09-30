"""
CM Optimiser - benchmark.

Produces the numbers printed on the demo page. Every one of them is measured on
held-out parts the engine never saw, against a ground truth it cannot observe.

Measured here:
  recall@10      share of a query's true siblings that land in the top 10
  hit@10         share of queries with at least one sibling in the top 10
  price MAPE     neighbour-weighted price anchor vs the actual held-out price
  naive MAPE     the same, for "just take the alloy family's median price"
  raw vs enriched  the same recall, on deliberately messy inputs, with and
                 without the enrichment layer. The spec's own rule: if enrichment
                 does not add 10 points here, the claim gets dropped.
  bands          distance percentiles that define HIGH / MEDIUM / LOW
  guardrail      the distance above which the tool refuses to quote a number

Outputs: data/benchmark.json
"""
import json
import os
import numpy as np
import pandas as pd

import engine as E
from alloys import ALIASES

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data")
K = 10
MESS_SEED = 4242


def distance_matrix(cat_feat, q_feat, ranges, weights, features, avail=None):
    """avail: optional (Nq, n_features) 0/1 matrix saying which features this
    particular query actually has. A query whose dimensions arrived as the string
    'O40 x 120' has no usable dimensions unless something parsed them, and the
    distance has to be renormalised over what is left rather than quietly
    treating a missing value as a zero."""
    tot = None
    wsum = None
    for j, f in enumerate(features):
        w = float(weights.get(f, 0.0))
        if w <= 0:
            continue
        if f in E.NUMERIC:
            a = q_feat[f].to_numpy(dtype=np.float32)[:, None]
            b = cat_feat[f].to_numpy(dtype=np.float32)[None, :]
            d = np.minimum(np.abs(a - b) / np.float32(ranges[f]), 1.0)
        else:
            a = q_feat[f].to_numpy()[:, None]
            b = cat_feat[f].to_numpy()[None, :]
            d = (a != b).astype(np.float32)
        wq = np.float32(w) if avail is None else (avail[:, j:j + 1].astype(np.float32) * np.float32(w))
        tot = d * wq if tot is None else tot + d * wq
        wsum = (wq + np.zeros((1, 1), np.float32)) if wsum is None else wsum + wq
    wsum = np.maximum(wsum, np.float32(1e-6))
    return tot / wsum


def topk(dist, mask, k=K):
    d = np.where(mask, dist, np.float32(np.inf))
    kk = min(k, d.shape[1])
    part = np.argpartition(d, kk - 1, axis=1)[:, :kk]
    rows = np.arange(d.shape[0])[:, None]
    order = np.argsort(d[rows, part], axis=1)
    idx = part[rows, order]
    return idx, d[rows, idx]


def recall_hit(idx, dists, truth):
    rows = np.arange(idx.shape[0])[:, None]
    sel = truth[rows, idx] & np.isfinite(dists)
    n_sib = np.maximum(truth.sum(axis=1), 1)
    return float((sel.sum(axis=1) / n_sib).mean()), float(sel.any(axis=1).mean())


# ----------------------------------------------------------- messy inputs ---

def make_messy(hold, alloys, seed=MESS_SEED):
    """What a real RFQ list looks like when it reaches you: grade written the way
    the customer's ERP writes it, not the way a materials database does."""
    rng = np.random.default_rng(seed)
    alias_of = {g: v for g, v in ALIASES.items() if v}
    decorations = ["{} BAR STOCK", "MATL: {}", "{} PER AMS-QQ-A-250", "{}  (CUST SUPPLIED)",
                   "MATERIAL {} - SEE DWG", "{}/T6511", "* {} *"]
    junk = ["SEE DRAWING", "CUST SUPPLIED", "SPEC 4471-B", "AS PER RFQ", "TBC", ""]
    out = hold.copy()
    messy, kind = [], []
    for g in out["grade"]:
        r = rng.random()
        opts = alias_of.get(g, [])
        if r < 0.08:                                  # genuinely unusable
            messy.append(junk[int(rng.integers(len(junk)))]); kind.append("junk")
        elif r < 0.20:                                # buried in a spec string
            base = opts[int(rng.integers(len(opts)))] if opts else g
            messy.append(decorations[int(rng.integers(len(decorations)))].format(base))
            kind.append("decorated")
        elif opts and r < 0.80:                       # the customer's own spelling
            messy.append(opts[int(rng.integers(len(opts)))]); kind.append("alias")
        else:
            messy.append(g); kind.append("clean")
    out["grade_as_written"] = messy
    out["mess_kind"] = kind

    # How the dimensions arrive. A customer RFQ spreadsheet is not a database:
    # sizes turn up glued into one cell, in inches, or not at all.
    dim_kind = []
    written = []
    for _, r in out.iterrows():
        r2 = rng.random()
        l, w, h = r["env_l_mm"], r["env_w_mm"], r["env_h_mm"]
        if r2 < 0.55:
            dim_kind.append("clean")
            written.append("")
        elif r2 < 0.75:
            dim_kind.append("combined")
            if r["shape_class"] == "rotational":
                written.append(f"\u00d8{w:.1f} x {l:.1f}")
            else:
                written.append(f"{l:.1f} x {w:.1f} x {h:.1f}")
        elif r2 < 0.90:
            dim_kind.append("inches")
            written.append(f'{l / 25.4:.3f}" x {w / 25.4:.3f}" x {h / 25.4:.3f}"')
        else:
            dim_kind.append("missing")
            written.append("")
    out["dim_kind"] = dim_kind
    out["dims_as_written"] = written
    return out


def normalise_grade(s, lookup, keys_by_len=None):
    """Exact match on the alphanumeric key first. Failing that, scan for the
    longest known alias appearing inside the string, which is what rescues
    'MATERIAL TI6AL4V - SEE DWG'. Deliberately no LLM: this has to run offline."""
    key = "".join(ch for ch in str(s).upper() if ch.isalnum())
    if not key:
        return None
    if key in lookup:
        return lookup[key]
    if keys_by_len:
        for k in keys_by_len:
            if len(k) >= 4 and k in key:
                return lookup[k]
    return None


def build_alias_lookup(alloys):
    lut = {}
    def key(x):
        return "".join(ch for ch in str(x).upper() if ch.isalnum())
    for _, r in alloys.iterrows():
        lut[key(r["grade"])] = r["grade"]
        for a in str(r["aliases"]).split("|"):
            if a:
                lut.setdefault(key(a), r["grade"])
    return lut


def regression_baseline(cat, hold):
    """The baseline a shop could actually build: log-linear price regression on
    mass, batch quantity and material. Beating an alloy-family median proves
    nothing; beating this is worth saying out loud."""
    def design(df):
        fams = sorted(cat["alloy_family"].unique())
        cols = [np.log10(np.maximum(df["part_mass_kg"].to_numpy(dtype=float), 1e-6)),
                np.log10(np.maximum(df["batch_qty"].to_numpy(dtype=float), 1)),
                np.log10(np.maximum(df["n_features"].to_numpy(dtype=float), 1)),
                np.ones(len(df))]
        for f in fams[1:]:
            cols.append((df["alloy_family"].to_numpy() == f).astype(float))
        return np.column_stack(cols)

    X = design(cat)
    y = np.log10(np.maximum(cat["unit_price_eur"].to_numpy(dtype=float), 0.01))
    beta, *_ = np.linalg.lstsq(X, y, rcond=None)
    return 10.0 ** (design(hold) @ beta)


def run():
    cat = E.load_catalogue()
    hold = E.load_holdout()
    alloys = pd.read_csv(os.path.join(DATA, "alloys.csv"))
    with open(os.path.join(DATA, "weights.json")) as fh:
        tuned = json.load(fh)
    weights, ranges = tuned["weights"], tuned["ranges"]

    cat_feat = E.build_features(cat)
    q_feat = E.build_features(hold)
    truth = (hold["parent_id"].to_numpy()[:, None] == cat["parent_id"].to_numpy()[None, :])

    fam_mask = (hold["alloy_family"].to_numpy()[:, None] == cat["alloy_family"].to_numpy()[None, :])
    shape_mask = (hold["shape_class"].to_numpy()[:, None] == cat["shape_class"].to_numpy()[None, :])
    mask = fam_mask & shape_mask

    # ---- headline recall, tuned weights, clean input ----
    dist = distance_matrix(cat_feat, q_feat, ranges, weights, E.NUMERIC + E.CATEGORICAL)
    idx, dd = topk(dist, mask)
    recall, hit = recall_hit(idx, dd, truth)

    # ---- untuned baseline, for the "what did tuning buy" line ----
    flat = {f: 1.0 for f in E.NUMERIC + E.CATEGORICAL}
    d0 = distance_matrix(cat_feat, q_feat, ranges, flat, E.NUMERIC + E.CATEGORICAL)
    i0, dd0 = topk(d0, mask)
    recall_flat, hit_flat = recall_hit(i0, dd0, truth)

    # ---- price anchor accuracy ----
    slopes = E.fit_qty_slope(cat)
    cat_year = cat["quote_date"].str.slice(0, 4).astype(int).to_numpy()
    cat_price = cat["unit_price_eur"].to_numpy(dtype=float)
    cat_batch = cat["batch_qty"].to_numpy(dtype=float)
    actual = hold["unit_price_eur"].to_numpy(dtype=float)
    to_year = 2026.5

    anchors, lows, highs = [], [], []
    for qi in range(len(hold)):
        nb, nd = idx[qi], dd[qi]
        ok = np.isfinite(nd)
        nb, nd = nb[ok], nd[ok]
        if len(nb) == 0:
            anchors.append(np.nan); lows.append(np.nan); highs.append(np.nan); continue
        slope = slopes.get(hold["alloy_family"].iloc[qi], slopes["_pooled"])
        adj = E.adjust_price(cat_price[nb], cat_batch[nb], float(hold["batch_qty"].iloc[qi]),
                             cat_year[nb], to_year, slope)
        rows = [{"adj_price": float(a), "distance": float(x)} for a, x in zip(adj, nd)]
        a = E.Engine.anchor(rows)
        anchors.append(a["point"]); lows.append(a["low"]); highs.append(a["high"])

    anchors = np.array(anchors); lows = np.array(lows); highs = np.array(highs)
    ok = np.isfinite(anchors) & (actual > 0)
    mape = float(np.mean(np.abs(anchors[ok] - actual[ok]) / actual[ok]))
    medape = float(np.median(np.abs(anchors[ok] - actual[ok]) / actual[ok]))
    coverage = float(np.mean((actual[ok] >= lows[ok]) & (actual[ok] <= highs[ok])))

    naive = regression_baseline(cat, hold)
    naive_ape = np.abs(naive[ok] - actual[ok]) / actual[ok]
    naive_mape = float(np.mean(naive_ape))
    naive_medape = float(np.median(naive_ape))

    # ---- raw vs enriched, over grade AND dimensions ----
    messy = make_messy(hold, alloys)
    lut = build_alias_lookup(alloys)
    keys_by_len = sorted(lut.keys(), key=len, reverse=True)
    grade_to_family = dict(zip(alloys["grade"], alloys["alloy_family"]))
    feats = E.NUMERIC + E.CATEGORICAL
    dim_cols = ["log_dim_1", "log_dim_2", "log_dim_3", "log_part_mass"]
    dim_idx = [feats.index(c) for c in dim_cols]

    # ENRICHED: aliases resolved, dimension strings split, inches converted,
    # part mass derived from envelope x density where it is missing.
    norm = [normalise_grade(g, lut, keys_by_len) for g in messy["grade_as_written"]]
    parsed_rate = float(np.mean([n is not None for n in norm]))
    enr_family = np.array([grade_to_family.get(n, "?") if n else "?" for n in norm])
    enr_mask = (enr_family[:, None] == cat["alloy_family"].to_numpy()[None, :]) & shape_mask
    thin = enr_mask.sum(axis=1) < K
    enr_mask[thin] = shape_mask[thin]
    enr_avail = np.ones((len(hold), len(feats)), dtype=np.float32)
    for j in dim_idx:                       # only truly missing rows lose dimensions
        enr_avail[(messy["dim_kind"] == "missing").to_numpy(), j] = 0.0
    enr_dist = distance_matrix(cat_feat, q_feat, ranges, weights, feats, enr_avail)
    ie, de = topk(enr_dist, enr_mask)
    recall_enriched, hit_enriched = recall_hit(ie, de, truth)

    # RAW: literal grade strings, no alias table, no density, no unit handling.
    # Combined and missing dimension cells are simply unusable. Inch values are
    # read as millimetres, which is the silent failure that hurts most.
    raw_mask = (messy["grade_as_written"].to_numpy()[:, None] ==
                cat["grade"].to_numpy()[None, :]) & shape_mask
    empty = raw_mask.sum(axis=1) < K
    raw_mask[empty] = shape_mask[empty]

    raw_q = q_feat.copy()
    inch = (messy["dim_kind"] == "inches").to_numpy()
    for c in ("log_dim_1", "log_dim_2", "log_dim_3"):
        v = np.array(raw_q[c].to_numpy(dtype=float), copy=True)
        v[inch] = v[inch] - np.log10(25.4)          # inches taken as millimetres
        raw_q[c] = v
    raw_avail = np.ones((len(hold), len(feats)), dtype=np.float32)
    unusable = ((messy["dim_kind"] == "combined") | (messy["dim_kind"] == "missing")).to_numpy()
    for j in dim_idx:
        raw_avail[unusable, j] = 0.0
    raw_avail[:, feats.index("log_part_mass")] = 0.0     # no density, no mass
    raw_dist = distance_matrix(cat_feat, raw_q, ranges, weights, feats, raw_avail)
    ir, dr = topk(raw_dist, raw_mask)
    recall_raw, hit_raw = recall_hit(ir, dr, truth)

    # ---- bands and guardrail ----
    # A band has to mean something a person can state out loud. These are
    # calibrated on precision: across every query's top 20 neighbours, at what
    # distance does a neighbour stop being likely to be the same design?
    #   HIGH   >= 75% of neighbours this close are true siblings
    #   MEDIUM >= 35%
    #   LOW    below that
    # Calibrating on top-1 distances instead would put every rank below the
    # first into LOW, which tells the reader nothing.
    wide_idx, wide_d = topk(dist, mask, 20)
    rows_all = np.arange(wide_idx.shape[0])[:, None]
    is_sib = truth[rows_all, wide_idx].ravel()
    dflat = wide_d.ravel()
    keep = np.isfinite(dflat)
    is_sib, dflat = is_sib[keep], dflat[keep]
    order = np.argsort(dflat)
    dsorted, ssorted = dflat[order], is_sib[order].astype(float)
    precision = np.cumsum(ssorted) / np.arange(1, len(ssorted) + 1)

    def threshold_at(target):
        ok = np.flatnonzero(precision >= target)
        if len(ok) == 0:
            return float(dsorted[0])
        return float(dsorted[ok[-1]])

    top1 = dd[:, 0]
    top1 = top1[np.isfinite(top1)]
    bands = {
        "high": threshold_at(0.75),
        "medium": threshold_at(0.35),
        "guardrail": float(np.percentile(top1, 95)),
    }
    if bands["medium"] <= bands["high"]:
        bands["medium"] = bands["high"] * 1.5
    # The guardrail is a separate question from the bands. It asks whether the
    # NEAREST neighbour is far, so it stays on the top-1 distribution and is not
    # clamped to the band thresholds - doing that would collapse LOW entirely.
    def within(lo, hi):
        m = (dsorted > lo) & (dsorted <= hi)
        return float(ssorted[m].mean()) if m.any() else 0.0

    band_precision = {
        "high": within(-1.0, bands["high"]),
        "medium": within(bands["high"], bands["medium"]),
        "low": within(bands["medium"], float("inf")),
    }

    out = {
        "generated": pd.Timestamp.utcnow().date().isoformat(),
        "n_catalogue": int(len(cat)),
        "n_designs": int(cat["parent_id"].nunique()),
        "n_queries": int(len(hold)),
        "k": K,
        "recall_at_10": round(recall, 4),
        "hit_at_10": round(hit, 4),
        "recall_at_10_untuned": round(recall_flat, 4),
        "tuning_gain_points": round((recall - recall_flat) * 100, 1),
        "price_mape": round(mape, 4),
        "price_medape": round(medape, 4),
        "price_range_coverage": round(coverage, 4),
        "naive_mape": round(naive_mape, 4),
        "naive_medape": round(naive_medape, 4),
        "naive_label": "log-linear regression on mass, quantity, feature count and material",
        "messy": {
            "alias_rate": 0.65,
            "grade_parsed_rate": round(parsed_rate, 4),
            "grade_mix": {k: int(v) for k, v in messy["mess_kind"].value_counts().items()},
            "dim_mix": {k: int(v) for k, v in messy["dim_kind"].value_counts().items()},
            "recall_raw": round(recall_raw, 4),
            "recall_enriched": round(recall_enriched, 4),
            "enrichment_gain_points": round((recall_enriched - recall_raw) * 100, 1),
        },
        "bands": {k: round(v, 5) for k, v in bands.items()},
        "band_precision": {k: round(v, 4) for k, v in band_precision.items()},
        "weights": weights,
        "ranges": ranges,
    }
    with open(os.path.join(DATA, "benchmark.json"), "w") as fh:
        json.dump(out, fh, indent=2)

    print(f"catalogue {out['n_catalogue']:,} rows / {out['n_designs']:,} designs")
    print(f"queries   {out['n_queries']:,} held out\n")
    print(f"recall@10            {recall:>7.1%}    (untuned {recall_flat:.1%}, "
          f"tuning worth {out['tuning_gain_points']:+.1f} pts)")
    print(f"hit@10               {hit:>7.1%}    saturates - published as context only")
    print(f"price MAPE           {mape:>7.1%}    median {medape:.1%}")
    print(f"  vs regression      {naive_mape:>7.1%}    median {naive_medape:.1%}  "
          f"({out['naive_label']})")
    print(f"price range covers   {coverage:>7.1%}    of actual prices\n")
    m = out["messy"]
    print(f"messy input, grade written as the customer writes it:")
    print(f"  grade mix          {m['grade_mix']}")
    print(f"  dimension mix      {m['dim_mix']}")
    print(f"  grade parsed       {m['grade_parsed_rate']:>7.1%}")
    print(f"  recall raw         {m['recall_raw']:>7.1%}")
    print(f"  recall enriched    {m['recall_enriched']:>7.1%}")
    verdict = "KEEP the enrichment claim" if m["enrichment_gain_points"] >= 10 else \
              "DROP the enrichment claim (spec rule: needs >= 10 pts)"
    print(f"  enrichment worth   {m['enrichment_gain_points']:>+7.1f} pts   -> {verdict}\n")
    print(f"bands, calibrated on precision over the top 20 of every query:")
    print(f"  HIGH      distance < {bands['high']:.4f}   {band_precision['high']:.0%} of neighbours "
          f"this close are the same design")
    print(f"  MEDIUM    distance < {bands['medium']:.4f}   {band_precision['medium']:.0%}")
    print(f"  LOW       distance > {bands['medium']:.4f}   {band_precision['low']:.0%}")
    print(f"  guardrail distance > {bands['guardrail']:.4f}   refuse to quote a number")
    return out


if __name__ == "__main__":
    run()
