// What a visitor's file does to the parser. Every case here came from a real
// shape of export, and several of them were failing when the tests were written.
import { parseDelimited, mapColumns, parseDimensions, enrichAll, AlloyTable } from './.build/lib.mjs'
import { ok, eq, section, report } from './assert.mjs'
import { readFileSync } from 'fs'

section('delimiters and quoting')
eq('comma', parseDelimited('a,b\n1,2'), [{ a: '1', b: '2' }])
eq('semicolon, as Excel writes on a Dutch or German machine',
   parseDelimited('a;b\n1;2'), [{ a: '1', b: '2' }])
eq('tab', parseDelimited('a\tb\n1\t2'), [{ a: '1', b: '2' }])
eq('pipe', Object.keys(parseDelimited('a|b|c\n1|2|3')[0]), ['a', 'b', 'c'])
eq('UTF-8 BOM does not corrupt the first header',
   parseDelimited('﻿a,b\n1,2'), [{ a: '1', b: '2' }])
eq('quoted field containing the delimiter',
   parseDelimited('a,b\n"x,y",2'), [{ a: 'x,y', b: '2' }])
eq('doubled quotes collapse to one',
   parseDelimited('a,b\n"he said ""hi""",2'), [{ a: 'he said "hi"', b: '2' }])
eq('newline inside a quoted field',
   parseDelimited('a,b\n"l1\nl2",2'), [{ a: 'l1\nl2', b: '2' }])
eq('CRLF', parseDelimited('a,b\r\n1,2\r\n3,4'), [{ a: '1', b: '2' }, { a: '3', b: '4' }])
eq('blank lines are skipped', parseDelimited('a,b\n1,2\n\n3,4').length, 2)
eq('short row pads rather than shifting', parseDelimited('a,b,c\n1,2'), [{ a: '1', b: '2', c: '' }])
eq('header only', parseDelimited('a,b'), [])
eq('empty input', parseDelimited(''), [])
eq('blank header keeps its column', Object.keys(parseDelimited('a,,c\n1,2,3')[0]), ['a', 'Column 2', 'c'])
eq('quoted header containing the delimiter',
   Object.keys(parseDelimited('"part, rev",price\nA-1,10')[0]), ['part, rev', 'price'])

section('delimiter detection cannot be fooled by punctuation inside values')
// Counting raw characters gets all three of these wrong.
eq('comma file whose description column is full of semicolons',
   Object.keys(parseDelimited('part,ops\nA,"x; y; z"\nB,"p; q; r"\nC,"s; t; u"')[0]),
   ['part', 'ops'])
eq('semicolon file with a decimal comma in every value',
   Object.keys(parseDelimited('part;price;qty\nA;1,50;3\nB;2,75;4')[0]),
   ['part', 'price', 'qty'])
eq('comma file with tabs inside a quoted field',
   Object.keys(parseDelimited('part,notes,price\nA-1,"see\tdrawing\trev\tC",12.50')[0]),
   ['part', 'notes', 'price'])
eq('single-column file stays one column', Object.keys(parseDelimited('part\nA-1\nA-2')[0]), ['part'])

section('column mapping across the ways ERPs name things')
const CORE = ['publicId', 'grade', 'envL', 'envW', 'envH']
const sets = {
  'plain english':  ['Part No', 'Material', 'Length', 'Width', 'Height', 'Annual Qty', 'Unit Price'],
  'underscores':    ['ITEM_NO', 'MATL', 'LEN_MM', 'WID_MM', 'THK_MM', 'EAU', 'COST'],
  'dots':           ['part.no', 'material.spec', 'length.mm', 'width.mm', 'height.mm', 'qty.annual', 'price.eur'],
  'hyphens':        ['PART-NUMBER', 'MATERIAL-GRADE', 'LENGTH-MM', 'WIDTH-MM', 'THICKNESS-MM', 'ANNUAL-QTY', 'UNIT-PRICE'],
  'with units':     ['Part Number', 'Material Grade', 'Length (mm)', 'Width (mm)', 'Height (mm)', 'Annual Volume', 'Unit Price (EUR)'],
  'abbreviated':    ['PN', 'MAT', 'L', 'W', 'H', 'QTY', 'PRICE'],
  'dutch':          ['Artikelnummer', 'Materiaal', 'Lengte', 'Breedte', 'Dikte', 'Aantal', 'Prijs'],
  'german':         ['Teilenummer', 'Werkstoff', 'Länge', 'Breite', 'Höhe', 'Menge', 'Preis'],
}
for (const [label, headers] of Object.entries(sets)) {
  const m = mapColumns(headers)
  const got = CORE.filter((k) => m[k])
  ok(`${label}: maps all five core columns`, got.length === 5, got.join(','))
}

section('dimensions, as RFQs actually write them')
for (const s of ['120 x 60 x 20 mm', '120x60x20', '120 X 60 X 20', '120 × 60 × 20',
                 'Ø40 x 120', '4.72" x 2.36"', '4.72 in x 2.36 in', '120,5 x 60,2']) {
  const r = parseDimensions(s)
  ok(`parses ${JSON.stringify(s)}`, r !== null && r.dims.every(Number.isFinite),
     r ? `[${r.dims.map((n) => Math.round(n * 100) / 100)}] converted=${r.converted}` : 'null')
}
ok('inches are flagged as converted', parseDimensions('4.72" x 2.36"').converted === true)
ok('millimetres are not', parseDimensions('120 x 60 x 20 mm').converted === false)
for (const bad of ['', 'n/a', 'see drawing', '---', 'TBC', 'x']) {
  let threw = false
  try { parseDimensions(bad) } catch { threw = true }
  ok(`${JSON.stringify(bad)} returns rather than throws`, !threw)
}

section('end to end: an underscore ERP export becomes usable parts')
const alloys = new AlloyTable(
  JSON.parse(readFileSync('public/cm-optimiser/alloys.json', 'utf8')).grades,
)
const e = enrichAll(parseDelimited(
`ITEM_NO,MATL,LEN_MM,WID_MM,THK_MM,EAU,COST
A-1001,AL 7075-T6,180,90,35,800,54.20
A-1002,TI 6AL4V,210,45,45,300,188.00
A-1003,AL 6061-T6,120,60,20,2500,22.10`), alloys, 'enriched')
ok('all three rows usable', e.usable === 3 && e.unusable === 0, `${e.usable}/${e.usable + e.unusable}`)
ok('alloy resolved to a family', !!e.rows[0].part.alloyFamily, e.rows[0].part.grade)
ok('dimensions carried through', e.rows[0].part.envL === 180 && e.rows[0].part.envH === 35)
ok('stock mass derived', e.rows[0].part.stockMassKg > 0)

report()
