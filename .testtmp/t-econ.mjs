import { evaluate, sensitivity, forecast, PRESETS } from './lib.mjs'
let pass=0,fail=0
const ok=(n,v)=>{v?pass++:fail++;console.log(`  ${v?'ok  ':'FAIL'} ${n}`)}
const approx=(n,g,w,tol=1e-9)=>{const v=Math.abs(g-w)<=tol;v?pass++:fail++;
  console.log(`  ${v?'ok  ':'FAIL'} ${n} -> ${g}${v?'':` (want ${w})`}`)}

const mk=(price,varCosts,fixed,vol,cap)=>({currency:'EUR',unitName:'unit',unitPlural:'units',
  periodName:'month',pricePerUnit:price,
  variableCosts:varCosts.map((v,i)=>({id:'c'+i,name:'c'+i,perUnit:v})),
  fixedCostsPerPeriod:fixed,volumePerPeriod:vol,capacityPerPeriod:cap})

console.log('--- the FAQ\'s own worked example: fixed 11500, contribution 60 -> 192 units ---')
const r = evaluate(mk(100,[40],11500,240))
approx('contribution per unit', r.contributionPerUnit, 60)
approx('break-even volume', r.breakEvenVolume, 11500/60)
ok('FAQ rounds 191.67 to 192', Math.ceil(r.breakEvenVolume)===192)
approx('margin of safety at volume 240', r.marginOfSafety, (240-11500/60)/240)
approx('profit', r.profit, 60*240-11500)

console.log('\n--- degenerate inputs must not produce Infinity or NaN ---')
const zero = evaluate(mk(40,[40],1000,100))
ok('zero contribution flagged impossible', zero.impossible===true)
ok('zero contribution: break-even is null, not Infinity', zero.breakEvenVolume===null)
ok('zero contribution: margin of safety null', zero.marginOfSafety===null)
const neg = evaluate(mk(30,[40],1000,100))
ok('negative contribution flagged impossible', neg.impossible===true)
ok('negative contribution: break-even null', neg.breakEvenVolume===null)
const free = evaluate(mk(0,[0],1000,100))
ok('price 0: contributionRatio is 0 not NaN', free.contributionRatio===0)
const novol = evaluate(mk(100,[40],1000,0))
ok('volume 0: margin of safety null not -Infinity', novol.marginOfSafety===null)
ok('volume 0: profit finite', Number.isFinite(novol.profit))
const cap = evaluate(mk(100,[40],1000,100,0))
ok('capacity 0: utilisation null not Infinity', cap.capacityUtilisation===null)

console.log('\n--- sensitivity ---')
const s = sensitivity(mk(100,[40,10],11500,240), 0.2)
console.log('   ranked:', s.map(x=>`${x.input}:${(x.high-x.low).toFixed(0)}`).join('  '))
ok('every sensitivity value finite', s.every(x=>Number.isFinite(x.low)&&Number.isFinite(x.high)))
ok('price dominates a 2-cost model', s[0].input.toLowerCase().includes('price'))

console.log('\n--- forecast ---')
const flat=forecast([100,100,100,100,100,100,100,100],6)
ok('flat series stays flat', flat.points.every(p=>Math.abs(p.value-100)<1e-6))
ok('flat series has zero-width band', flat.points.every(p=>Math.abs(p.high-p.low)<1e-6))
const lin=forecast([10,20,30,40,50,60,70,80],6)
ok('linear series extrapolates', Math.abs(lin.points[0].value-90)<1e-6)
const noisy=forecast([10,80,20,90,15,85,25,95],6)
ok('noisy series produces a WIDER band than a clean one',
   (noisy.points[0].high-noisy.points[0].low) > (lin.points[0].high-lin.points[0].low))
ok('band widens with horizon',
   (noisy.points[5].high-noisy.points[5].low) >= (noisy.points[0].high-noisy.points[0].low))
ok('all forecast values finite', noisy.points.every(p=>[p.value,p.low,p.high].every(Number.isFinite)))
const short=forecast([5],6)
ok('single data point does not crash', Array.isArray(short.points))
const empty=forecast([],6)
ok('empty history does not crash', Array.isArray(empty.points))

console.log('\n--- shipped presets ---')
for(const p of PRESETS){
  const e=evaluate(p.model)
  ok(`${p.id}: break-even ${e.breakEvenVolume===null?'n/a':e.breakEvenVolume.toFixed(0)}`,
     e.impossible || Number.isFinite(e.breakEvenVolume))
}
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail?1:0)
