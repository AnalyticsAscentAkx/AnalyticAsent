// Formatting only. Every value passed in comes from the engine's Report.

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export { usd }
export const money = (v: number) => usd.format(v)
export const pct = (v: number) => (Number.isFinite(v) ? (v * 100).toFixed(1) : '0.0') + '%'
/** A result with its sign written out: U+2212 minus for a loss, plus for a gain. */
export const signed = (v: number) => (v < 0 ? '−' : '+') + money(Math.abs(v))
