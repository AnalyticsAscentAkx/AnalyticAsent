// Report (engine) to the shape the page renders, plus the coarse buckets analytics may carry.
// Field mapping only: every number comes from the engine's Report; nothing is recomputed here.

import type { Report } from './engine'
import type { Stats } from './waitlist-client'

export interface OrderRow {
  id: string
  date: string
  charged: number | null
  cost: number
  adj: number
  packages: number
  result: number | null
}

export interface SkuRow {
  sku: string
  name: string
  units: number
  orders: number
  cost: number
  charged: number
  adj: number
  perUnit: number
  result: number
}

export function viewModel(r: Report) {
  const orders: OrderRow[] = r.orders.map((o) => ({ id: o.id, date: o.date, charged: o.charged, cost: o.cost, adj: o.adjustments, packages: o.packages, result: o.result }))
  return {
    total: r.totals.spend,
    adjTotal: r.totals.adjustments,
    matched: r.totals.matched,
    unmatched: r.totals.unmatched,
    buckets: new Map(r.buckets.map((b) => [b.bucket, b.amount])),
    bucketList: r.buckets,
    adjShare: r.totals.adjustmentShare,
    matchRate: r.matchRate,
    shipResult: r.shipping.result,
    withChargeCount: r.shipping.ordersWithCharge,
    shipped: orders,
    withCharge: orders.filter((o) => o.charged !== null),
    charged: r.shipping.customerPaid,
    costOfCharged: r.shipping.upsCostOfCharged,
    losingCount: r.shipping.ordersLosing,
    skus: r.skus.map((s): SkuRow => ({ sku: s.sku, name: s.name, units: s.units, orders: s.orders, cost: s.cost, charged: s.charged, adj: s.adjustments, perUnit: s.costPerUnit, result: s.result })),
    pkgCount: r.packages.count,
    heavyCount: r.packages.heavyCount,
    heavyCost: r.packages.heavyCost,
    heavyShare: r.packages.heavyShare,
    hasShop: r.hasShopify,
  }
}

export type ViewModel = ReturnType<typeof viewModel>

/** A rate as a 0 to 100 step of 10, so analytics never carries an exact figure. */
export const bucket10 = (v: number) => Math.max(0, Math.min(100, Math.round((Number.isFinite(v) ? v : 0) * 10) * 10))
export const lineBucket = (n: number) => (n < 100 ? 'lt_100' : n < 1000 ? '100_999' : n < 10000 ? '1k_9k' : '10k_plus')

/** The five figures a waitlist entry may carry. The sample is not the visitor's own data, so it carries none. */
export function statsOf(r: Report, sample: boolean): Stats | null {
  if (sample) return null
  return {
    spend: Math.round(r.totals.spend),
    adjustmentShare: +r.totals.adjustmentShare.toFixed(3),
    orders: r.orders.length,
    losing: r.shipping.ordersLosing,
    matchedShare: +r.matchRate.toFixed(3),
  }
}
