// Synced from afterlabel packages/engine/src/csv.ts at 4ca8eb7e47a3e62fbf09c1ea3c865f130ab5e375 (2026-10-23). Do not edit here: change it in the afterlabel repo and run scripts/sync-afterlabel.sh.
/* eslint-disable */
export function parseCSV(text: string): string[][] {
  text = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let f = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') { f += '"'; i++; } else q = false;
      } else f += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(f); f = ""; }
    else if (c === "\n") { row.push(f); rows.push(row); row = []; f = ""; }
    else if (c !== "\r") f += c;
  }
  if (f.length || row.length) { row.push(f); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim() !== ""));
}

/** Parses money-like text. Parentheses or any minus sign mean negative; junk gives 0. */
export function num(x: unknown): number {
  const s = String(x ?? "").trim();
  if (!s) return 0;
  const neg = /^\(.*\)$/.test(s) || /-/.test(s);
  const v = parseFloat(s.replace(/[^0-9.]/g, ""));
  if (!isFinite(v)) return 0;
  return neg ? -v : v;
}

/** Normalised reference: alphanumerics only, no leading zeros, lower case. */
export const norm = (x: unknown): string =>
  String(x ?? "").replace(/[^0-9a-z]/gi, "").replace(/^0+/, "").toLowerCase();

/** Digits-only reference, no leading zeros. */
export const digits = (x: unknown): string =>
  String(x ?? "").replace(/\D/g, "").replace(/^0+/, "");

export function toCsv(rows: (string | number)[][]): string {
  return rows
    .map((r) => r.map((v) => (/[",]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v)).join(","))
    .join("\n");
}
