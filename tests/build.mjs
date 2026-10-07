// Bundle the pure library code so it can be exercised in node without a
// browser. Only modules with no React or DOM dependency belong here.
import { build } from 'esbuild'
import { mkdirSync, writeFileSync } from 'fs'

mkdirSync('tests/.build', { recursive: true })
const r = await build({
  stdin: {
    contents: `
      export * from '../src/lib/cm/parse.ts'
      export * from '../src/lib/cm/catalogue.ts'
      export * from '../src/lib/profile.ts'
      export * from '../src/lib/unit-economics.ts'
      export * as dora from '../src/lib/dora/index.ts'
    `,
    resolveDir: 'tests',
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  write: false,
  platform: 'neutral',
  external: ['read-excel-file/browser'],
})
writeFileSync('tests/.build/lib.mjs', r.outputFiles[0].text)
