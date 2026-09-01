/** URL para iframe embutido do Google Maps a partir das configurações da paróquia. */
export function mapsEmbedSrc(mapsUrl: string | undefined, address: string | undefined) {
  const url = mapsUrl?.trim()
  if (url && (url.includes('output=embed') || url.includes('/maps/embed'))) {
    return url
  }

  const query = url
    ? url
    : address?.trim() || 'Paróquia Nossa Senhora das Graças Parque Santa Maria'

  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`
}
