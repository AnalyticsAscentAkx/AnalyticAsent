import { parseDelimited, profile, clean } from './lib.mjs'
let pass=0,fail=0
const t=(n,g,w)=>{const a=JSON.stringify(g),b=JSON.stringify(w);
  if(a===b){pass++;console.log(`  ok   ${n}`)}else{fail++;console.log(`  FAIL ${n}\n        got  ${a}\n        want ${b}`)}}

console.log('--- delimiter sniffing, adversarial ---')
t('pipe delimited',
  Object.keys(parseDelimited('a|b|c\n1|2|3')[0]), ['a','b','c'])
t('comma file, semicolons in EVERY text cell',
  Object.keys(parseDelimited('part,ops\nA,"x; y; z"\nB,"p; q; r"\nC,"s; t; u"')[0]), ['part','ops'])
t('semicolon file, commas in every cell (decimal comma)',
  Object.keys(parseDelimited('part;price;qty\nA;1,50;3\nB;2,75;4')[0]), ['part','price','qty'])
t('quoted header containing the delimiter',
  Object.keys(parseDelimited('"part, rev",price\nA-1,10')[0]), ['part, rev','price'])
t('blank header cell gets a name instead of vanishing',
  Object.keys(parseDelimited('a,,c\n1,2,3')[0]), ['a','Column 2','c'])
t('ragged file still uses header width',
  parseDelimited('a,b,c\n1,2,3\n4,5').length, 2)

console.log('\n--- profiling claims ---')
const rows = parseDelimited(
`Part No,Material,Size,Qty,Unit Price,Order Date
A-1001,AL 6061-T6,120 x 60 x 20 mm,250,12.50,2026-01-14
A-1002,al 6061 t6,4.72 x 2.36,250,13.75,14/01/2026
A-1003,AL6061T6,120x60x20,,12.50,2026-01-15
A-1004,Ti-6Al-4V,40 x 120,1000,48.20,2026-02-01
A-1004,Ti-6Al-4V,40 x 120,1000,48.20,2026-02-01`)
t('rows parsed', rows.length, 5)
const p = profile(rows)
t('column count', p.columns.length, 6)
const issues = p.issues.map(i=>i.title ?? i.headline ?? JSON.stringify(i).slice(0,60))
console.log('   issues found:'); issues.forEach(i=>console.log('     -', i))
const c = clean(rows, p)
t('de-duplicated to 4 rows', c.length, 4)

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail?1:0)
