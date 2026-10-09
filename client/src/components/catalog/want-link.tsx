import type { Ref } from 'react'

export type WantLinkProps = {
  phone: string
  title: string
  ref?: Ref<HTMLAnchorElement>
}

export function waUrl(phone: string, title: string): string {
  const text = encodeURIComponent(`Olá, tenho interesse no ${title}.`)
  return `https://wa.me/${phone}?text=${text}`
}

export function WantLink({ phone, title, ref }: WantLinkProps) {
  return (
    <a ref={ref} href={waUrl(phone, title)} target="_blank" rel="noopener noreferrer">
      Eu quero!
    </a>
  )
}
