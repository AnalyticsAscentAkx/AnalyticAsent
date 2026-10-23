// Synced from afterlabel packages/engine/src/classify.ts at 17b1fe4999360365a3ee476c036e0d28552d4f2d (2026-10-23). Do not edit here: change it in the afterlabel repo and run scripts/sync-afterlabel.sh.
/* eslint-disable */
import type { ChargeLine } from "./types";

/** Named bucket constants. Labels are what the merchant sees. */
export const BUCKET = {
  FUEL: "Fuel surcharge",
  ADDRESS_CORRECTION: "Address corrections",
  RESIDENTIAL: "Residential surcharge",
  DELIVERY_AREA: "Delivery area surcharge",
  HANDLING: "Handling and large package",
  PEAK: "Peak and demand surcharges",
  CORRECTION: "Weight and size corrections",
  RETURNS: "Returns",
  BASE: "Base freight and other",
} as const;

export type Bucket = (typeof BUCKET)[keyof typeof BUCKET];

/** Buckets that count as "adjustment after label". Also true for category ADJ whatever the bucket. */
export const ADJ_BUCKETS: ReadonlySet<string> = new Set<string>([
  BUCKET.ADDRESS_CORRECTION,
  BUCKET.CORRECTION,
]);

export const CATEGORY_ADJUSTMENT = "ADJ";
export const CATEGORY_RETURN = "RTN";

/**
 * Charge code first, description second (see the brief, section 5).
 * TODO: fill from the UPS published charge code list once the fixtures are in.
 * Left empty on purpose: no codes are invented here.
 */
export const UPS_CHARGE_CODE_BUCKETS: Readonly<Record<string, Bucket>> = {};

/**
 * UPS Charge Classification Code values (250 column layout, from the public sample's data).
 * Only FSC maps to a bucket by itself; the others are too coarse (ACC covers residential, address
 * correction, delivery area...) so they fall through to the description rules.
 */
export const CLASS = {
  FRT: "FRT", // transportation
  FSC: "FSC", // fuel
  ACC: "ACC", // accessorial
  TAX: "TAX",
  GOV: "GOV",
  BRK: "BRK", // brokerage
  EXM: "EXM", // exemptions
  MSC: "MSC", // miscellaneous
  INF: "INF", // informational
} as const;

// Description rules, tested in this order. Order matters (first match wins).
export const FUEL_RE = /fuel/;
export const ADDRESS_CORRECTION_RE = /address correction/;
export const RESIDENTIAL_RE = /residential surcharge|^residential/;
export const DELIVERY_AREA_RE = /delivery area|remote area|extended area/;
export const HANDLING_RE = /additional handling|large package|over ?max|oversize/;
export const PEAK_RE = /peak|demand surcharge/;
export const CORRECTION_RE = /correction|audit|dimension|adjust/;
export const RETURNS_RE = /return/;

export function bucketOf(description: string, category: string, chargeCode = "", classification = ""): Bucket {
  const byCode = chargeCode ? UPS_CHARGE_CODE_BUCKETS[chargeCode] : undefined;
  if (byCode) return byCode;
  if (classification === CLASS.FSC) return BUCKET.FUEL;
  const d = description.toLowerCase();
  if (FUEL_RE.test(d)) return BUCKET.FUEL;
  if (ADDRESS_CORRECTION_RE.test(d)) return BUCKET.ADDRESS_CORRECTION;
  if (RESIDENTIAL_RE.test(d)) return BUCKET.RESIDENTIAL;
  if (DELIVERY_AREA_RE.test(d)) return BUCKET.DELIVERY_AREA;
  if (HANDLING_RE.test(d)) return BUCKET.HANDLING;
  if (PEAK_RE.test(d)) return BUCKET.PEAK;
  if (CORRECTION_RE.test(d) || category === CATEGORY_ADJUSTMENT) return BUCKET.CORRECTION;
  if (category === CATEGORY_RETURN || RETURNS_RE.test(d)) return BUCKET.RETURNS;
  return BUCKET.BASE;
}

export function isAdjustment(category: string, bucket: string): boolean {
  return category === CATEGORY_ADJUSTMENT || ADJ_BUCKETS.has(bucket);
}

export function classifyLine(line: ChargeLine): { bucket: Bucket; adjustment: boolean } {
  const category = line.chargeCategory.toUpperCase();
  const bucket = bucketOf(line.description, category, line.chargeCode, line.chargeClassification ?? "");
  return { bucket, adjustment: isAdjustment(category, bucket) };
}
