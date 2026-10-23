// Synced from afterlabel packages/engine/src/analyse.ts at 4ca8eb7e47a3e62fbf09c1ea3c865f130ab5e375 (2026-10-23). Do not edit here: change it in the afterlabel repo and run scripts/sync-afterlabel.sh.
/* eslint-disable */
import { norm } from "./csv";
import { ADJ_BUCKETS, classifyLine } from "./classify";
import { createMatcher, type MatchSources } from "./match";
import type { BucketTotal, ChargeLine, OrderResult, Report, SkuResult } from "./types";

/** Billed weight above this multiple of entered weight counts as heavier than entered. */
export const HEAVY_RATIO = 1.1;
/** Tolerance when deciding an order lost money on shipping. */
export const LOSS_TOLERANCE = 0.005;

export class NoChargesError extends Error {
  constructor() {
    super("No charges found in the UPS file. Check that the net amount column is mapped to the charge amounts.");
    this.name = "NoChargesError";
  }
}

interface WorkOrder extends Omit<OrderResult, "result"> { lines: { sku: string; name: string; qty: number }[]; pkgs: Set<string> }

/** Turns charge lines (plus optional Shopify and ShipStation data) into the Report all surfaces render. */
export function analyse(chargeLines: ChargeLine[], src: MatchSources = {}): Report {
  const matcher = createMatcher(src);
  const hasShop = !!src.shop;
  const orders = new Map<string, WorkOrder>();
  for (const [key, o] of matcher.shopKeys) {
    orders.set(key, { id: o.id, date: o.date, charged: o.charged, cost: 0, adjustments: 0, packages: 0, lines: o.lines, pkgs: new Set() });
  }

  const buckets = new Map<string, { amount: number; adjustment: boolean }>();
  const pk = new Map<string, { entered: number; billed: number; cost: number }>();
  let total = 0, adjTotal = 0, matched = 0, unmatched = 0, lines = 0, matchedLines = 0;

  for (const line of chargeLines) {
    const net = line.net;
    if (!net) continue;
    lines++;
    const { bucket, adjustment } = classifyLine(line);
    total += net;
    if (adjustment) adjTotal += net;
    const b = buckets.get(bucket) ?? { amount: 0, adjustment: false };
    b.amount += net;
    buckets.set(bucket, b);

    const pkg = norm(line.trackingNo || line.leadTrackingNo);
    if (pkg) {
      const p = pk.get(pkg) ?? { entered: 0, billed: 0, cost: 0 };
      p.entered = Math.max(p.entered, line.enteredWeight);
      p.billed = Math.max(p.billed, line.billedWeight);
      p.cost += net;
      pk.set(pkg, p);
    }

    const ok = matcher.match(line);
    if (ok) {
      let o = orders.get(ok);
      if (!o) {
        o = { id: src.shipstation && !src.shop ? ok : (line.refs[0] || ok), date: "", charged: null, cost: 0, adjustments: 0, packages: 0, lines: [], pkgs: new Set() };
        orders.set(ok, o);
      }
      o.cost += net;
      if (adjustment) o.adjustments += net;
      if (pkg) o.pkgs.add(pkg);
      if (!o.date) o.date = line.invoiceDate;
      matched += net;
      matchedLines++;
    } else unmatched += net;
  }
  if (!lines) throw new NoChargesError();

  const shipped = [...orders.values()].filter((o) => o.cost !== 0);
  const withCharge = shipped.filter((o) => o.charged !== null);
  const charged = withCharge.reduce((s, o) => s + (o.charged as number), 0);
  const costOfCharged = withCharge.reduce((s, o) => s + o.cost, 0);
  const losing = withCharge.filter((o) => o.cost > (o.charged as number) + LOSS_TOLERANCE);

  const skus = new Map<string, SkuResult>();
  for (const o of withCharge) {
    const q = o.lines.reduce((s, l) => s + l.qty, 0);
    if (!q) continue;
    for (const l of o.lines) {
      const sh = l.qty / q;
      const s = skus.get(l.sku) ?? { sku: l.sku, name: l.name, units: 0, orders: 0, cost: 0, charged: 0, adjustments: 0, costPerUnit: 0, result: 0 };
      s.units += l.qty; s.orders += sh; s.cost += o.cost * sh; s.charged += (o.charged as number) * sh; s.adjustments += o.adjustments * sh;
      skus.set(l.sku, s);
    }
  }
  const skuList: SkuResult[] = [...skus.values()].map((s) => ({ ...s, costPerUnit: s.units ? s.cost / s.units : 0, result: s.charged - s.cost }));
  const heavy = [...pk.values()].filter((p) => p.entered > 0 && p.billed > p.entered * HEAVY_RATIO);

  const maxBucket = Math.max(...[...buckets.values()].map((v) => v.amount));
  const bucketList: BucketTotal[] = [...buckets.entries()].map(([bucket, v]) => ({
    bucket, amount: v.amount, adjustment: ADJ_BUCKETS.has(bucket),
    share: total ? v.amount / total : 0, relative: v.amount / maxBucket,
  }));
  return {
    hasShopify: hasShop,
    totals: { spend: total, adjustments: adjTotal, matched, unmatched, adjustmentShare: total ? adjTotal / total : 0 },
    matchRate: total ? matched / total : 0,
    lines: { total: lines, matched: matchedLines, unmatched: lines - matchedLines },
    lineMatchRate: lines ? matchedLines / lines : 0,
    buckets: bucketList,
    orders: shipped.map((o) => ({ id: o.id, date: o.date, charged: o.charged, cost: o.cost, adjustments: o.adjustments, packages: o.pkgs.size, result: o.charged === null ? null : o.charged - o.cost })),
    shipping: { ordersWithCharge: withCharge.length, customerPaid: charged, upsCostOfCharged: costOfCharged, result: charged - costOfCharged, ordersLosing: losing.length },
    skus: skuList,
    packages: { count: pk.size, heavyCount: heavy.length, heavyCost: heavy.reduce((s, p) => s + p.cost, 0), heavyShare: pk.size ? heavy.length / pk.size : 0 },
  };
}
