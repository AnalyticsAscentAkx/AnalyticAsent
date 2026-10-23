// Synced from afterlabel packages/engine/src/match.ts at 17b1fe4999360365a3ee476c036e0d28552d4f2d (2026-10-23). Do not edit here: change it in the afterlabel repo and run scripts/sync-afterlabel.sh.
/* eslint-disable */
import { digits, norm } from "./csv";
import type { ChargeLine, ShopOrder } from "./types";

export interface MatchSources {
  shop?: Map<string, ShopOrder> | null;
  /** Normalised tracking number to order number (ShipStation export). */
  shipstation?: Map<string, string> | null;
}

export interface Matcher {
  /** Order key for a line, or null when the line cannot be tied to an order. */
  match(line: ChargeLine): string | null;
  /** Normalised key to the Shopify order, when a Shopify export was given. */
  shopKeys: Map<string, ShopOrder>;
}

/**
 * Order of attempts:
 * 1. Tracking number, then lead shipment number (multi-package), through the ShipStation export.
 * 2. Reference 1, then reference 2, normalised, against Shopify order names.
 * 3. Digits-only fallback on the same references, only when the digits identify one order.
 * Without a Shopify export, reference 1 itself becomes the order key.
 */
export function createMatcher(src: MatchSources): Matcher {
  const shop = src.shop ?? null;
  const ss = src.shipstation ?? null;
  const shopNorm = new Map<string, string>();
  const shopDig = new Map<string, string | null>();
  const shopKeys = new Map<string, ShopOrder>();
  if (shop) {
    for (const o of shop.values()) {
      const key = norm(o.id);
      shopKeys.set(key, o);
      shopNorm.set(key, key);
      const d = digits(o.id);
      if (d) shopDig.set(d, shopDig.has(d) ? null : key);
    }
  }
  const matchRef = (ref: string): string | null => {
    if (!ref) return null;
    const n = norm(ref);
    if (shopNorm.has(n)) return n;
    const d = digits(ref);
    if (d && shopDig.get(d)) return shopDig.get(d)!;
    return null;
  };
  return {
    shopKeys,
    match(line) {
      let ok: string | null = null;
      if (ss) {
        const o = ss.get(norm(line.trackingNo)) || ss.get(norm(line.leadTrackingNo));
        if (o) ok = matchRef(o) || (shop ? null : norm(o));
      }
      if (!ok && shop) ok = matchRef(line.refs[0] ?? "") || matchRef(line.refs[1] ?? "");
      if (!ok && !shop) {
        const ref = line.refs[0] ?? "";
        if (ref) ok = norm(ref);
      }
      return ok;
    },
  };
}
