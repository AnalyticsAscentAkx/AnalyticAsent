"""
CM Optimiser - reference matching engine (Python).

This is the authoritative implementation. The TypeScript engine that runs in the
browser (src/lib/cm/) is a direct port of it, and parity.py checks the two agree.
Python is where the weights get tuned and the benchmark gets measured; the browser
only ever *applies* the result.

Pipeline:
    hard filter (alloy family, optionally shape class)
      -> Gower distance on physical features, weighted
      -> k nearest
      -> price anchor (inverse-distance weighted, quantity- and date-adjusted)
      -> match band from benchmark distance percentiles
      -> guardrail if even the nearest neighbour is far
"""
import json
import math
import os
import numpy as np
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data")

# Numeric features, each compared on a log scale where it spans orders of
# magnitude. dim_1/2/3 are the envelope dimensions sorted descending, which makes
# the comparison orientation-invariant: a 100x50x20 part and a 20x100x50 part are
# the same part.
NUMERIC = [
    "log_part_mass", "log_dim_1", "log_dim_2", "log_dim_3",
    "log_tol", "n_features", "n_setups", "surface_Ra_um", "log_batch_qty",
]
CATEGORICAL = ["part_family", "surface_treat", "process"]

DEFAULT_WEIGHTS = {k: 1.0 for k in NUMERIC + CATEGORICAL}


def log10p(x, floor=1e-9):
    return np.log10(np.maximum(np.asarray(x, dtype=float), floor))


def build_features(df):
    """Rows -> the feature frame the distance works on. Pure function of columns
    that are knowable at quote time. Price is never a feature."""
    dims = np.sort(df[["env_l_mm", "env_w_mm", "env_h_mm"]].to_numpy(dtype=float), axis=1)[:, ::-1]
    out = pd.DataFrame(index=df.index)
    out["log_part_mass"] = log10p(df["part_mass_kg"])
    out["log_dim_1"] = log10p(dims[:, 0])
    out["log_dim_2"] = log10p(dims[:, 1])
    out["log_dim_3"] = log10p(dims[:, 2])
    out["log_tol"] = log10p(df["tightest_tol_mm"])
    out["n_features"] = df["n_features"].astype(float)
    out["n_setups"] = df["n_setups"].astype(float)
    out["surface_Ra_um"] = df["surface_Ra_um"].astype(float)
    out["log_batch_qty"] = log10p(df["batch_qty"])
    for c in CATEGORICAL:
        out[c] = df[c].astype(str).values
    return out


def numeric_ranges(feat):
    """Gower needs a range per numeric feature. Taken from the catalogue once and
    frozen, so an odd query part cannot rescale everyone else's distances."""
    rng = {}
    for c in NUMERIC:
        v = feat[c].to_numpy(dtype=float)
        lo, hi = np.percentile(v, 1), np.percentile(v, 99)
        rng[c] = float(max(hi - lo, 1e-6))
    return rng


def gower(query_row, cand_feat, ranges, weights):
    """Weighted Gower distance: numeric terms are |a-b|/range clipped to 1,
    categorical terms are 0 or 1. Returns a value in [0, 1]."""
    total = np.zeros(len(cand_feat), dtype=float)
    wsum = 0.0
    for c in NUMERIC:
        w = weights.get(c, 1.0)
        if w <= 0:
            continue
        d = np.abs(cand_feat[c].to_numpy(dtype=float) - float(query_row[c])) / ranges[c]
        total += w * np.minimum(d, 1.0)
        wsum += w
    for c in CATEGORICAL:
        w = weights.get(c, 1.0)
        if w <= 0:
            continue
        d = (cand_feat[c].to_numpy() != query_row[c]).astype(float)
        total += w * d
        wsum += w
    return total / max(wsum, 1e-9)


# ------------------------------------------------------------ price anchor ---

def fit_qty_slope(cat):
    """Log-log price-quantity slope, fitted per alloy family and pooled as a
    fallback. Quoting 1,000 of something is not ten times quoting 100."""
    def slope(sub):
        if len(sub) < 40:
            return None
        x = np.log10(np.maximum(sub["batch_qty"].to_numpy(dtype=float), 1))
        y = np.log10(np.maximum(sub["unit_price_eur"].to_numpy(dtype=float), 0.01))
        x = x - x.mean()
        denom = float((x ** 2).sum())
        if denom < 1e-9:
            return None
        return float((x * (y - y.mean())).sum() / denom)

    pooled = slope(cat) or -0.15
    out = {"_pooled": pooled}
    for fam, sub in cat.groupby("alloy_family"):
        s = slope(sub)
        out[fam] = s if s is not None else pooled
    return out


def adjust_price(price, from_qty, to_qty, from_year, to_year, qty_slope, drift=0.03):
    """Move a historical price onto the query's quantity and today's date."""
    q = (np.maximum(to_qty, 1) / np.maximum(from_qty, 1)) ** qty_slope
    d = (1.0 + drift) ** (np.asarray(to_year, dtype=float) - np.asarray(from_year, dtype=float))
    return price * q * d


# ----------------------------------------------------------------- matching ---

class Engine:
    def __init__(self, catalogue, weights=None, bands=None, shape_filter=True):
        self.cat = catalogue.reset_index(drop=True)
        self.feat = build_features(self.cat)
        self.ranges = numeric_ranges(self.feat)
        self.weights = dict(DEFAULT_WEIGHTS if weights is None else weights)
        self.bands = bands or {}
        self.shape_filter = shape_filter
        self.qty_slope = fit_qty_slope(self.cat)
        self.year = self.cat["quote_date"].str.slice(0, 4).astype(int)

    def candidate_mask(self, query, relax=False):
        """Hard filter. Alloy family always; shape class too unless that empties
        the pool, in which case we relax rather than return nothing."""
        m = (self.cat["alloy_family"].to_numpy() == query["alloy_family"])
        if self.shape_filter and not relax:
            m = m & (self.cat["shape_class"].to_numpy() == query["shape_class"])
        # never match a part against itself
        if "part_id" in query and query["part_id"] is not None:
            m = m & (self.cat["part_id"].to_numpy() != query["part_id"])
        return m

    def query(self, query_row, k=10, to_year=2026.5):
        qf = build_features(pd.DataFrame([query_row])).iloc[0]
        mask = self.candidate_mask(query_row)
        relaxed = False
        if mask.sum() < k:
            mask = self.candidate_mask(query_row, relax=True)
            relaxed = True
        idx = np.flatnonzero(mask)
        if len(idx) == 0:
            return {"matches": [], "relaxed": True, "no_precedent": True}

        d = gower(qf, self.feat.iloc[idx], self.ranges, self.weights)
        order = np.argsort(d, kind="stable")[:k]
        take = idx[order]
        dist = d[order]

        slope = self.qty_slope.get(query_row["alloy_family"], self.qty_slope["_pooled"])
        rows = []
        for rank, (i, dd) in enumerate(zip(take, dist), start=1):
            c = self.cat.iloc[i]
            adj = adjust_price(float(c["unit_price_eur"]), int(c["batch_qty"]),
                               int(query_row["batch_qty"]), int(self.year.iloc[i]),
                               to_year, slope)
            rows.append({"rank": rank, "idx": int(i), "part_id": c["part_id"],
                         "distance": float(dd), "price": float(c["unit_price_eur"]),
                         "adj_price": float(adj)})
        return {"matches": rows, "relaxed": relaxed,
                "no_precedent": bool(self.bands) and dist[0] > self.bands.get("guardrail", math.inf),
                "anchor": self.anchor(rows)}

    @staticmethod
    def anchor(rows):
        """Inverse-distance weighted median of adjusted neighbour prices, with a
        10th-90th percentile range. A median, not a mean: one freak quote in the
        history should not move the anchor."""
        if not rows:
            return None
        p = np.array([r["adj_price"] for r in rows], dtype=float)
        d = np.array([r["distance"] for r in rows], dtype=float)
        w = 1.0 / (d + 0.02)
        o = np.argsort(p)
        p, w = p[o], w[o]
        cw = np.cumsum(w) / w.sum()
        point = float(p[int(np.searchsorted(cw, 0.5))])
        lo = float(p[int(np.searchsorted(cw, 0.10))])
        hi = float(p[int(np.searchsorted(cw, 0.90))])
        return {"point": point, "low": lo, "high": hi}


def load_catalogue():
    return pd.read_csv(os.path.join(DATA, "catalogue_full.csv"))


def load_holdout():
    return pd.read_csv(os.path.join(DATA, "holdout.csv"))


def load_weights():
    p = os.path.join(DATA, "weights.json")
    if not os.path.exists(p):
        return dict(DEFAULT_WEIGHTS)
    with open(p) as fh:
        return json.load(fh)["weights"]
