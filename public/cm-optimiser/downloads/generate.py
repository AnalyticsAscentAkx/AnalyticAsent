"""
CM Optimiser - synthetic historical quote catalogue.

Real machine shops quote families of near-identical parts. That structure is what
gives a nearest-neighbour engine true neighbours to find, and it gives us a hidden
ground truth to benchmark against: every part knows which parent design it came
from, so we can ask "did the engine put the true siblings in the top 10?".

100 archetypes -> 1,000 parent designs -> 5 variants each = 5,000 parts.
One variant per parent is held out -> 1,000 benchmark queries, 4,000 catalogue rows.
That leaves only 4 true siblings per query, which is what a real five-year quote
history looks like: a design comes back a handful of times, not a dozen.
5 of the held-out parts ship as the demo RFQ set.

Parents are drawn from a smaller set of archetypes on purpose. If every design
were unrelated, finding a sibling would be trivial and the benchmark would read
100% - which is exactly how a rigged demo looks. Archetypes give the catalogue
genuine confusers: different designs that are near-neighbours in every feature
the engine can see, and which it must not mistake for the real siblings.

The cost model below is published in full, with its seed, precisely so that anyone
can accuse the catalogue of being rigged and then check. Change the seed, change
the dimensions, re-run: the benchmark numbers move very little.

Outputs (tools/cm-optimiser/data/):
    catalogue_full.csv   4,000 rows incl. parent_id   (internal, for benchmarking)
    holdout.csv            400 rows incl. parent_id   (internal, benchmark queries)
    demo_rfq.csv             5 rows, no parent_id     (shipped)
"""
import math
import os
import numpy as np
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data")
SEED = 20260930
N_ARCHETYPES = 100
N_PARENTS = 1000
N_VARIANTS = 5           # 4 stay in the catalogue, 1 is held out

# ---------------------------------------------------------------- taxonomy ---

ROTATIONAL = ["shaft", "bushing", "pin", "gear blank", "fitting"]
PRISMATIC = ["flange", "bracket", "housing", "plate", "manifold"]
PART_FAMILIES = ROTATIONAL + PRISMATIC

# process -> (shop rate EUR/h, base MRR cm3/min at machinability 1.0, setup hours)
PROCESSES = {
    "turning":            (55.0, 30.0, 0.6),
    "3-axis mill":        (65.0, 25.0, 0.9),
    "5-axis mill":        (95.0, 20.0, 1.4),
    "turn-mill":          (80.0, 22.0, 1.1),
    "forging + machining":(70.0, 18.0, 1.2),
}

# Which processes plausibly make which shape class.
PROC_BY_SHAPE = {
    "rotational": ["turning", "turn-mill", "5-axis mill", "forging + machining"],
    "prismatic":  ["3-axis mill", "5-axis mill", "turn-mill", "forging + machining"],
}

HEAT_TREATS = ["none", "stress relieve", "harden + temper", "solution + age"]
# surface_treat -> (fixed EUR/part, EUR per dm2 of surface)
SURFACE_TREATS = {
    "none":      (0.00, 0.00),
    "anodise":   (0.80, 0.55),
    "passivate": (0.60, 0.30),
    "zinc":      (0.50, 0.35),
    "nitride":   (2.50, 1.20),
    "paint":     (0.70, 0.45),
}

# Families a given part family is plausibly made from, with weights.
FAMILY_MATERIAL_BIAS = {
    "shaft":      {"STEEL": 5, "STAINLESS": 3, "TITANIUM": 1, "ALUMINIUM": 1},
    "bushing":    {"COPPER": 4, "STEEL": 2, "POLYMER": 2, "STAINLESS": 1},
    "pin":        {"STEEL": 4, "STAINLESS": 3, "TITANIUM": 1},
    "gear blank": {"STEEL": 5, "STAINLESS": 2, "COPPER": 1},
    "fitting":    {"STAINLESS": 3, "TITANIUM": 3, "ALUMINIUM": 2, "NICKEL": 2},
    "flange":     {"STAINLESS": 3, "STEEL": 3, "ALUMINIUM": 2, "NICKEL": 1},
    "bracket":    {"ALUMINIUM": 6, "STEEL": 2, "TITANIUM": 1, "STAINLESS": 1},
    "housing":    {"ALUMINIUM": 5, "STAINLESS": 2, "STEEL": 2},
    "plate":      {"ALUMINIUM": 4, "STEEL": 3, "STAINLESS": 2, "POLYMER": 1},
    "manifold":   {"ALUMINIUM": 4, "STAINLESS": 3, "TITANIUM": 1, "STEEL": 1},
}

# Typical largest-dimension range in mm, by part family (log-uniform draw).
SIZE_RANGE = {
    "shaft":      (60, 800), "bushing": (8, 160),  "pin": (5, 120),
    "gear blank": (30, 400), "fitting": (10, 180), "flange": (25, 500),
    "bracket":    (30, 400), "housing": (50, 600), "plate": (60, 800),
    "manifold":   (40, 450),
}

SCRAP_MIN, SCRAP_MAX = 0.05, 0.15
MARGIN_MIN, MARGIN_MAX = 1.15, 1.35
NOISE_SIGMA = 0.12
ANNUAL_DRIFT = 0.03
BASE_YEAR = 2021
FORGING_STOCK_PREMIUM = 1.40


def load_alloys():
    df = pd.read_csv(os.path.join(DATA, "alloys.csv"))
    return df


# ---------------------------------------------------------------- geometry ---

def draw_envelope(rng, family, shape):
    """Bounding box in mm as (l, w, h), largest first. Rotational parts are a
    D x D x L box so that sorted dimensions stay meaningful across shape classes."""
    lo, hi = SIZE_RANGE[family]
    major = math.exp(rng.uniform(math.log(lo), math.log(hi)))
    if shape == "rotational":
        # slenderness: shafts and pins are long and thin, bushings are stubby
        slender = {"shaft": (4.0, 25.0), "pin": (3.0, 15.0), "bushing": (0.4, 2.5),
                   "gear blank": (0.2, 1.2), "fitting": (0.6, 3.0)}[family]
        ratio = math.exp(rng.uniform(math.log(slender[0]), math.log(slender[1])))
        length = major
        dia = max(5.0, length / ratio)
        if dia > length:          # stubby part: the drawn major is the diameter
            dia, length = length, max(5.0, length / ratio)
        return (length, dia, dia)
    # prismatic: two aspect ratios off the major dimension
    w = major * rng.uniform(0.25, 1.0)
    h = major * rng.uniform(0.08, 0.7)
    dims = sorted([major, max(5.0, w), max(4.0, h)], reverse=True)
    return tuple(dims)


def stock_volume_cm3(shape, l, w, h):
    if shape == "rotational":
        # round bar: pi/4 * D^2 * L, with D = w (= h)
        return math.pi / 4.0 * (w / 10.0) ** 2 * (l / 10.0)
    return (l / 10.0) * (w / 10.0) * (h / 10.0)


def surface_area_dm2(l, w, h):
    a = 2 * (l * w + l * h + w * h)          # mm2
    return a / 10000.0


# ------------------------------------------------------------- cost model ----

def tolerance_factor(tol_mm):
    """1.0 at 0.1 mm, ~2.5 at 0.01 mm."""
    return float(np.clip((0.1 / tol_mm) ** 0.4, 0.75, 4.0))


def feature_factor(n_features):
    return 1.0 + 0.02 * (n_features - 3)


def cycle_minutes(removed_cm3, mrr_base, machinability, tol_mm, n_features):
    mrr = max(0.25, mrr_base * machinability)
    return (removed_cm3 / mrr) * tolerance_factor(tol_mm) * feature_factor(n_features)


def quote_price(row, rng, apply_noise=True):
    """price = ( m_stock*p_kg*(1+s) + (t_cycle/60)*r_proc
                 + (n_setups*h_setup*r_proc)/q_batch + c_finish ) * M * eps
       then drifted forward at 3%/yr from the base year."""
    rate, mrr_base, setup_h = PROCESSES[row["process"]]
    stock_price = row["price_eur_kg"] * (FORGING_STOCK_PREMIUM
                                         if row["process"] == "forging + machining" else 1.0)
    material = row["stock_mass_kg"] * stock_price * (1.0 + row["scrap_rate"])
    t_cycle = cycle_minutes(row["removed_vol_cm3"], mrr_base, row["machinability_index"],
                            row["tightest_tol_mm"], row["n_features"])
    machining = (t_cycle / 60.0) * rate
    setup = (row["n_setups"] * setup_h * rate) / max(1, row["batch_qty"])
    fixed, per_dm2 = SURFACE_TREATS[row["surface_treat"]]
    finish = fixed + per_dm2 * row["surface_area_dm2"]
    if row["heat_treat"] != "none":
        finish += 0.35 + 0.9 * row["part_mass_kg"]
    subtotal = material + machining + setup + finish
    price = subtotal * row["margin"]
    drift = (1.0 + ANNUAL_DRIFT) ** (row["quote_year_frac"] - BASE_YEAR)
    price *= drift
    if apply_noise:
        price *= float(rng.lognormal(0.0, NOISE_SIGMA))
    return price, t_cycle


# --------------------------------------------------------------- sampling ---

def weighted_choice(rng, mapping):
    keys = list(mapping.keys())
    w = np.array([mapping[k] for k in keys], dtype=float)
    return keys[int(rng.choice(len(keys), p=w / w.sum()))]


def make_archetype(rng, alloys, aid):
    """A shop's recurring design theme: a family of parts in one material and one
    process, around a characteristic size."""
    family = PART_FAMILIES[int(rng.integers(len(PART_FAMILIES)))]
    shape = "rotational" if family in ROTATIONAL else "prismatic"
    alloy_family = weighted_choice(rng, FAMILY_MATERIAL_BIAS[family])
    process = PROC_BY_SHAPE[shape][int(rng.integers(len(PROC_BY_SHAPE[shape])))]
    if alloy_family == "POLYMER" and process == "forging + machining":
        process = "turning" if shape == "rotational" else "3-axis mill"
    l, w, h = draw_envelope(rng, family, shape)
    return {
        "archetype_id": f"A{aid:03d}",
        "part_family": family,
        "shape_class": shape,
        "alloy_family": alloy_family,
        "process": process,
        "env_l": l, "env_w": w, "env_h": h,
        "n_features": int(np.clip(rng.lognormal(2.3, 0.7), 3, 60)),
        "tol_mu": float(rng.uniform(math.log(0.005), math.log(0.2))),
        "Ra_mu": float(rng.uniform(0.4, 6.3)),
    }


def make_parent(rng, archetype, alloys, pid):
    """One design within an archetype. Sizes move by up to ~35% and the grade can
    be any in the same alloy family, so sibling designs stay genuinely confusable."""
    a = archetype
    scale = math.exp(rng.normal(0.0, 0.30))
    l = max(5.0, a["env_l"] * scale * math.exp(rng.normal(0, 0.10)))
    w = max(5.0, a["env_w"] * scale * math.exp(rng.normal(0, 0.10)))
    h = max(4.0, a["env_h"] * scale * math.exp(rng.normal(0, 0.10)))
    if a["shape_class"] == "rotational":
        h = w
    pool = alloys[alloys.alloy_family == a["alloy_family"]]
    grade_row = pool.iloc[int(rng.integers(len(pool)))]
    return {
        "parent_id": f"D{pid:04d}",
        "archetype_id": a["archetype_id"],
        "part_family": a["part_family"],
        "shape_class": a["shape_class"],
        "alloy_family": a["alloy_family"],
        "grade": grade_row["grade"],
        "process": a["process"],
        "env_l": l, "env_w": w, "env_h": h,
        "n_features": int(np.clip(a["n_features"] * math.exp(rng.normal(0, 0.35)), 3, 60)),
        "n_setups": int(np.clip(rng.integers(1, 7), 1, 6)),
        "tightest_tol_mm": float(np.clip(math.exp(a["tol_mu"] + rng.normal(0, 0.45)), 0.005, 0.2)),
        "surface_Ra_um": float(np.clip(a["Ra_mu"] * math.exp(rng.normal(0, 0.25)), 0.4, 6.3)),
        "heat_treat": HEAT_TREATS[int(rng.integers(len(HEAT_TREATS)))],
        "surface_treat": list(SURFACE_TREATS)[int(rng.integers(len(SURFACE_TREATS)))],
        "annual_qty": int(math.exp(rng.uniform(math.log(10), math.log(50000)))),
    }


def make_variant(rng, parent, alloys, vid):
    """A variant is the same design re-quoted: dimensions nudged, tolerance or
    finish occasionally changed, different quantity, different date, sometimes a
    neighbouring grade in the same alloy family."""
    v = dict(parent)
    v["part_id"] = f"{parent['parent_id']}-{vid:02d}"
    scale = float(rng.normal(1.0, 0.12))
    for k in ("env_l", "env_w", "env_h"):
        v[k] = max(4.0, v[k] * float(np.clip(scale + rng.normal(0, 0.05), 0.55, 1.75)))
    if v["shape_class"] == "rotational":
        v["env_h"] = v["env_w"]            # keep it a round bar
    if rng.random() < 0.15:                # re-quoted on a different machine
        alts = PROC_BY_SHAPE[v["shape_class"]]
        cand = alts[int(rng.integers(len(alts)))]
        if not (v["alloy_family"] == "POLYMER" and cand == "forging + machining"):
            v["process"] = cand
    if rng.random() < 0.45:                # re-specified to a sibling grade
        pool = alloys[alloys.alloy_family == v["alloy_family"]]
        v["grade"] = pool.iloc[int(rng.integers(len(pool)))]["grade"]
    v["n_features"] = int(np.clip(v["n_features"] + rng.integers(-6, 7), 3, 60))
    v["n_setups"] = int(np.clip(v["n_setups"] + rng.integers(-1, 2), 1, 6))
    if rng.random() < 0.40:
        v["tightest_tol_mm"] = float(np.clip(v["tightest_tol_mm"] * math.exp(rng.normal(0, 0.45)),
                                             0.005, 0.2))
    v["surface_Ra_um"] = float(np.clip(v["surface_Ra_um"] * float(rng.normal(1.0, 0.20)), 0.4, 6.3))
    if rng.random() < 0.20:
        v["surface_treat"] = list(SURFACE_TREATS)[int(rng.integers(len(SURFACE_TREATS)))]
    v["annual_qty"] = int(np.clip(v["annual_qty"] * math.exp(rng.normal(0, 0.6)), 10, 50000))
    v["batch_qty"] = int(np.clip(v["annual_qty"] * rng.uniform(0.05, 1.0), 1, 5000))
    v["quote_year_frac"] = float(rng.uniform(BASE_YEAR, 2026.5))
    v["scrap_rate"] = float(rng.uniform(SCRAP_MIN, SCRAP_MAX))
    v["margin"] = float(rng.uniform(MARGIN_MIN, MARGIN_MAX))
    v["fill_factor"] = float(rng.uniform(0.60, 0.85)
                             if v["process"] == "forging + machining"
                             else rng.uniform(0.20, 0.80))
    return v


def enrich_physical(v, alloys_idx):
    a = alloys_idx.loc[v["grade"]]
    l, w, h = v["env_l"], v["env_w"], v["env_h"]
    vol = stock_volume_cm3(v["shape_class"], l, w, h)
    v["density_g_cm3"] = float(a["density_g_cm3"])
    v["machinability_index"] = float(a["machinability_index"])
    v["uts_mpa"] = float(a["uts_mpa"])
    v["price_eur_kg"] = float(a["price_eur_kg"])
    v["kgco2e_kg"] = float(a["kgco2e_kg"])
    v["stock_mass_kg"] = vol * v["density_g_cm3"] / 1000.0
    v["part_mass_kg"] = v["stock_mass_kg"] * v["fill_factor"]
    v["removed_vol_cm3"] = vol * (1.0 - v["fill_factor"])
    v["surface_area_dm2"] = surface_area_dm2(l, w, h)
    return v


def year_frac_to_date(yf):
    year = int(yf)
    day = int((yf - year) * 365)
    return (pd.Timestamp(year=year, month=1, day=1) + pd.Timedelta(days=day)).date().isoformat()


# ------------------------------------------------------------------ build ---

def build():
    rng = np.random.default_rng(SEED)
    alloys = load_alloys()
    alloys_idx = alloys.set_index("grade")

    archetypes = [make_archetype(rng, alloys, i) for i in range(N_ARCHETYPES)]

    rows = []
    for pid in range(N_PARENTS):
        arch = archetypes[int(rng.integers(N_ARCHETYPES))]
        parent = make_parent(rng, arch, alloys, pid)
        for vid in range(N_VARIANTS):
            v = make_variant(rng, parent, alloys, vid)
            v = enrich_physical(v, alloys_idx)
            price, t_cycle = quote_price(v, rng)
            fair, _ = quote_price({**v, "margin": 1.25}, rng, apply_noise=False)
            v["unit_price_eur"] = round(price, 2)
            v["cycle_min"] = round(t_cycle, 2)
            v["_fair_price"] = fair
            v["quote_date"] = year_frac_to_date(v["quote_year_frac"])
            rows.append(v)

    df = pd.DataFrame(rows)

    # Win flag: logistic in price-vs-fair ratio, intercept calibrated to ~30% wins.
    ratio = df["unit_price_eur"] / df["_fair_price"]
    k = 6.0
    lo, hi = -8.0, 8.0
    for _ in range(60):                       # bisect the intercept
        b = (lo + hi) / 2
        p = 1.0 / (1.0 + np.exp(-(b - k * (ratio - 1.0))))
        if p.mean() > 0.30:
            hi = b
        else:
            lo = b
    p_win = 1.0 / (1.0 + np.exp(-(b - k * (ratio - 1.0))))
    df["won"] = rng.random(len(df)) < p_win

    df["env_l_mm"] = df["env_l"].round(2)
    df["env_w_mm"] = df["env_w"].round(2)
    df["env_h_mm"] = df["env_h"].round(2)
    for c in ("stock_mass_kg", "part_mass_kg"):
        df[c] = df[c].round(4)
    df["tightest_tol_mm"] = df["tightest_tol_mm"].round(4)
    df["surface_Ra_um"] = df["surface_Ra_um"].round(2)

    cols = ["part_id", "parent_id", "archetype_id", "part_family", "shape_class", "grade", "alloy_family",
            "process", "env_l_mm", "env_w_mm", "env_h_mm", "stock_mass_kg", "part_mass_kg",
            "n_features", "n_setups", "tightest_tol_mm", "surface_Ra_um", "heat_treat",
            "surface_treat", "annual_qty", "batch_qty", "quote_date", "unit_price_eur", "won"]
    df = df[cols]

    # Opaque public IDs. The internal part_id spells out which parent design a
    # row came from, which would hand anyone the benchmark answer key straight
    # out of the CSV download. Public IDs are assigned in shuffled order so the
    # numbering carries no information about design, date or price.
    order = rng.permutation(len(df))
    public = np.empty(len(df), dtype=object)
    for new_i, old_i in enumerate(order):
        public[old_i] = f"Q{new_i + 1:05d}"
    df.insert(0, "public_id", public)

    # Hold out one variant per parent: the last one.
    holdout_mask = df["part_id"].str.endswith(f"-{N_VARIANTS - 1:02d}")
    catalogue = df[~holdout_mask].reset_index(drop=True)
    holdout = df[holdout_mask].reset_index(drop=True)

    os.makedirs(DATA, exist_ok=True)
    catalogue.to_csv(os.path.join(DATA, "catalogue_full.csv"), index=False)
    holdout.to_csv(os.path.join(DATA, "holdout.csv"), index=False)

    demo = pick_demo(holdout)
    demo.drop(columns=["part_id", "parent_id", "archetype_id", "unit_price_eur", "won"]).to_csv(
        os.path.join(DATA, "demo_rfq.csv"), index=False)
    demo.to_csv(os.path.join(DATA, "demo_rfq_answers.csv"), index=False)

    report(catalogue, holdout, demo)
    return catalogue, holdout, demo


def pick_demo(holdout):
    """Five held-out parts spanning the material range, per the demo spec."""
    wanted = [
        ("bracket",  "ALUMINIUM"),
        ("shaft",    "STAINLESS"),
        ("fitting",  "TITANIUM"),
        ("flange",   "STEEL"),
        ("bushing",  "COPPER"),
    ]
    picks = []
    for fam, mat in wanted:
        cand = holdout[(holdout.part_family == fam) & (holdout.alloy_family == mat)]
        if len(cand) == 0:
            cand = holdout[holdout.alloy_family == mat]
        if len(cand) == 0:
            cand = holdout[holdout.part_family == fam]
        # middle of the size distribution reads better in a demo than an outlier
        cand = cand.assign(_r=(cand.stock_mass_kg.rank(pct=True) - 0.5).abs()).sort_values("_r")
        picks.append(cand.iloc[0].drop(labels="_r"))
    return pd.DataFrame(picks).reset_index(drop=True)


def report(catalogue, holdout, demo):
    print(f"catalogue_full.csv : {len(catalogue):,} rows, {catalogue.parent_id.nunique()} designs, {catalogue.archetype_id.nunique()} archetypes")
    print(f"holdout.csv        : {len(holdout):,} rows (benchmark queries)")
    print(f"demo_rfq.csv       : {len(demo)} rows")
    p = catalogue.unit_price_eur
    print(f"\nprice EUR  min {p.min():>9,.2f}  p25 {p.quantile(.25):>9,.2f} "
          f" median {p.median():>9,.2f}  p75 {p.quantile(.75):>9,.2f}  max {p.max():>11,.2f}")
    print(f"win rate   {catalogue.won.mean():.1%}")
    print("\nby alloy family:")
    g = catalogue.groupby("alloy_family").agg(n=("part_id", "size"),
                                              median_eur=("unit_price_eur", "median"))
    for fam, r in g.sort_values("n", ascending=False).iterrows():
        print(f"  {fam:<10} {int(r.n):>5}   median EUR {r.median_eur:>10,.2f}")
    print("\ndemo RFQ parts:")
    for _, r in demo.iterrows():
        print(f"  {r.public_id:<8} {r.part_family:<11} {r.grade:<15} "
              f"{r.env_l_mm:>7.1f}x{r.env_w_mm:>6.1f}x{r.env_h_mm:>6.1f} mm   "
              f"qty {r.annual_qty:>6,}   true EUR {r.unit_price_eur:>10,.2f}")


if __name__ == "__main__":
    build()
