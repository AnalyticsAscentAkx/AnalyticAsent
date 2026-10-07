// A zip reader small enough to ship inline.
//
// The report package is a zip of CSVs, so the tool has to open one. Pulling in
// a zip library for that would add more code than the reader itself: the
// central directory is a flat list of entries with offsets, and the browser
// already knows how to inflate — DecompressionStream('deflate-raw') is the
// same code path a download uses. Zip64 is not supported; a register that
// needs it would be larger than four gigabytes.

export interface ZipEntry {
  name: string
  bytes: Uint8Array
}

const SIG_EOCD = 0x06054b50
const SIG_CEN = 0x02014b50
const SIG_LOC = 0x04034b50

export async function readZip(buf: ArrayBuffer): Promise<ZipEntry[]> {
  const dv = new DataView(buf)
  const u8 = new Uint8Array(buf)
  // End of central directory: scan back from the end, allowing for a comment.
  let eocd = -1
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 22 - 65535); i--) {
    if (dv.getUint32(i, true) === SIG_EOCD) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new Error('Not a zip file: no end-of-central-directory record.')
  const count = dv.getUint16(eocd + 10, true)
  let p = dv.getUint32(eocd + 16, true)
  const decoder = new TextDecoder('utf-8')
  const out: ZipEntry[] = []
  for (let k = 0; k < count; k++) {
    if (dv.getUint32(p, true) !== SIG_CEN) throw new Error('Corrupt zip: bad central directory entry.')
    const method = dv.getUint16(p + 10, true)
    const csize = dv.getUint32(p + 20, true)
    const usize = dv.getUint32(p + 24, true)
    const nlen = dv.getUint16(p + 28, true)
    const xlen = dv.getUint16(p + 30, true)
    const clen = dv.getUint16(p + 32, true)
    const lho = dv.getUint32(p + 42, true)
    const name = decoder.decode(u8.subarray(p + 46, p + 46 + nlen))
    p += 46 + nlen + xlen + clen
    if (name.endsWith('/')) continue
    if (dv.getUint32(lho, true) !== SIG_LOC) throw new Error(`Corrupt zip: bad local header for ${name}.`)
    const lnlen = dv.getUint16(lho + 26, true)
    const lxlen = dv.getUint16(lho + 28, true)
    const start = lho + 30 + lnlen + lxlen
    const data = u8.subarray(start, start + csize)
    let bytes: Uint8Array
    if (method === 0) bytes = data
    else if (method === 8) bytes = await inflateRaw(data, usize)
    else throw new Error(`Unsupported compression method ${method} for ${name}.`)
    out.push({ name, bytes })
  }
  return out
}

async function inflateRaw(data: Uint8Array, expected: number): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate-raw')
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(ds)
  const ab = await new Response(stream).arrayBuffer()
  const out = new Uint8Array(ab)
  if (expected && out.byteLength !== expected) {
    throw new Error('Inflated size does not match the zip directory; the archive may be damaged.')
  }
  return out
}

/** The bytes a UTF-8 file must not contain, roughly: this catches Latin-1
 *  exports (rule 306) without a full decoder pass. */
export function looksUtf8(bytes: Uint8Array): boolean {
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    return true
  } catch {
    return false
  }
}
