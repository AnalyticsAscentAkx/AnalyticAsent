# CM Optimiser — data and model pipeline

Everything the web app serves is a static file built by these scripts. There is
no API and no database: the browser downloads the catalogue once and does the
matching itself.

```bash
python3 run_all.py
```

Requires `numpy`, `pandas`, `scipy`. Takes about 30 seconds.

| Script | What it does | Writes |
|---|---|---|
| `alloys.py` | 31 grades with density, machinability, UTS, €/kg, kgCO₂e, plus the aliases the parser resolves | `data/alloys.csv` |
| `generate.py` | 100 archetypes → 1,000 designs → 5 variants each. One variant per design is held out. | `data/catalogue_full.csv`, `data/holdout.csv`, `data/demo_rfq.csv` |
| `engine.py` | Reference matching engine. The TypeScript in `src/lib/cm/` is a port of this. | — |
| `tune.py` | Feature weights, tuned to maximise recall@10 against the held-out siblings | `data/weights.json` |
| `benchmark.py` | Every number printed on the page | `data/benchmark.json` |
| `export.py` | Browser assets and the public downloads | `public/cm-optimiser/` |

## What the numbers mean

- **recall@10** — the share of a held-out part's true siblings that land in the
  top ten. Not "did any sibling appear", which saturates near 100% and flatters
  the engine; both are reported and the strict one is on the headline.
- **Match bands** — calibrated on precision across every query's top 20, so
  *high* means a measured share of neighbours that close really are the same
  design, rather than a threshold someone liked the look of.
- **Guardrail** — the 95th percentile of nearest-neighbour distances. Above it
  the tool says there is no reliable precedent instead of showing a price.

## Why the catalogue is synthetic

No open dataset of real machined parts with real prices exists. The closest
academic set was never released openly. So the catalogue is generated from a
published cost model with a fixed seed, and the generator ships with it — a
demo built on data nobody can inspect proves nothing.

The carbon factors are indicative, material-only and cradle-to-gate, assembled
from published emission-factor methodology. They are fit for comparing one
grade against another and nothing else. Not ISO 14067.

## Changing it

The seeds are at the top of `generate.py` (`SEED`) and `tune.py` (`SEED`).
Change either and re-run `run_all.py`; the benchmark numbers move by well under
a point, which is the honest test of whether the result is real.
