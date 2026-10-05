import { parseDelimited } from './lib.mjs'

let pass=0, fail=0
const t=(name, got, want)=>{
  const g=JSON.stringify(got), w=JSON.stringify(want)
  if(g===w){pass++; console.log(`  ok   ${name}`)}
  else{fail++; console.log(`  FAIL ${name}\n        got  ${g}\n        want ${w}`)}
}

t('simple comma',
  parseDelimited('a,b\n1,2'), [{a:'1',b:'2'}])

t('semicolon (Dutch/German Excel)',
  parseDelimited('a;b\n1;2'), [{a:'1',b:'2'}])

t('tab separated',
  parseDelimited('a\tb\n1\t2'), [{a:'1',b:'2'}])

t('UTF-8 BOM stripped from first header',
  parseDelimited('﻿a,b\n1,2'), [{a:'1',b:'2'}])

t('quoted field containing a comma',
  parseDelimited('a,b\n"x,y",2'), [{a:'x,y',b:'2'}])

t('doubled quotes become one quote',
  parseDelimited('a,b\n"he said ""hi""",2'), [{a:'he said "hi"',b:'2'}])

t('embedded newline inside quotes',
  parseDelimited('a,b\n"line1\nline2",2'), [{a:'line1\nline2',b:'2'}])

t('CRLF line endings',
  parseDelimited('a,b\r\n1,2\r\n3,4'), [{a:'1',b:'2'},{a:'3',b:'4'}])

t('blank lines skipped',
  parseDelimited('a,b\n1,2\n\n3,4'), [{a:'1',b:'2'},{a:'3',b:'4'}])

t('ragged row: missing trailing cell becomes empty string',
  parseDelimited('a,b,c\n1,2'), [{a:'1',b:'2',c:''}])

t('header-only file yields no rows',
  parseDelimited('a,b'), [])

t('empty string yields no rows',
  parseDelimited(''), [])

t('values are trimmed',
  parseDelimited('a,b\n  1  ,  2  '), [{a:'1',b:'2'}])

t('semicolon file where values contain commas (decimal comma)',
  parseDelimited('price;qty\n1,50;3'), [{price:'1,50',qty:'3'}])

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail?1:0)
