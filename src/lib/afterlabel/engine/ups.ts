// Synced from afterlabel packages/engine/src/ups.ts at 17b1fe4999360365a3ee476c036e0d28552d4f2d (2026-10-23). Do not edit here: change it in the afterlabel repo and run scripts/sync-afterlabel.sh.
/* eslint-disable */
import { num } from "./csv";
import type { ChargeLine } from "./types";
import { UPS_HEADERS_250, UPS_PII_HEADERS_250 } from "./ups-headers-250";

export type UpsFieldKey =
  | "tracking" | "lead" | "ref1" | "ref2" | "cat" | "desc" | "net"
  | "entered" | "billed" | "date"
  | "invoiceId" | "code" | "zone" | "service"
  | "class" | "pref1" | "pref2" | "pref3" | "pref4" | "pref5";

export interface UpsFieldDef {
  key: UpsFieldKey;
  label: string;
  /** Free-form header patterns, tried in order, against lower-cased trimmed headers. */
  patterns: RegExp[];
  /** 0-based position in a headerless file. Legacy guess from the free tool; -1 = none. */
  fallbackIndex: number;
}

// The first ten fields and their patterns are carried over unchanged from index.html.
// Later fields are new and never claim a column an earlier field wants.
export const UPS_FIELDS: UpsFieldDef[] = [
  { key: "tracking", label: "Tracking number", patterns: [/^tracking number$/, /tracking/], fallbackIndex: 20 },
  { key: "lead", label: "Lead shipment number", patterns: [/lead shipment/], fallbackIndex: 13 },
  { key: "ref1", label: "Shipment reference 1", patterns: [/shipment reference number 1/, /reference (number |no\.? ?)?1/], fallbackIndex: 15 },
  { key: "ref2", label: "Shipment reference 2", patterns: [/shipment reference number 2/, /reference (number |no\.? ?)?2/], fallbackIndex: 16 },
  { key: "cat", label: "Charge category code", patterns: [/^charge category code$/, /charge category/], fallbackIndex: 34 },
  { key: "desc", label: "Charge description", patterns: [/^charge description$/, /charge description/, /description/], fallbackIndex: 45 },
  { key: "net", label: "Net amount", patterns: [/^net amount$/, /net (charge|amount)/, /^net$/], fallbackIndex: 52 },
  { key: "entered", label: "Entered weight", patterns: [/^entered weight$/, /entered weight/], fallbackIndex: 26 },
  { key: "billed", label: "Billed weight", patterns: [/^billed weight$/, /billed weight/], fallbackIndex: 28 },
  { key: "date", label: "Date", patterns: [/transaction date/, /invoice date/, /ship date/, /date/], fallbackIndex: 11 },
  // TODO: confirm these four header names against the Billing Center header-row fixture.
  { key: "invoiceId", label: "Invoice number", patterns: [/^invoice number$/], fallbackIndex: -1 },
  { key: "code", label: "Charge code", patterns: [/^charge code$/], fallbackIndex: -1 },
  { key: "zone", label: "Zone", patterns: [/^zone$/], fallbackIndex: -1 },
  { key: "service", label: "Service level", patterns: [/^service level$/, /^service$/], fallbackIndex: -1 },
  // Variant-map only: no free-form patterns, so these never claim a column in a generic CSV.
  { key: "class", label: "Charge classification code", patterns: [], fallbackIndex: -1 },
  { key: "pref1", label: "Package reference 1", patterns: [], fallbackIndex: -1 },
  { key: "pref2", label: "Package reference 2", patterns: [], fallbackIndex: -1 },
  { key: "pref3", label: "Package reference 3", patterns: [], fallbackIndex: -1 },
  { key: "pref4", label: "Package reference 4", patterns: [], fallbackIndex: -1 },
  { key: "pref5", label: "Package reference 5", patterns: [], fallbackIndex: -1 },
];

export type UpsVariantId = "billing-250" | "billing-270" | "summary-32" | "freeform";

export interface UpsVariantMap {
  id: UpsVariantId;
  /** Bump when the map for this variant changes. */
  version: number;
  columnCount: number;
  /**
   * Exact header names by field, from the official header-row file. When null the adapter
   * falls back to free-form header matching.
   */
  headerNames: Partial<Record<UpsFieldKey, string>> | null;
  /** Full exact header row of the layout, when known. */
  headerList?: readonly string[];
}

// 250: names taken from a public vendor sample's header row (see ups-headers-250.ts), single source.
// date maps to Transaction Date, the same column the headerless default (index 11) and the free tool use.
// serviceLevel stays unmapped. TODO: no confirmed service column; candidates are "Original Service
// Description" or the Charge Description of the FRT row. Confirm against the Billing Center data dictionary.
// TODO(fixture): official UPS Billing Center header-row files for 250 and 270, and the 32 column
// summary, go in packages/engine/test/fixtures/ups/. 270 and the summary have no public source yet:
// do not invent header lists. Until then they use free-form header matching.
export const UPS_VARIANT_MAPS: UpsVariantMap[] = [
  {
    id: "billing-250", version: 1, columnCount: 250,
    headerNames: {
      invoiceId: "Invoice Number", date: "Transaction Date", tracking: "Tracking Number", lead: "Lead Shipment Number",
      ref1: "Shipment Reference Number 1", ref2: "Shipment Reference Number 2",
      pref1: "Package Reference Number 1", pref2: "Package Reference Number 2", pref3: "Package Reference Number 3",
      pref4: "Package Reference Number 4", pref5: "Package Reference Number 5",
      cat: "Charge Category Code", class: "Charge Classification Code", code: "Charge Description Code",
      desc: "Charge Description", net: "Net Amount", entered: "Entered Weight", billed: "Billed Weight", zone: "Zone",
    },
    headerList: UPS_HEADERS_250,
  },
  { id: "billing-270", version: 0, columnCount: 270, headerNames: null }, // TODO: no public source
  { id: "summary-32", version: 0, columnCount: 32, headerNames: null }, // TODO: no public source
];

const PII_HEADERS: ReadonlySet<string> = new Set(UPS_PII_HEADERS_250.map((h) => h.toLowerCase()));

/** Picks the variant by column count. Anything else is "freeform". */
export function detectUpsVariant(columnCount: number, maps: UpsVariantMap[] = UPS_VARIANT_MAPS): UpsVariantMap {
  return (
    maps.find((m) => m.columnCount === columnCount) ?? {
      id: "freeform", version: 0, columnCount, headerNames: null,
    }
  );
}

export type UpsMapping = Partial<Record<UpsFieldKey, number>>;
export type MapSource = "variant-header-names" | "freeform-headers" | "headerless-defaults" | "override";

export interface UpsParseResult {
  lines: ChargeLine[];
  mapping: UpsMapping;
  header: string[] | null;
  variant: UpsVariantMap;
  mapSource: MapSource;
}

export interface UpsParseOptions {
  /** Manual column mapper result. Keys given here win over detection. -1 = not in file. */
  override?: UpsMapping;
  /** Test hook and future fixture hook: replaces the shipped variant maps. */
  variantMaps?: UpsVariantMap[];
}

function mapByPatterns(first: string[]): UpsMapping {
  const used = new Set<number>();
  const map: UpsMapping = {};
  for (const f of UPS_FIELDS) {
    for (const p of f.patterns) {
      const i = first.findIndex((hd, ix) => !used.has(ix) && p.test(hd));
      if (i >= 0) { map[f.key] = i; used.add(i); break; }
    }
  }
  return map;
}

function mapByExactNames(first: string[], names: Partial<Record<UpsFieldKey, string>>): UpsMapping {
  const map: UpsMapping = {};
  for (const [key, name] of Object.entries(names) as [UpsFieldKey, string][]) {
    const i = first.indexOf(name.trim().toLowerCase());
    if (i >= 0) map[key] = i;
  }
  return map;
}

/** Adapter for UPS billing CSVs (headered or headerless) and any merchant CSV with similar headers. */
export function parseUps(rows: string[][], opts: UpsParseOptions = {}): UpsParseResult {
  if (!rows.length) return { lines: [], mapping: {}, header: null, variant: detectUpsVariant(0, opts.variantMaps), mapSource: "freeform-headers" };
  const first = rows[0].map((x) => x.trim().toLowerCase());
  const variant = detectUpsVariant(rows[0].length, opts.variantMaps);

  let map: UpsMapping = {};
  let mapSource: MapSource = "freeform-headers";
  if (variant.headerNames) {
    map = mapByExactNames(first, variant.headerNames);
    mapSource = "variant-header-names";
  }
  if (map.tracking == null || map.net == null) {
    map = mapByPatterns(first);
    mapSource = "freeform-headers";
  }

  let header: string[] | null;
  let body: string[][];
  if (map.tracking != null && map.net != null) {
    header = rows[0];
    body = rows.slice(1);
  } else {
    header = null;
    body = rows;
    map = {};
    for (const f of UPS_FIELDS) map[f.key] = f.fallbackIndex >= 0 && f.fallbackIndex < rows[0].length ? f.fallbackIndex : -1;
    mapSource = "headerless-defaults";
  }
  if (opts.override) { map = { ...map, ...opts.override }; mapSource = "override"; }

  // Privacy: no field may read a personal data column, whether detected or chosen in the manual
  // mapper. Headerless files are checked against the variant's known header list by position.
  const names = header ?? variant.headerList ?? null;
  if (names) {
    for (const k of Object.keys(map) as UpsFieldKey[]) {
      const i = map[k];
      if (i != null && i >= 0 && PII_HEADERS.has((names[i] ?? "").trim().toLowerCase())) map[k] = -1;
    }
  }

  return { lines: body.map((r) => toChargeLine(r, map, header)), mapping: map, header, variant, mapSource };
}

function toChargeLine(r: string[], m: UpsMapping, header: string[] | null): ChargeLine {
  const g = (k: UpsFieldKey) => {
    const i = m[k];
    return i != null && i >= 0 ? (r[i] ?? "").trim() : "";
  };
  // Privacy: raw keeps only mapped columns, and parseUps has already unmapped personal data columns.
  const raw: Record<string, string> = {};
  for (const f of UPS_FIELDS) {
    const i = m[f.key];
    if (i == null || i < 0 || r[i] === undefined) continue;
    raw[header?.[i] ?? `col${i + 1}`] = r[i].trim();
  }
  return {
    carrier: "UPS",
    invoiceId: g("invoiceId"),
    invoiceDate: g("date"),
    trackingNo: g("tracking"),
    leadTrackingNo: g("lead"),
    refs: [g("ref1"), g("ref2"), g("pref1"), g("pref2"), g("pref3"), g("pref4"), g("pref5")],
    chargeCategory: g("cat").toUpperCase(),
    chargeCode: g("code"),
    chargeClassification: g("class").toUpperCase(),
    description: g("desc"),
    net: num(g("net")),
    enteredWeight: num(g("entered")),
    billedWeight: num(g("billed")),
    zone: g("zone"),
    serviceLevel: g("service"),
    raw,
  };
}
