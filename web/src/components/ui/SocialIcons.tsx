import type { ReactNode, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Base({ size = 18, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export function InstagramIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </Base>
  )
}

export function FacebookIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M14 8h2V5h-2c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.2L16 11h-3V9c0-.6.4-1 1-1z" fill="currentColor" stroke="none" />
    </Base>
  )
}

export function YoutubeIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M22.5 7.2a3 3 0 0 0-2.1-2.1C18.7 4.5 12 4.5 12 4.5s-6.7 0-8.4.6A3 3 0 0 0 1.5 7.2 31.5 31.5 0 0 0 1 12a31.5 31.5 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.7.6 8.4.6 8.4.6s6.7 0 8.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 23 12a31.5 31.5 0 0 0-.5-4.8z" />
      <path d="M10 15.5v-7l6 3.5-6 3.5z" fill="currentColor" stroke="none" />
    </Base>
  )
}
