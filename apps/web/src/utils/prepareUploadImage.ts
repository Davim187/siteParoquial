const HEIC_TYPES = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
])

function jpegFileName(name: string) {
  const base = name.replace(/\.(heic|heif|jpeg|jpg|png|webp)$/i, '')
  return `${base || 'foto'}.jpg`
}

function isHeicByMeta(file: File) {
  const type = file.type.toLowerCase()
  if (HEIC_TYPES.has(type)) return true
  return /\.heic$/i.test(file.name) || /\.heif$/i.test(file.name)
}

function isHeicByHeader(bytes: Uint8Array) {
  if (bytes.length < 12) return false
  const brand = String.fromCharCode(...bytes.slice(4, 12)).toLowerCase()
  return /heic|heif|mif1|msf1|hevc|hevx/.test(brand)
}

async function readFileHeader(file: File) {
  const buffer = await file.slice(0, 12).arrayBuffer()
  return new Uint8Array(buffer)
}

async function convertWithCanvas(file: File) {
  const bitmap = await createImageBitmap(file)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas')

    ctx.drawImage(bitmap, 0, 0)
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => (result ? resolve(result) : reject(new Error('toBlob'))),
        'image/jpeg',
        0.92,
      )
    })

    return new File([blob], jpegFileName(file.name), {
      type: 'image/jpeg',
      lastModified: file.lastModified,
    })
  } finally {
    bitmap.close()
  }
}

async function convertWithHeic2Any(file: File) {
  const { default: heic2any } = await import('heic2any')
  const converted = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.92,
  })
  const blob = Array.isArray(converted) ? converted[0] : converted
  return new File([blob], jpegFileName(file.name), {
    type: 'image/jpeg',
    lastModified: file.lastModified,
  })
}

/**
 * Converte HEIC/HEIF para JPEG no navegador antes do upload.
 */
export async function prepareUploadImage(file: File): Promise<File> {
  const header = await readFileHeader(file)
  const needsConversion = isHeicByMeta(file) || isHeicByHeader(header)
  if (!needsConversion) return file

  const errors: string[] = []

  // Safari/iOS decodifica HEIC nativamente — tentar primeiro
  try {
    return await convertWithCanvas(file)
  } catch (error) {
    errors.push(`canvas: ${error instanceof Error ? error.message : String(error)}`)
  }

  try {
    return await convertWithHeic2Any(file)
  } catch (error) {
    errors.push(`heic2any: ${error instanceof Error ? error.message : String(error)}`)
  }

  console.error('Falha ao converter HEIC:', errors)
  throw new Error(
    'Não foi possível converter esta foto HEIC. No iPhone: Ajustes → Câmera → Formatos → Mais Compatível. Ou envie JPG/PNG.',
  )
}
