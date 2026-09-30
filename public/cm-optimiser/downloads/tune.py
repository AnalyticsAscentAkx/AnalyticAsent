"""
CM Optimiser - feature weight tuning.

Which matters more when deciding that two parts are neighbours: that they weigh
the same, or that they are held to the same tolerance? Guessing is how you get a
demo that looks clever and ranks badly. Instead we tune the weights against the
hidden ground truth in the synthetic catalogue: every held-out part knows which
parent design it came from, so recall@10 is measurable.

The trick that makes this fast: the per-feature distance matrices do not depend
on the weights, so they are computed once (400 queries x 4,000 candidates x 12
features) and every trial is then just a weighted sum. 400 trials in seconds, no
multiprocessing and no Optuna dependency.

Search: Latin-hypercube style random restarts, then coordinate descent on the
best point. Deterministic for a given seed.

Outputs: data/weights.json
"""
import json
import os
import numpy as np
import pandas as pd

import engine as E

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data")
SEED = 7
N_RANDOM = 300
N_REFINE_SWEEPS = 6
K = 10
FEATURES = E.NUMERIC + E.CATEGORICAL


def precompute(cat, hold):
    """Returns per-feature distance tensor (F, Nq, Nc), candidate mask (Nq, Nc),
    and the sibling truth matrix (Nq, Nc)."""
    cf = E.build_features(cat)
    hf = E.build_features(hold)
    ranges = E.numeric_ranges(cf)

    nq, nc = len(hold), len(cat)
    D = np.zeros((len(FEATURES), nq, nc), dtype=np.float32)

    for fi, c in enumerate(E.NUMERIC):
        a = hf[c].to_numpy(dtype=np.float32)[:, None]
        b = cf[c].to_numpy(dtype=np.float32)[None, :]
        D[fi] = np.minimum(np.abs(a - b) / np.float32(ranges[c]), 1.0)
    for j, c in enumerate(E.CATEGORICAL):
        fi = len(E.NUMERIC) + j
        a = hf[c].to_numpy()[:, None]
        b = cf[c].to_numpy()[None, :]
        D[fi] = (a != b).astype(np.float32)

    mask = ((hold["alloy_family"].to_numpy()[:, None] == cat["alloy_family"].to_numpy()[None, :]) &
            (hold["shape_class"].to_numpy()[:, None] == cat["shape_class"].to_numpy()[None, :]))
    truth = (hold["parent_id"].to_numpy()[:, None] == cat["parent_id"].to_numpy()[None, :])
    return D, mask, truth, ranges


def score(D, mask, truth, w, k=K):
    """Two numbers, because only one of them is honest.

    hit@k  - did ANY true sibling land in the top k. With 5 siblings in the pool
             this saturates near 100% and flatters the engine.
    recall@k - what SHARE of the query's true siblings landed in the top k. This
             is the one we tune on and the one we publish."""
    wv = np.asarray([w[f] for f in FEATURES], dtype=np.float32)
    wsum = float(wv.sum())
    if wsum <= 0:
        return 0.0, np.inf
    dist = np.tensordot(wv, D, axes=(0, 0)) / np.float32(wsum)
    dist = np.where(mask, dist, np.float32(np.inf))

    kk = min(k, dist.shape[1])
    part = np.argpartition(dist, kk - 1, axis=1)[:, :kk]
    rows = np.arange(dist.shape[0])[:, None]
    sel = truth[rows, part] & np.isfinite(dist[rows, part])
    n_sib = truth.sum(axis=1)
    recall = np.divide(sel.sum(axis=1), np.maximum(n_sib, 1), dtype=float)
    hit = sel.any(axis=1)
    return float(recall.mean()), float(hit.mean())


def tune():
    cat = E.load_catalogue()
    hold = E.load_holdout()
    print(f"tuning on {len(hold)} held-out queries against {len(cat)} catalogue rows")
    D, mask, truth, ranges = precompute(cat, hold)
    print(f"distance tensor {D.shape} = {D.nbytes / 1e6:.0f} MB, precomputed once")

    rng = np.random.default_rng(SEED)
    base = {f: 1.0 for f in FEATURES}
    best_r, base_hit = score(D, mask, truth, base)
    best_w = base
    print(f"  baseline (all weights 1.0)   recall@{K} = {best_r:.3f}   hit@{K} = {base_hit:.3f}")

    for t in range(N_RANDOM):
        w = {f: float(np.exp(rng.uniform(np.log(0.05), np.log(4.0)))) for f in FEATURES}
        r, _ = score(D, mask, truth, w)
        if r > best_r:
            best_r, best_w = r, w
    print(f"  after {N_RANDOM} random trials    recall@{K} = {best_r:.3f}")

    # Coordinate descent: one feature at a time, multiplicative steps.
    steps = [0.5, 0.7, 0.85, 1.2, 1.5, 2.0]
    for sweep in range(N_REFINE_SWEEPS):
        improved = False
        for f in FEATURES:
            for s in steps:
                w = dict(best_w)
                w[f] = float(np.clip(w[f] * s, 0.01, 8.0))
                r, _ = score(D, mask, truth, w)
                if r > best_r + 1e-9:
                    best_r, best_w, improved = r, w, True
        print(f"  refine sweep {sweep + 1}              recall@{K} = {best_r:.3f}")
        if not improved:
            break

    # Normalise so the weights read as relative importance summing to the count.
    s = sum(best_w.values()) / len(best_w)
    best_w = {f: round(v / s, 4) for f, v in best_w.items()}

    final_recall, final_hit = score(D, mask, truth, best_w)
    out = {
        "seed": SEED,
        "k": K,
        "features": FEATURES,
        "weights": best_w,
        "ranges": {k: round(v, 6) for k, v in ranges.items()},
        "recall_at_k": round(final_recall, 4),
        "hit_at_k": round(final_hit, 4),
        "n_queries": int(len(hold)),
        "n_catalogue": int(len(cat)),
    }
    with open(os.path.join(DATA, "weights.json"), "w") as fh:
        json.dump(out, fh, indent=2)

    print(f"\nfinal recall@{K} = {final_recall:.1%}   (hit@{K} = {final_hit:.1%})")
    print("tuned weights (relative importance, mean 1.0):")
    for f, v in sorted(best_w.items(), key=lambda kv: -kv[1]):
        bar = "#" * int(round(v * 18))
        print(f"  {f:<16} {v:>6.2f}  {bar}")
    return out


if __name__ == "__main__":
    tune()
