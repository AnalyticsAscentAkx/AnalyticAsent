"""
CM Optimiser - rebuild everything.

    python3 run_all.py

Runs the whole pipeline in order and leaves the browser assets in
public/cm-optimiser/. Deterministic: same seeds in, same numbers out, which is
the point - the benchmark on the page has to be reproducible by anyone who
downloads these files.
"""
import subprocess
import sys
import os

HERE = os.path.dirname(os.path.abspath(__file__))

STEPS = [
    ("alloys.py", "alloy grade table"),
    ("generate.py", "synthetic catalogue + held-out queries"),
    ("tune.py", "feature weight tuning"),
    ("benchmark.py", "benchmark, bands and guardrail"),
    ("export.py", "browser assets + downloads"),
]


def main():
    for script, what in STEPS:
        print(f"\n{'=' * 70}\n  {script}  -  {what}\n{'=' * 70}")
        r = subprocess.run([sys.executable, script], cwd=HERE)
        if r.returncode != 0:
            print(f"\n{script} failed with exit code {r.returncode}", file=sys.stderr)
            return r.returncode
    print("\nDone. public/cm-optimiser/ is up to date.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
