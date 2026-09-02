/** Identidade visual da Paróquia Nossa Senhora das Graças — Parque Santa Maria */
export const BRAND = {
  name: 'Paróquia Nossa Senhora das Graças',
  shortName: 'Nossa Senhora das Graças',
  location: 'Parque Santa Maria',
  /** Azul mariano do site (#2e5a88) */
  marianBlue: '#2e5a88',
  /** Logo preta — fundo transparente */
  logoSrc: '/images/logo-paroquia.png',
  /** Logo azul mariano — fundo transparente */
  logoBlueSrc: '/images/logo-paroquia.png',
  /** Logo branca — para sidebar/footer escuro */
  logoWhiteSrc: '/images/logo-paroquia-source.png',
  /** Arquivo original enviado pela paróquia */
  logoColorSrc: '/images/logo-paroquia-source.png',
  logoAlt: 'Brasão da Paróquia Nossa Senhora das Graças — Parque Santa Maria',
} as const

export type LogoTone = 'black' | 'blue' | 'color' | 'white'

export function logoSrcForTone(tone: LogoTone) {
  if (tone === 'blue' || tone === 'color') return BRAND.logoBlueSrc
  if (tone === 'white') return BRAND.logoWhiteSrc
  return BRAND.logoSrc
}

export function logoClassForTone(_tone: LogoTone) {
  return ''
}
