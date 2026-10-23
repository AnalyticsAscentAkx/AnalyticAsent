// Synced from afterlabel packages/engine/src/orders.ts at 4ca8eb7e47a3e62fbf09c1ea3c865f130ab5e375 (2026-10-23). Do not edit here: change it in the afterlabel repo and run scripts/sync-afterlabel.sh.
/* eslint-disable */
import { norm, num } from "./csv";
import type { ShopOrder } from "./types";

/** Shopify Orders export (one row per line item, order fields on the first row). */
export function parseShopifyOrders(rows: string[][]): Map<string, ShopOrder> {
  const hd = rows[0].map((x) => x.trim().toLowerCase());
  const ix = (n: string) => hd.indexOf(n);
  const c = { name: ix("name"), date: ix("created at"), ship: ix("shipping"), qty: ix("lineitem quantity"), item: ix("lineitem name"), sku: ix("lineitem sku") };
  if (c.name < 0) throw new Error("The Shopify file has no “Name” column. Use Orders → Export from Shopify admin.");
  const orders = new Map<string, ShopOrder>();
  for (const r of rows.slice(1)) {
    const id = (r[c.name] || "").trim();
    if (!id) continue;
    let o = orders.get(id);
    if (!o) { o = { id, date: "", charged: null, lines: [] }; orders.set(id, o); }
    if (c.date >= 0 && r[c.date] && !o.date) o.date = r[c.date].slice(0, 10);
    if (c.ship >= 0 && r[c.ship] !== undefined && r[c.ship].trim() !== "" && o.charged === null) o.charged = num(r[c.ship]);
    if (c.item >= 0 && r[c.item]) o.lines.push({ sku: (c.sku >= 0 && r[c.sku]) || r[c.item], name: r[c.item], qty: Math.max(1, num(r[c.qty]) || 1) });
  }
  return orders;
}

/** ShipStation shipments export: normalised tracking number to order number. */
export function parseShipStation(rows: string[][]): Map<string, string> {
  const hd = rows[0].map((x) => x.trim().toLowerCase());
  const oi = hd.findIndex((x) => /order ?(#|number|no)/.test(x));
  const ti = hd.findIndex((x) => /tracking/.test(x));
  if (oi < 0 || ti < 0) throw new Error("The ShipStation file needs order number and tracking number columns.");
  return new Map(rows.slice(1).filter((r) => r[ti]).map((r) => [norm(r[ti]), r[oi]] as [string, string]));
}
