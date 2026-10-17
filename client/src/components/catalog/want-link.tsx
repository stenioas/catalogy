import type { Ref } from 'react'

import { Share2 } from 'lucide-react'

import { Button } from '../ui/button'

export type WantLinkProps = {
  slug: string
  title: string
  ref?: Ref<HTMLAnchorElement>
}

export type WantIconLinkProps = Pick<WantLinkProps, 'slug' | 'title' | 'ref'> & {
  size?: 'md' | 'lg'
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

const largeShareButtonClassName =
  'size-10 rounded-full bg-[color-mix(in_srgb,var(--primary)_16%,white)] p-0 text-[var(--ink)] hover:bg-[color-mix(in_srgb,var(--primary)_24%,white)] hover:text-[var(--ink)] md:size-12'

export const SHARE_LABEL = 'Compartilhar'

const frostedShareClassName =
  'bg-[color-mix(in_srgb,var(--primary)_16%,white)] text-[var(--ink)] hover:bg-[color-mix(in_srgb,var(--primary)_24%,white)] hover:text-[var(--ink)]'

const besidePriceShareClassName =
  `${frostedShareClassName} size-10 rounded-full p-0 md:h-11 md:gap-2 md:rounded-lg md:px-4 md:text-base`

const responsiveShareClassName = `${besidePriceShareClassName} md:max-[919px]:w-full`

const footerShareClassName = `${besidePriceShareClassName} md:w-full`

const columnShareClassName = `${frostedShareClassName} h-11 w-full gap-2 rounded-lg px-4 text-base`

export function ProductShareButton({
  slug,
  title,
  ref,
  placement = 'responsive',
}: WantLinkProps & { placement?: 'responsive' | 'column' | 'footer' }) {
  const column = placement === 'column'
  const className = column ? columnShareClassName : placement === 'footer' ? footerShareClassName : responsiveShareClassName
  return (
    <Button asChild variant="ghost" className={className}>
      <a ref={ref} href={waUrl(slug, title)} target="_blank" rel="noopener noreferrer">
        <Share2 aria-hidden="true" className="size-4" />
        <span className={column ? undefined : 'max-md:sr-only'}>{SHARE_LABEL}</span>
      </a>
    </Button>
  )
}

export function WantIconLink({ slug, title, ref, size = 'md' }: WantIconLinkProps) {
  const large = size === 'lg'
  return (
    <Button asChild variant="ghost" size="icon" className={large ? largeShareButtonClassName : shareButtonClassName}>
      <a
        ref={ref}
        href={waUrl(slug, title)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={WHATSAPP_LABEL}
      >
        <Share2 aria-hidden="true" className={large ? 'size-5 md:size-6' : 'size-4 md:size-5'} />
      </a>
    </Button>
  )
}
