// Formatting helpers. Estimators read these numbers in a hurry, so quantities
// get thousands separators, money gets two decimals only when it is small
// enough for them to matter, and dimensions stay in millimetres throughout.

export const eur = (v: number) =>
  v >= 1000
    ? `€${v.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`
    : `€${v.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const qty = (v: number) => v.toLocaleString('en-GB')

export const pct = (v: number, dp = 1) => `${(v * 100).toFixed(dp)}%`

export const mm = (v: number) => (v >= 100 ? v.toFixed(0) : v.toFixed(1))

export const dims = (l: number, w: number, h: number, rotational: boolean) =>
  rotational ? `Ø${mm(w)} × ${mm(l)}` : `${mm(l)} × ${mm(w)} × ${mm(h)}`

export const shortDate = (iso: string) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}
