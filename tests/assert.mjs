let pass = 0
let fail = 0
const failures = []

export function ok(name, condition, detail = '') {
  if (condition) {
    pass++
  } else {
    fail++
    failures.push(name)
  }
  console.log(`  ${condition ? 'ok  ' : 'FAIL'} ${name}${detail ? ` -> ${detail}` : ''}`)
}

export function eq(name, got, want) {
  const a = JSON.stringify(got)
  const b = JSON.stringify(want)
  ok(name, a === b, a === b ? a : `got ${a}, want ${b}`)
}

export function near(name, got, want, tol = 1e-9) {
  ok(name, Math.abs(got - want) <= tol, `${got}`)
}

export function section(title) {
  console.log(`\n${title}`)
}

export function report() {
  console.log(`\n${pass} passed, ${fail} failed`)
  if (fail) {
    console.log('Failures:')
    failures.forEach((f) => console.log(`  - ${f}`))
  }
  process.exit(fail ? 1 : 0)
}
