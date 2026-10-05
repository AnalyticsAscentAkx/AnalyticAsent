// Bundle the pure library code with esbuild, then exercise it in node.
import { build } from 'esbuild'
import { writeFileSync } from 'fs'

const r = await build({
  stdin: {
    contents: `
      export * from '../src/lib/cm/parse.ts'
      export * from '../src/lib/profile.ts'
      export * from '../src/lib/unit-economics.ts'
      export * from '../src/lib/cm/catalogue.ts'
    `,
    resolveDir: '.testtmp',
    loader: 'ts',
  },
  bundle: true, format: 'esm', write: false, platform: 'neutral',
  external: ['read-excel-file/browser'],
})
writeFileSync('.testtmp/lib.mjs', r.outputFiles[0].text)
console.log('bundled', r.outputFiles[0].text.length, 'bytes')
