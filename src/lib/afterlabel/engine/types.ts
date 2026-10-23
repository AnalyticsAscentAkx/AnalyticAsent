// Synced from afterlabel packages/engine/src/types.ts at 4ca8eb7e47a3e62fbf09c1ea3c865f130ab5e375 (2026-10-23). Do not edit here: change it in the afterlabel repo and run scripts/sync-afterlabel.sh.
/* eslint-disable */
export type Carrier = "UPS";

/** Canonical charge line. Every input adapter produces this shape. */
export interface ChargeLine {
  carrier: Carrier;
  invoiceId: string;
  invoiceDate: string;
  trackingNo: string;
  leadTrackingNo: string;
  refs: string[];
  chargeCategory: string;
  chargeCode: string;
  /** UPS Charge Classification Code (FRT, FSC, ACC...), when the layout carries it. */
  chargeClassification?: string;
  description: string;
  net: number;
  enteredWeight: number;
  billedWeight: number;
  zone: string;
  serviceLevel: string;
  /** Only the mapped source fields, keyed by header name. Recipient columns are never kept. */
  raw: Record<string, string>;
}

export interface ShopLine {
  sku: string;
  name: string;
  qty: number;
}

export interface ShopOrder {
  id: string;
  date: string;
  /** What the customer paid for shipping; null when the export has no value. */
  charged: number | null;
  lines: ShopLine[];
}

export interface OrderResult {
  id: string;
  date: string;
  charged: number | null;
  cost: number;
  adjustments: number;
  packages: number;
  /** charged - cost; null when the order has no charged amount. */
  result: number | null;
}

export interface SkuResult {
  sku: string;
  name: string;
  units: number;
  orders: number;
  cost: number;
  charged: number;
  adjustments: number;
  /** cost / units. */
  costPerUnit: number;
  /** charged - cost. */
  result: number;
}

export interface BucketTotal {
  bucket: string;
  amount: number;
  adjustment: boolean;
  /** amount / spend, 0 when spend is 0. */
  share: number;
  /** amount / largest bucket amount, for bar widths. */
  relative: number;
}

export interface Report {
  hasShopify: boolean;
  totals: {
    spend: number;
    adjustments: number;
    matched: number;
    /** Money on lines that could not be tied to an order. Never hidden. */
    unmatched: number;
    /** adjustments / spend, 0 when spend is 0. */
    adjustmentShare: number;
  };
  /** matched / spend by money, 0 when spend is 0. */
  matchRate: number;
  lines: { total: number; matched: number; unmatched: number };
  /** matched lines / total lines. */
  lineMatchRate: number;
  buckets: BucketTotal[];
  /** Orders with non-zero UPS cost. */
  orders: OrderResult[];
  shipping: {
    ordersWithCharge: number;
    customerPaid: number;
    upsCostOfCharged: number;
    result: number;
    ordersLosing: number;
  };
  skus: SkuResult[];
  packages: { count: number; heavyCount: number; heavyCost: number; /** heavyCount / count, 0 when count is 0. */ heavyShare: number };
}
