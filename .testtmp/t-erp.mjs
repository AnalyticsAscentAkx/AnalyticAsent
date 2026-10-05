import { parseDelimited, mapColumns, enrichAll, AlloyTable } from './lib.mjs'
import { readFileSync } from 'fs'
let pass=0,fail=0
const ok=(n,v)=>{v?pass++:fail++;console.log(`  ${v?'ok  ':'FAIL'} ${n}`)}

console.log('--- more ERP header conventions ---')
const sets = {
  'SAP-ish underscores': ['MATNR','MAKTX','LAENG_MM','BREIT_MM','HOEHE_MM','MENGE','NETPR'],
  'dotted':              ['part.no','material.spec','length.mm','width.mm','height.mm','qty.annual','price.eur'],
  'hyphenated':          ['PART-NUMBER','MATERIAL-GRADE','LENGTH-MM','WIDTH-MM','THICKNESS-MM','ANNUAL-QTY','UNIT-PRICE'],
  'CamelCase spaced':    ['Part Number','Material Grade','Length (mm)','Width (mm)','Height (mm)','Annual Volume','Unit Price (EUR)'],
  'minimal':             ['PN','MAT','L','W','H','QTY','PRICE'],
}
for (const [label, h] of Object.entries(sets)) {
  const m = mapColumns(h)
  const got = ['publicId','grade','envL','envW','envH'].filter(k=>m[k])
  console.log(`   ${label.padEnd(22)} mapped ${got.length}/5 core: ${got.join(',')}`)
  ok(`   ${label}: id+material+all three dims`, got.length===5)
}

console.log('\n--- end to end: an underscore ERP export reaches usable parts ---')
const csv = `ITEM_NO,MATL,LEN_MM,WID_MM,THK_MM,EAU,COST
A-1001,AL 7075-T6,180,90,35,800,54.20
A-1002,TI 6AL4V,210,45,45,300,188.00
A-1003,AL 6061-T6,120,60,20,2500,22.10`
const rows = parseDelimited(csv)
ok(`parsed ${rows.length} rows`, rows.length===3)
const alloys = new AlloyTable(JSON.parse(readFileSync('public/cm-optimiser/alloys.json','utf8')).grades)
const e = enrichAll(rows, alloys, 'enriched')
console.log(`   usable ${e.usable} / unusable ${e.unusable}`)
console.log(`   mapped columns: ${JSON.stringify(e.map)}`)
ok('every row usable', e.usable===3 && e.unusable===0)
const first = e.rows[0].part
console.log(`   row1: grade=${first.grade} family=${first.alloyFamily} env=${first.envL}x${first.envW}x${first.envH} stockKg=${first.stockMassKg?.toFixed(3)}`)
ok('alloy resolved to a family', !!first.alloyFamily)
ok('dimensions carried through', first.envL===180 && first.envW===90 && first.envH===35)
ok('mass derived', Number.isFinite(first.stockMassKg) && first.stockMassKg>0)

console.log(`\n${pass} passed, ${fail} failed`)
