import { parseDimensions, mapColumns, shapeFor, stockVolumeCm3, gradeKey } from './lib.mjs'
let pass=0,fail=0
const ok=(n,v,extra='')=>{v?pass++:fail++;console.log(`  ${v?'ok  ':'FAIL'} ${n}${extra?' -> '+extra:''}`)}

console.log('--- dimension parsing, the way RFQs actually write it ---')
const cases = [
  ['120 x 60 x 20 mm',        [120,60,20], false],
  ['120x60x20',               [120,60,20], false],
  ['120 X 60 X 20',           [120,60,20], false],
  ['120 × 60 × 20',           [120,60,20], false],   // unicode multiplication sign
  ['Ø40 x 120',               null,        false],   // diameter + length
  ['4.72" x 2.36"',           null,        true ],   // inches -> converted
  ['4.72 in x 2.36 in',       null,        true ],
  ['120,5 x 60,2',            null,        false],   // decimal comma
]
for (const [input, expect, conv] of cases) {
  const r = parseDimensions(input)
  const got = r ? r.dims.map(n=>Math.round(n*100)/100) : null
  const line = `${JSON.stringify(input).padEnd(22)} -> ${r?`[${got}] converted=${r.converted}`:'null'}`
  if (expect) ok(line, r && JSON.stringify(got)===JSON.stringify(expect))
  else { ok(line, r !== null); if(r && conv!==undefined) ok(`   ...marked converted=${conv}`, r.converted===conv) }
}

console.log('\n--- garbage in must not throw ---')
for (const bad of ['', 'n/a', 'see drawing', '---', 'TBC', '0', 'x', '12']) {
  let threw=false, r=null
  try { r = parseDimensions(bad) } catch(e){ threw=true }
  ok(`${JSON.stringify(bad).padEnd(14)} -> ${threw?'THREW':JSON.stringify(r&&r.dims)}`, !threw)
}

console.log('\n--- column mapping against real ERP header spellings ---')
const headerSets = [
  ['Part No','Material','Length','Width','Height','Annual Qty','Unit Price'],
  ['ITEM_NO','MATL','LEN_MM','WID_MM','THK_MM','EAU','COST'],
  ['Drawing','Alloy','Dimensions','Qty','Price','Quoted On'],
  ['part number','specification','blank size','order qty','rate'],
]
for (const h of headerSets) {
  const m = mapColumns(h)
  console.log(`   ${JSON.stringify(h).slice(0,64)}`)
  console.log(`     -> ${JSON.stringify(m)}`)
  ok('     maps a part id', !!m.publicId)
  ok('     maps a material', !!m.grade)
}

console.log('\n--- volume is positive and finite for every shape ---')
for (const fam of ['bracket','shaft','housing','plate','bushing','flange','manifold','pin']) {
  const sh = shapeFor(fam)
  const v = stockVolumeCm3(sh, 100, 50, 25)
  ok(`${fam} (${sh}) volume ${v.toFixed(1)} cm3`, Number.isFinite(v) && v > 0)
}

console.log(`\n${pass} passed, ${fail} failed`)
