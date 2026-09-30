"""
CM Optimiser - export to the browser.

Everything the web app needs is a static file. There is no API, no database and
no server-side matching: the catalogue, the tuned weights and the benchmark are
downloaded once and the engine runs in a worker thread on the visitor's machine.
That is what lets the page promise that an uploaded quote history never leaves
the browser, and it is why the whole thing costs nothing to host.

Internal columns (parent_id, archetype_id, the sequential part_id) are stripped
here, not hidden in the UI.

Outputs: public/cm-optimiser/
"""
import json
import os
import shutil
import numpy as np
import pandas as pd

import engine as E

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data")
PUB = os.path.abspath(os.path.join(HERE, "..", "..", "public", "cm-optimiser"))

PUBLIC_COLS = ["public_id", "part_family", "shape_class", "grade", "alloy_family",
               "process", "env_l_mm", "env_w_mm", "env_h_mm", "stock_mass_kg",
               "part_mass_kg", "n_features", "n_setups", "tightest_tol_mm",
               "surface_Ra_um", "heat_treat", "surface_treat", "annual_qty",
               "batch_qty", "quote_date", "unit_price_eur", "won"]

DICT_COLS = ["part_family", "shape_class", "grade", "alloy_family", "process",
             "heat_treat", "surface_treat"]
FLOAT_COLS = {"env_l_mm": 2, "env_w_mm": 2, "env_h_mm": 2, "stock_mass_kg": 4,
              "part_mass_kg": 4, "tightest_tol_mm": 4, "surface_Ra_um": 2,
              "unit_price_eur": 2}


def columnar(df):
    """Dictionary-encoded columns. A row-of-objects JSON of this catalogue is
    about 2.4 MB; this is a third of that and parses faster."""
    out = {"n": int(len(df)), "dict": {}, "cols": {}}
    for c in PUBLIC_COLS:
        v = df[c]
        if c in DICT_COLS:
            cats = sorted(v.dropna().unique().tolist())
            idx = {k: i for i, k in enumerate(cats)}
            out["dict"][c] = cats
            out["cols"][c] = [int(idx[x]) for x in v]
        elif c == "public_id":
            out["cols"][c] = v.tolist()
        elif c == "quote_date":
            # days since 2021-01-01 keeps dates as small integers
            base = pd.Timestamp("2021-01-01")
            out["cols"][c] = [int((pd.Timestamp(x) - base).days) for x in v]
            out["date_base"] = "2021-01-01"
        elif c == "won":
            out["cols"][c] = [1 if bool(x) else 0 for x in v]
        elif c in FLOAT_COLS:
            out["cols"][c] = [round(float(x), FLOAT_COLS[c]) for x in v]
        else:
            out["cols"][c] = [int(x) for x in v]
    return out


def main():
    os.makedirs(PUB, exist_ok=True)
    os.makedirs(os.path.join(PUB, "downloads"), exist_ok=True)

    cat = pd.read_csv(os.path.join(DATA, "catalogue_full.csv"))
    alloys = pd.read_csv(os.path.join(DATA, "alloys.csv"))
    with open(os.path.join(DATA, "weights.json")) as fh:
        weights = json.load(fh)
    with open(os.path.join(DATA, "benchmark.json")) as fh:
        bench = json.load(fh)

    public = cat[PUBLIC_COLS].copy()

    # --- catalogue ---
    blob = columnar(public)
    p = os.path.join(PUB, "catalogue.json")
    with open(p, "w") as fh:
        json.dump(blob, fh, separators=(",", ":"))
    cat_kb = os.path.getsize(p) / 1024

    # --- alloy table ---
    al = []
    for _, r in alloys.iterrows():
        al.append({
            "grade": r["grade"], "family": r["alloy_family"],
            "density": float(r["density_g_cm3"]),
            "mach": float(r["machinability_index"]),
            "uts": float(r["uts_mpa"]),
            "eurKg": float(r["price_eur_kg"]),
            "co2Kg": float(r["kgco2e_kg"]),
            "aliases": [a for a in str(r["aliases"]).split("|") if a],
        })
    p = os.path.join(PUB, "alloys.json")
    with open(p, "w") as fh:
        json.dump({"grades": al}, fh, separators=(",", ":"))
    al_kb = os.path.getsize(p) / 1024

    # --- model: weights, ranges, bands, quantity slopes, benchmark ---
    slopes = E.fit_qty_slope(cat)
    model = {
        "version": bench["generated"],
        "features": {"numeric": E.NUMERIC, "categorical": E.CATEGORICAL},
        "weights": weights["weights"],
        "ranges": weights["ranges"],
        "bands": bench["bands"],
        "bandPrecision": bench["band_precision"],
        "qtySlope": {k: round(v, 5) for k, v in slopes.items()},
        "priceDrift": 0.03,
        "benchmark": {
            "nCatalogue": bench["n_catalogue"],
            "nDesigns": bench["n_designs"],
            "nQueries": bench["n_queries"],
            "recallAt10": bench["recall_at_10"],
            "hitAt10": bench["hit_at_10"],
            "recallAt10Untuned": bench["recall_at_10_untuned"],
            "tuningGainPoints": bench["tuning_gain_points"],
            "priceMape": bench["price_mape"],
            "priceMedape": bench["price_medape"],
            "priceRangeCoverage": bench["price_range_coverage"],
            "naiveMape": bench["naive_mape"],
            "naiveMedape": bench["naive_medape"],
            "naiveLabel": bench["naive_label"],
            "messy": bench["messy"],
        },
    }
    p = os.path.join(PUB, "model.json")
    with open(p, "w") as fh:
        json.dump(model, fh, separators=(",", ":"))
    mo_kb = os.path.getsize(p) / 1024

    # --- demo RFQ parts, shipped as JSON and as the CSV people edit ---
    demo = pd.read_csv(os.path.join(DATA, "demo_rfq.csv"))
    demo_pub = demo[[c for c in PUBLIC_COLS if c in demo.columns]]
    with open(os.path.join(PUB, "demo_rfq.json"), "w") as fh:
        json.dump(demo_pub.to_dict(orient="records"), fh, separators=(",", ":"))

    # --- downloads: change them, break them, re-upload them ---
    d = os.path.join(PUB, "downloads")
    public.to_csv(os.path.join(d, "catalogue.csv"), index=False)
    demo_pub.to_csv(os.path.join(d, "demo_rfq.csv"), index=False)
    alloys.to_csv(os.path.join(d, "alloys.csv"), index=False)
    for f in ("generate.py", "alloys.py", "engine.py", "tune.py", "benchmark.py"):
        shutil.copy(os.path.join(HERE, f), os.path.join(d, f))

    print(f"-> {PUB}")
    print(f"  catalogue.json   {cat_kb:>8,.0f} KB   {len(public):,} rows, "
          f"{len(PUBLIC_COLS)} columns, dictionary-encoded")
    print(f"  alloys.json      {al_kb:>8,.0f} KB   {len(al)} grades")
    print(f"  model.json       {mo_kb:>8,.0f} KB   weights, bands, benchmark")
    print(f"  demo_rfq.json    {os.path.getsize(os.path.join(PUB, 'demo_rfq.json')) / 1024:>8,.0f} KB"
          f"   {len(demo_pub)} parts")
    print(f"  downloads/       {sum(os.path.getsize(os.path.join(d, f)) for f in os.listdir(d)) / 1024:>8,.0f} KB"
          f"   {len(os.listdir(d))} files")
    leaked = [c for c in ("parent_id", "archetype_id", "part_id") if c in public.columns]
    print(f"\n  internal columns leaked to public files: {leaked or 'none'}")


if __name__ == "__main__":
    main()
