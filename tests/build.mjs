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

// The contact route, bundled with the '@/' alias resolved, so its waitlist branch can be called in node.
const route = await build({
  entryPoints: ['src/app/api/contact/route.ts'],
  bundle: true,
  format: 'esm',
  write: false,
  platform: 'neutral',
  alias: { '@': './src' },
})
writeFileSync('tests/.build/route.mjs', route.outputFiles[0].text)

// Afterlabel: the synced engine and the page's pure helpers, then the waitlist dialog and the hero visual as
// components (React stays external, so the test renders them with the site's own react-dom/server).
const al = await build({
  stdin: {
    contents: `
      export * as engine from '../src/lib/afterlabel/engine/index.ts'
      export * from '../src/lib/afterlabel/waitlist-client.ts'
      export * from '../src/lib/afterlabel/pricing.ts'
      export * from '../src/lib/afterlabel/view.ts'
    `,
    resolveDir: 'tests',
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  write: false,
  platform: 'neutral',
})
writeFileSync('tests/.build/afterlabel.mjs', al.outputFiles[0].text)

writeFileSync('tests/.build/tsconfig.jsx.json', JSON.stringify({ compilerOptions: { jsx: 'react-jsx' } }))
for (const [entry, out] of [
  ['src/app/afterlabel/Waitlist.tsx', 'afterlabel-waitlist.mjs'],
  ['src/app/afterlabel/RouteField.tsx', 'afterlabel-routefield.mjs'],
]) {
  const r = await build({
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    write: false,
    platform: 'node',
    jsx: 'automatic',
    // tsconfig.json says jsx: preserve (Next compiles JSX itself), which esbuild would otherwise follow.
    tsconfig: 'tests/.build/tsconfig.jsx.json',
    external: ['react', 'react-dom', 'react-dom/server', 'react/jsx-runtime'],
    // next has no exports map, so node needs the .js on its subpaths (next/link -> next/link.js).
    plugins: [{ name: 'next-external', setup: (b) => b.onResolve({ filter: /^next\// }, (a) => ({ path: `${a.path}.js`, external: true })) }],
    alias: { '@': './src' },
    logLevel: 'error',
  })
  writeFileSync(`tests/.build/${out}`, r.outputFiles[0].text)
}
