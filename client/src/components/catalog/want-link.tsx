import type { Ref } from 'react'

import { Share2 } from 'lucide-react'

import { Button } from '../ui/button'

export type WantLinkProps = {
  slug: string
  title: string
  ref?: Ref<HTMLAnchorElement>
}

const WHATSAPP_LABEL = 'Enviar no WhatsApp'

export function waUrl(slug: string, title: string): string {
  const watchUrl = `${window.location.origin}/product/${slug}`
  const message = `Olá, tenho interesse no ${title}. ${watchUrl}`
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}

export function WantLink({ slug, title, ref }: WantLinkProps) {
  return (
    <Button asChild className="min-h-11 w-full rounded-full text-lg">
      <a ref={ref} href={waUrl(slug, title)} target="_blank" rel="noopener noreferrer">
        {WHATSAPP_LABEL}
      </a>
    </Button>
  )
}

const shareButtonClassName =
  'size-8 rounded-full bg-[color-mix(in_srgb,var(--primary)_16%,white)] p-0 text-[var(--ink)] hover:bg-[color-mix(in_srgb,var(--primary)_24%,white)] hover:text-[var(--ink)] md:size-10'

export function WantIconLink({ slug, title }: Pick<WantLinkProps, 'slug' | 'title'>) {
  return (
    <Button asChild variant="ghost" size="icon" className={shareButtonClassName}>
      <a
        href={waUrl(slug, title)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={WHATSAPP_LABEL}
      >
        <Share2 aria-hidden="true" className="size-4 md:size-5" />
      </a>
    </Button>
  )
}
