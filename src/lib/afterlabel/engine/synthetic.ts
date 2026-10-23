// Synced from afterlabel packages/engine/src/synthetic.ts at 4ca8eb7e47a3e62fbf09c1ea3c865f130ab5e375 (2026-10-23). Do not edit here: change it in the afterlabel repo and run scripts/sync-afterlabel.sh.
/* eslint-disable */
import { toCsv } from "./csv";

export interface SyntheticOptions {
  seed?: number;
  /** Number of orders. The free tool's sample uses 420. */
  orders?: number;
  firstOrder?: number;
}

export const SYNTHETIC_DEFAULT_SEED = 7;

const ITEMS: { sku: string; name: string; w: number; handling: number; dim?: number }[] = [
  { sku: "PT-24", name: "Poster tube 24 in", w: 1.2, handling: 0.75 },
  { sku: "MUG-11", name: "Ceramic mug 11 oz", w: 1.4, handling: 0 },
  { sku: "CNV-1620", name: "Canvas print 16×20", w: 3.5, handling: 0.5, dim: 0.45 },
  { sku: "PRT-A3", name: "Art print A3, flat", w: 0.6, handling: 0 },
  { sku: "TOTE-01", name: "Canvas tote", w: 0.5, handling: 0 },
  { sku: "FRM-1824", name: "Framed print 18×24", w: 6, handling: 0.6, dim: 0.6 },
];

/**
 * Seeded synthetic UPS invoice plus Shopify orders export. Same algorithm and call order as the
 * sample in index.html, so the same seed gives the same bytes.
 */
export function generateSynthetic(opts: SyntheticOptions = {}): { ups: string; shop: string } {
  let seed = opts.seed ?? SYNTHETIC_DEFAULT_SEED;
  const count = opts.orders ?? 420;
  const first = opts.firstOrder ?? 1001;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  const shop: (string | number)[][] = [["Name", "Created at", "Shipping", "Lineitem quantity", "Lineitem name", "Lineitem sku"]];
  const ups: (string | number)[][] = [["Invoice Date", "Lead Shipment Number", "Shipment Reference Number 1", "Tracking Number", "Entered Weight", "Billed Weight", "Charge Category Code", "Charge Description", "Net Amount"]];
  const trk = () => "1Z" + Array.from({ length: 16 }, () => "0123456789ABCDEFGHJKLMNPRSTVWXYZ"[Math.floor(rnd() * 32)]).join("");
  for (let n = first; n < first + count; n++) {
    const day = 1 + Math.floor(rnd() * 28), date = `2026-09-${String(day).padStart(2, "0")}`;
    const lines = Array.from({ length: 1 + Math.floor(rnd() * rnd() * 3) }, () => ITEMS[Math.floor(rnd() * ITEMS.length)]);
    const shipping = rnd() < 0.4 ? 0 : (lines.length > 1 ? 14.95 : 11.95);
    lines.forEach((it, i) => shop.push([`#${n}`, i ? "" : date + " 10:12:00 -0400", i ? "" : shipping.toFixed(2), 1, it.name, it.sku]));
    const w = lines.reduce((s, it) => s + it.w, 0), t = trk(), ref = rnd() < 0.06 ? "" : String(n);
    const dimHit = lines.some((it) => it.dim && rnd() < it.dim), billed = Math.ceil(dimHit ? w * 2.4 : w);
    const base = 5.2 + billed * 0.6 + rnd() * 2.4;
    const row = (cat: string, desc: string, amt: number) => ups.push([date, t, ref, t, Math.ceil(w), billed, cat, desc, amt.toFixed(2)]);
    row("SHP", "Ground", base);
    row("SHP", "Fuel Surcharge", base * 0.185);
    if (rnd() < 0.7) row("SHP", "Residential Surcharge", 5.95);
    if (rnd() < 0.13) row("SHP", "Delivery Area Surcharge - Residential", 4.25);
    if (lines.some((it) => it.handling && rnd() < it.handling)) row("SHP", "Additional Handling - Dimensions", 17.1);
    if (dimHit) row("ADJ", "Shipping Charge Correction Ground", 3 + rnd() * 11);
    if (rnd() < 0.02) row("ADJ", "Address Correction Ground", 23.5);
  }
  return { ups: toCsv(ups), shop: toCsv(shop) };
}
