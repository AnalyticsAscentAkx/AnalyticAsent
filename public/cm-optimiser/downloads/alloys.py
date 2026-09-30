"""
CM Optimiser - alloy grade reference table.

Enrichment layer #1. Turns a material grade string into physical and commercial
properties the matching engine can reason about.

All figures are INDICATIVE reference values assembled from published material
datasheets and public emission-factor methodology (ADEME Base Carbone for the
carbon factors, ICE v4 cross-checked). Accuracy is +/-30% or worse depending on
region, recycled content and supplier. They are fit for relative comparison
between grades, not for compliance reporting. Not ISO 14067 verified.

machinability_index is a relative material removal rate proxy: 6061-T6 = 1.00.
price_eur_kg is an indicative bar-stock price, small-lot, EU, 2026.
kgco2e_kg is cradle-to-gate, material only (no machining energy).

Outputs: data/alloys.csv
"""
import csv
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "data", "alloys.csv")

# grade, family, density g/cm3, machinability (6061=1.00), UTS MPa, EUR/kg, kgCO2e/kg
GRADES = [
    # --- Aluminium ---
    ("6061-T6",      "ALUMINIUM", 2.70, 1.00,  310,  4.20,  8.60),
    ("6082-T6",      "ALUMINIUM", 2.70, 0.95,  340,  4.00,  8.60),
    ("6026-T9",      "ALUMINIUM", 2.70, 1.30,  330,  5.20,  8.80),
    ("2024-T3",      "ALUMINIUM", 2.78, 0.85,  483,  6.50, 10.50),
    ("7075-T6",      "ALUMINIUM", 2.81, 0.80,  572,  7.00, 11.20),
    ("5083-H111",    "ALUMINIUM", 2.66, 0.55,  290,  4.80,  9.00),
    # --- Stainless ---
    ("304L",         "STAINLESS", 8.00, 0.42,  520,  3.60,  4.20),
    ("316L",         "STAINLESS", 8.00, 0.35,  550,  5.80,  5.10),
    ("303",          "STAINLESS", 8.00, 0.60,  620,  4.20,  4.30),
    ("17-4PH H1025", "STAINLESS", 7.80, 0.32, 1070,  9.50,  5.40),
    ("15-5PH H1025", "STAINLESS", 7.80, 0.33, 1030, 10.50,  5.40),
    ("13-8Mo H1000", "STAINLESS", 7.76, 0.28, 1415, 18.00,  5.80),
    ("440C",         "STAINLESS", 7.68, 0.30,  760,  8.00,  5.00),
    # --- Carbon and alloy steel ---
    ("S355JR",       "STEEL",     7.85, 0.60,  510,  1.20,  1.90),
    ("C45",          "STEEL",     7.85, 0.55,  660,  1.40,  2.00),
    ("42CrMo4",      "STEEL",     7.85, 0.45, 1000,  2.00,  2.20),
    ("4140",         "STEEL",     7.85, 0.45,  950,  1.90,  2.20),
    ("16MnCr5",      "STEEL",     7.85, 0.50,  800,  1.80,  2.10),
    ("1.2312",       "STEEL",     7.85, 0.40, 1000,  4.50,  2.60),
    # --- Titanium ---
    ("Ti-6Al-4V",     "TITANIUM", 4.43, 0.18,  950, 38.00, 32.00),
    ("Ti-6Al-4V ELI", "TITANIUM", 4.43, 0.17,  900, 46.00, 33.00),
    ("Ti-10V-2Fe-3Al","TITANIUM", 4.65, 0.15, 1100, 62.00, 35.00),
    # --- Nickel ---
    ("Inconel 718",  "NICKEL",    8.19, 0.12, 1375, 42.00, 22.00),
    ("Inconel 625",  "NICKEL",    8.44, 0.13,  930, 38.00, 21.00),
    ("Waspaloy",     "NICKEL",    8.19, 0.10, 1280, 70.00, 25.00),
    # --- Copper base ---
    ("CuZn39Pb3",    "COPPER",    8.47, 1.80,  420,  7.50,  3.50),
    ("C101",         "COPPER",    8.94, 0.65,  250,  9.50,  3.80),
    ("C63000",       "COPPER",    7.58, 0.30,  760, 14.00,  4.60),
    # --- Engineering polymers ---
    ("POM-C",        "POLYMER",   1.41, 2.20,   68,  5.50,  3.00),
    ("PA66",         "POLYMER",   1.14, 2.00,   82,  6.00,  7.00),
    ("PEEK",         "POLYMER",   1.30, 1.20,  100, 95.00, 12.00),
]

# Alias -> canonical grade. Drives the fuzzy grade parser in the web app.
# Keys are matched after upper-casing and stripping all non-alphanumerics.
ALIASES = {
    "6061-T6":      ["6061", "AA6061", "AL6061", "EN AW-6061", "6061-T6511", "6061T651", "AL 6061 T6"],
    "6082-T6":      ["6082", "EN AW-6082", "AA6082", "6082T6"],
    "6026-T9":      ["6026", "EN AW-6026"],
    "2024-T3":      ["2024", "AA2024", "AL2024", "2024-T351", "2219"],
    "7075-T6":      ["7075", "AA7075", "AL7075", "7075-T651", "7050", "7050-T7451", "7175", "7475"],
    "5083-H111":    ["5083", "AA5083", "AL5083"],
    "304L":         ["304", "SS304", "AISI 304", "1.4301", "1.4307", "A2", "X5CrNi18-10"],
    "316L":         ["316", "SS316", "AISI 316", "1.4404", "1.4401", "A4", "X2CrNiMo17-12-2"],
    "303":          ["SS303", "AISI 303", "1.4305"],
    "17-4PH H1025": ["17-4PH", "174PH", "17-4", "1.4542", "AISI 630", "S17400"],
    "15-5PH H1025": ["15-5PH", "155PH", "15-5", "1.4545", "S15500"],
    "13-8Mo H1000": ["13-8MO", "13-8PH", "138MO", "1.4534", "S13800", "CUSTOM 465"],
    "440C":         ["1.4125", "AISI 440C", "X105CrMo17"],
    "S355JR":       ["S355", "1.0045", "ST52", "E355"],
    "C45":          ["1.0503", "AISI 1045", "1045", "CK45"],
    "42CrMo4":      ["1.7225", "42CRMO", "708M40"],
    "4140":         ["AISI 4140", "SCM440", "4130", "AISI 4130"],
    "16MnCr5":      ["1.7131", "AISI 5115"],
    "1.2312":       ["40CRMNMOS8-6", "P20+S"],
    "Ti-6Al-4V":    ["TI6AL4V", "TI-6AL-4V", "GRADE 5", "GR5", "TI GR5", "TI ALLOY (6AL4V)",
                     "3.7165", "TI 6-4", "TIAL6V4", "TI-6-4"],
    "Ti-6Al-4V ELI":["GRADE 23", "GR23", "TI6AL4VELI", "3.7164"],
    "Ti-10V-2Fe-3Al":["TI-10-2-3", "TI10V2FE3AL"],
    "Inconel 718":  ["IN718", "INCO718", "ALLOY 718", "2.4668", "UNS N07718", "NICKEL 718"],
    "Inconel 625":  ["IN625", "ALLOY 625", "2.4856", "UNS N06625"],
    "Waspaloy":     ["WASPALLOY", "UNS N07001"],
    "CuZn39Pb3":    ["CW614N", "BRASS", "MS58", "2.0401", "BRASS ALLOY 260", "C360", "CZ121"],
    "C101":         ["CU-ETP", "CUETP", "COPPER", "C110", "CW004A", "2.0065"],
    "C63000":       ["AL-NI-BRONZE", "ALNIBZ", "ALUMINIUM BRONZE", "UNS C63000", "CUAL10NI5FE4",
                     "NIAL BRONZE", "UNS 72900", "COPPER NICKEL TIN"],
    "POM-C":        ["POM", "ACETAL", "DELRIN", "POM-H"],
    "PA66":         ["NYLON", "NYLON 66", "PA6", "PA 6.6"],
    "PEEK":         ["PEEK 450G", "POLYETHERETHERKETONE"],
}

HEADER = ["grade", "alloy_family", "density_g_cm3", "machinability_index",
          "uts_mpa", "price_eur_kg", "kgco2e_kg", "aliases"]


def build_rows():
    rows = []
    for grade, family, dens, mach, uts, price, co2 in GRADES:
        rows.append({
            "grade": grade,
            "alloy_family": family,
            "density_g_cm3": dens,
            "machinability_index": mach,
            "uts_mpa": uts,
            "price_eur_kg": price,
            "kgco2e_kg": co2,
            "aliases": "|".join(ALIASES.get(grade, [])),
        })
    return rows


def main():
    rows = build_rows()
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=HEADER)
        w.writeheader()
        w.writerows(rows)
    fams = sorted({r["alloy_family"] for r in rows})
    print(f"alloys.csv: {len(rows)} grades across {len(fams)} families -> {OUT}")
    for f in fams:
        n = sum(1 for r in rows if r["alloy_family"] == f)
        print(f"  {f:<10} {n}")


if __name__ == "__main__":
    main()
