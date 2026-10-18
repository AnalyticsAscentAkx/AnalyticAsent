// The published guides, in one place. The hub page, the sitemap and the links
// from the tool pages all read this list, so a guide cannot be live in one and
// missing from another. Each guide's own page.tsx holds its metadata; the
// title and line here are the short forms used on the hub.

export type Guide = {
  slug: string
  title: string
  line: string
  /** The tool the guide answers questions about. */
  tool: { name: string; href: string }
}

export const GUIDES: Guide[] = [
  {
    slug: 'dora-register-of-information-validation-rules-805-806-807',
    title: 'DORA register errors 805, 806 and 807 explained',
    line:
      'What EBA validation errors 805, 806 and 807 mean, which of them reject a Register of Information, and how to fix each one before you resubmit.',
    tool: { name: 'DORA Register Checker', href: '/dora-register' },
  },
  {
    slug: 'dora-register-of-information-deadline-by-country',
    title: 'DORA Register of Information deadlines by NCA',
    line:
      'The 2026 submission windows, reference date, portal and file format for BaFin, DNB, NBB, CSSF, the Central Bank of Ireland, ACPR, MFSA and FMA.',
    tool: { name: 'DORA Register Checker', href: '/dora-register' },
  },
  {
    slug: 'dora-lei-vs-euid-ict-provider-identifier',
    title: 'LEI or EUID for each ICT provider?',
    line:
      'Which identifier each ICT provider needs, what to do for non-EU providers or a lapsed LEI, and which mistakes get the file rejected.',
    tool: { name: 'DORA Register Checker', href: '/dora-register' },
  },
  {
    slug: 'dora-register-of-information-templates-explained',
    title: 'DORA Register of Information templates explained',
    line:
      'What goes in each template, B_01.01 to B_99.01: the key fields, the 22 foreign keys and why rule 807 rejects a file.',
    tool: { name: 'DORA Register Checker', href: '/dora-register' },
  },
]

export const guidePath = (slug: string) => `/guides/${slug}`
