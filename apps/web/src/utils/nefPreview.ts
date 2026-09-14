const HEADER_BYTES = 2 * 1024 * 1024
const SCAN_BYTES = 12 * 1024 * 1024
const MIN_JPEG = 8_000
const MAX_JPEG = 8 * 1024 * 1024

function u16(view: DataView, offset: number, le: boolean) {
  if (offset < 0 || offset + 2 > view.byteLength) return 0
  return view.getUint16(offset, le)
}

function u32(view: DataView, offset: number, le: boolean) {
  if (offset < 0 || offset + 4 > view.byteLength) return 0
  return view.getUint32(offset, le)
}

function entryNumbers(view: DataView, entry: number, le: boolean) {
  const tag = u16(view, entry, le)
  const type = u16(view, entry + 2, le)
  const count = u32(view, entry + 4, le)
  const unit = type === 3 ? 2 : type === 4 ? 4 : 0
  if (!unit || count === 0 || count > 32) return { tag, values: [] as number[] }

  const total = unit * count
  let pos = entry + 8
  if (total > 4) pos = u32(view, entry + 8, le)

  const values: number[] = []
  for (let i = 0; i < count; i += 1) {
    const at = pos + i * unit
    values.push(unit === 2 ? u16(view, at, le) : u32(view, at, le))
  }
  return { tag, values }
}

function collectJpegRanges(bytes: Uint8Array) {
  if (bytes.length < 8) return [] as Array<{ offset: number; length: number }>
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const b0 = view.getUint8(0)
  const b1 = view.getUint8(1)
  const le = b0 === 0x49 && b1 === 0x49
  const be = b0 === 0x4d && b1 === 0x4d
  if (!le && !be) return []
  if (u16(view, 2, le) !== 42) return []

  const ranges: Array<{ offset: number; length: number }> = []
  const visited = new Set<number>()
  const queue = [u32(view, 4, le)]

  while (queue.length) {
    const ifd = queue.pop() ?? 0
    if (!ifd || visited.has(ifd) || ifd + 2 > view.byteLength) continue
    visited.add(ifd)

    const count = u16(view, ifd, le)
    if (count === 0 || count > 256) continue

    let jpegOffset = 0
    let jpegLength = 0
    let stripOffset = 0
    let stripLength = 0
    let compression = 0

    for (let i = 0; i < count; i += 1) {
      const entry = ifd + 2 + i * 12
      if (entry + 12 > view.byteLength) break
      const { tag, values } = entryNumbers(view, entry, le)
      const value = values[0] ?? 0
      if (tag === 0x0103) compression = value
      if (tag === 0x0201) jpegOffset = value
      if (tag === 0x0202) jpegLength = value
      if (tag === 0x0111) stripOffset = value
      if (tag === 0x0117) stripLength = value
      if ((tag === 0x014a || tag === 0x8769) && value) queue.push(value)
    }

    if (jpegOffset && jpegLength >= MIN_JPEG && jpegLength <= MAX_JPEG) {
      ranges.push({ offset: jpegOffset, length: jpegLength })
    }
    if ((compression === 6 || compression === 7) && stripOffset && stripLength >= MIN_JPEG && stripLength <= MAX_JPEG) {
      ranges.push({ offset: stripOffset, length: stripLength })
    }

    const next = u32(view, ifd + 2 + count * 12, le)
    if (next) queue.push(next)
  }

  return ranges.sort((a, b) => b.length - a.length)
}

function extractLargestJpeg(bytes: Uint8Array) {
  let best: Uint8Array | null = null
  let from = 0
  while (from < bytes.length - 3) {
    let start = -1
    for (let i = from; i < bytes.length - 2; i += 1) {
      if (bytes[i] === 0xff && bytes[i + 1] === 0xd8 && bytes[i + 2] === 0xff) {
        start = i
        break
      }
    }
    if (start === -1) break
    let end = -1
    for (let i = start + 3; i < bytes.length - 1; i += 1) {
      if (bytes[i] === 0xff && bytes[i + 1] === 0xd9) {
        end = i + 2
        break
      }
    }
    if (end === -1) break
    const slice = bytes.subarray(start, end)
    if (slice.length >= MIN_JPEG && (!best || slice.length > best.length)) best = slice
    from = start + 3
  }
  return best ? best.slice() : null
}

async function blobIfJpeg(bytes: Uint8Array) {
  if (bytes.length < MIN_JPEG || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null
  const blob = new Blob([new Uint8Array(bytes)], { type: 'image/jpeg' })
  try {
    const bitmap = await createImageBitmap(blob)
    bitmap.close()
    return blob
  } catch {
    return null
  }
}

async function jpegFromTiffTags(file: File) {
  const header = new Uint8Array(await file.slice(0, Math.min(file.size, HEADER_BYTES)).arrayBuffer())
  for (const range of collectJpegRanges(header)) {
    const end = Math.min(file.size, range.offset + range.length)
    if (range.offset >= file.size || end - range.offset < MIN_JPEG) continue
    const bytes = new Uint8Array(await file.slice(range.offset, end).arrayBuffer())
    const blob = await blobIfJpeg(bytes)
    if (blob) return blob
  }
  return null
}

async function jpegFromScan(file: File) {
  const bytes = new Uint8Array(await file.slice(0, Math.min(file.size, SCAN_BYTES)).arrayBuffer())
  const jpeg = extractLargestJpeg(bytes)
  if (!jpeg) return null
  return blobIfJpeg(jpeg)
}

/** Gera uma URL de miniatura a partir do JPEG embutido no NEF. */
export async function extractNefPreviewUrl(file: File): Promise<string> {
  try {
    const blob = (await jpegFromTiffTags(file)) ?? (await jpegFromScan(file))
    if (!blob) return ''
    return URL.createObjectURL(blob)
  } catch {
    return ''
  }
}
