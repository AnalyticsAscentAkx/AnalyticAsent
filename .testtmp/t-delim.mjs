import { parseDelimited } from './lib.mjs'
const show=(n,s)=>{
  const r=parseDelimited(s)
  console.log(`${n}\n   cols: ${JSON.stringify(Object.keys(r[0]||{}))}\n   row1: ${JSON.stringify(r[0]||null)}\n`)
}
show('A) comma CSV whose description field is full of semicolons',
`part,description,price
A-1,"drill; tap; ream; deburr; inspect",12.50
A-2,"mill; turn; grind; polish; clean",19.00`)

show('B) comma CSV with tabs inside a quoted field',
`part,notes,price
A-1,"see\tdrawing\trev\tC\there",12.50`)

show('C) genuine semicolon CSV (European export)',
`part;description;price
A-1;bracket;12,50`)

show('D) comma CSV, one column, no delimiters at all in data',
`part
A-1
A-2`)
