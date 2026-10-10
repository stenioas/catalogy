import type { Ref } from 'react'

import { Button } from '../ui/button'

export type WantLinkProps = {
  slug: string
  title: string
  ref?: Ref<HTMLAnchorElement>
}

const WHATSAPP_LABEL = 'Enviar no WhatsApp'

export function waUrl(slug: string, title: string): string {
  const watchUrl = `${window.location.origin}/relogio/${slug}`
  const message = `Olá, tenho interesse no ${title}. ${watchUrl}`
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}

export function WantLink({ slug, title, ref }: WantLinkProps) {
  return (
    <Button asChild className="min-h-11 w-full rounded-full">
      <a ref={ref} href={waUrl(slug, title)} target="_blank" rel="noopener noreferrer">
        {WHATSAPP_LABEL}
      </a>
    </Button>
  )
}
