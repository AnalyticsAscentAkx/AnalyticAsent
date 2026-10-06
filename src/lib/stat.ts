// How large a case-study metric may be set.
//
// Most metric values are numbers — "95%", "±36.5%", "<1s" — and those carry
// the page at a display size. A few are words: "Listing", "Expected",
// "Loss → profit". Set at the same size, three words in a three-column row
// collide, and the first pass of this design did exactly that on the home
// page. Words get the size words need; numbers keep the size numbers earn.
export function statSize(value: string): string {
  // Unit suffixes count as part of the number: "<1s", "3h", "12kg", "4x".
  const numeric = /^[\d±+\-−<>~.,%\s€£$]+(?:[a-zA-Z]{1,3})?$/.test(value.trim())
  return numeric
    ? 'stat font-display text-2xl font-medium'
    : 'stat font-display text-lg font-semibold leading-tight'
}
