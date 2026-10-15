import type { Ref } from 'react'

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

export function WantIconLink({ slug, title }: Pick<WantLinkProps, 'slug' | 'title'>) {
  return (
    <Button asChild className="size-11 shrink-0 rounded-full p-0">
      <a
        href={waUrl(slug, title)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={WHATSAPP_LABEL}
      >
        <svg aria-hidden="true" className="size-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.04 2a9.9 9.9 0 0 0-8.55 14.9L2.2 22l5.25-1.38A9.91 9.91 0 1 0 12.04 2Zm0 18.12a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 1 1 6.97 3.85Z" />
          <path d="M16.47 14.37c-.24-.12-1.43-.71-1.65-.79-.22-.08-.38-.12-.54.12-.16.24-.62.79-.76.95-.14.16-.28.18-.52.06-.24-.12-1.03-.38-1.96-1.21-.73-.65-1.22-1.45-1.36-1.69-.14-.24-.01-.37.1-.48.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.41-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.09 3.62.57.25 1.02.4 1.37.51.58.18 1.1.16 1.51.1.46-.07 1.43-.58 1.63-1.13.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" />
        </svg>
      </a>
    </Button>
  )
}
