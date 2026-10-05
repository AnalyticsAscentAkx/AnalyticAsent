// The numbers the site states as fact. If the FAQ says 192 units, the engine
// has to produce 192 units, and degenerate inputs must not reach the screen as
// Infinity or NaN.
import { evaluate, sensitivity, forecast, PRESETS, profile, clean, parseDelimited } from './.build/lib.mjs'
import { ok, near, section, report } from './assert.mjs'

const model = (price, variable, fixed, volume, capacity) => ({
  currency: 'EUR', unitName: 'unit', unitPlural: 'units', periodName: 'month',
  pricePerUnit: price,
  variableCosts: variable.map((v, i) => ({ id: `c${i}`, name: `c${i}`, perUnit: v })),
  fixedCostsPerPeriod: fixed, volumePerPeriod: volume, capacityPerPeriod: capacity,
})

section("the FAQ's own worked example: 11,500 fixed, 60 contribution, 192 units")
const r = evaluate(model(100, [40], 11500, 240))
near('contribution per unit', r.contributionPerUnit, 60)
near('break-even volume', r.breakEvenVolume, 11500 / 60)
ok('rounds up to the 192 the FAQ states', Math.ceil(r.breakEvenVolume) === 192)
near('margin of safety', r.marginOfSafety, (240 - 11500 / 60) / 240)
near('profit', r.profit, 60 * 240 - 11500)

section('degenerate inputs never reach the screen as Infinity or NaN')
const zero = evaluate(model(40, [40], 1000, 100))
ok('zero contribution is flagged impossible', zero.impossible === true)
ok('zero contribution: break-even null, not Infinity', zero.breakEvenVolume === null)
ok('zero contribution: margin of safety null', zero.marginOfSafety === null)
const neg = evaluate(model(30, [40], 1000, 100))
ok('negative contribution is flagged impossible', neg.impossible === true)
ok('negative contribution: break-even null', neg.breakEvenVolume === null)
ok('price of zero: ratio is 0, not NaN', evaluate(model(0, [0], 1000, 100)).contributionRatio === 0)
const novol = evaluate(model(100, [40], 1000, 0))
ok('volume of zero: margin of safety null', novol.marginOfSafety === null)
ok('volume of zero: profit still finite', Number.isFinite(novol.profit))
ok('capacity of zero: utilisation null', evaluate(model(100, [40], 1000, 100, 0)).capacityUtilisation === null)

section('sensitivity ranks by how far it moves the answer, regardless of sign')
const s = sensitivity(model(100, [40, 10], 11500, 240), 0.2)
ok('all values finite', s.every((x) => Number.isFinite(x.low) && Number.isFinite(x.high)))
ok('ordered by absolute swing, descending',
   s.every((x, i) => i === 0 || s[i - 1].swing >= x.swing),
   s.map((x) => `${x.input}:${x.swing.toFixed(0)}`).join(' '))

section('forecast is honest about what it does not know')
const flat = forecast([100, 100, 100, 100, 100, 100, 100, 100], 6)
ok('a flat series stays flat', flat.points.every((p) => Math.abs(p.value - 100) < 1e-6))
ok('a flat series has no interval to speak of',
   flat.points.every((p) => Math.abs(p.high - p.low) < 1e-6))
const lin = forecast([10, 20, 30, 40, 50, 60, 70, 80], 6)
ok('a linear series extrapolates', Math.abs(lin.points[0].value - 90) < 1e-6)
const noisy = forecast([10, 80, 20, 90, 15, 85, 25, 95], 6)
ok('an erratic series produces a visibly wider band',
   noisy.points[0].high - noisy.points[0].low > lin.points[0].high - lin.points[0].low)
ok('the band widens with the horizon',
   noisy.points[5].high - noisy.points[5].low >= noisy.points[0].high - noisy.points[0].low)
ok('every forecast value is finite',
   noisy.points.every((p) => [p.value, p.low, p.high].every(Number.isFinite)))
ok('one data point does not crash it', Array.isArray(forecast([5], 6).points))
ok('no data does not crash it', Array.isArray(forecast([], 6).points))

section('every shipped preset evaluates')
for (const p of PRESETS) {
  const e = evaluate(p.model)
  ok(`${p.id}`, e.impossible || Number.isFinite(e.breakEvenVolume),
     e.breakEvenVolume === null ? 'impossible' : `break-even ${e.breakEvenVolume.toFixed(0)}`)
}

section('the Data Clinic finds what it claims to find')
const rows = parseDelimited(
`Part No,Material,Size,Qty,Unit Price,Order Date
A-1001,AL 6061-T6,120 x 60 x 20 mm,250,12.50,2026-01-14
A-1002,al 6061 t6,4.72 x 2.36,250,13.75,14/01/2026
A-1003,AL6061T6,120x60x20,,12.50,2026-01-15
A-1004,Ti-6Al-4V,40 x 120,1000,48.20,2026-02-01
A-1004,Ti-6Al-4V,40 x 120,1000,48.20,2026-02-01`)
const p = profile(rows)
const titles = p.issues.map((i) => i.title).join(' | ')
ok('reads five rows and six columns', rows.length === 5 && p.columns.length === 6)
ok('spots the duplicate row', /duplicate/i.test(titles))
ok('spots units inside values', /unit/i.test(titles))
ok('spots mixed date formats', /date format/i.test(titles))
ok('spots the same material spelled several ways', /more than one way/i.test(titles))
ok('spots the empty cell', /empty/i.test(titles))
ok('de-duplicating removes exactly one row', clean(rows, p).length === 4)

report()
