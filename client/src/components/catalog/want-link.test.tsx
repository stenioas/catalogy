import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { waUrl, WantIconLink, WantLink } from './want-link'

const clientRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..')

const LINK_NAME = 'Enviar no WhatsApp'

function decodeWaText(href: string): string {
  const url = new URL(href)
  const text = url.searchParams.get('text')
  if (text === null) throw new Error('missing text query param')
  return decodeURIComponent(text)
}

describe('WantLink (SV-17–SV-22)', () => {
  afterEach(() => {
    cleanup()
  })

  it('uses Enviar no WhatsApp as the visible and accessible link name (SV-17)', () => {
    render(<WantLink slug="seculus" title="Seculus" />)
    expect(screen.getByRole('link', { name: LINK_NAME }).textContent).toBe(LINK_NAME)
  })

  it('builds wa.me/?text= without a phone number in the path (SV-17, SV-21)', () => {
    const href = waUrl('addiesdive', 'Addiesdive')
    expect(href).toMatch(/^https:\/\/wa\.me\/\?text=/)
    expect(href).not.toMatch(/^https:\/\/wa\.me\/\d/)
    render(<WantLink slug="addiesdive" title="Addiesdive" />)
    const linkHref = screen.getByRole('link', { name: LINK_NAME }).getAttribute('href')
    expect(linkHref).toMatch(/^https:\/\/wa\.me\/\?text=/)
    expect(linkHref).not.toMatch(/^https:\/\/wa\.me\/\d/)
  })

  it('encodes Olá, tenho interesse no {title}. {absolute watch url without query} (SV-18, SV-19)', () => {
    const slug = 'curren-8363'
    const title = 'CURREN 8363'
    const watchUrl = `${window.location.origin}/product/${slug}`
    const href = waUrl(slug, title)
    expect(decodeWaText(href)).toBe(`Olá, tenho interesse no ${title}. ${watchUrl}`)
    expect(watchUrl).not.toContain('?')
  })

  it('opens in a new tab with noopener noreferrer (SV-22)', () => {
    render(<WantLink slug="seculus" title="Seculus" />)
    const link = screen.getByRole('link', { name: LINK_NAME })
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('does not use the whatsapp:// scheme (SV-21)', () => {
    expect(waUrl('seculus', 'Seculus')).not.toMatch(/^whatsapp:\/\//)
    render(<WantLink slug="seculus" title="Seculus" />)
    const href = screen.getByRole('link', { name: LINK_NAME }).getAttribute('href')
    expect(href).not.toMatch(/whatsapp:\/\//)
  })
})

describe('WantLink pill (SV-28)', () => {
  afterEach(() => {
    cleanup()
  })

  it('is a full-width Button pill with 44px min height, centered white text on #0066cc', () => {
    render(<WantLink slug="seculus" title="Seculus" />)
    const link = screen.getByRole('link', { name: LINK_NAME })

    expect(link.getAttribute('data-slot')).toBe('button')
    expect(link.className).toMatch(/\bw-full\b/)
    expect(link.className).toMatch(/\bmin-h-11\b/)
    expect(link.className).toMatch(/\brounded-full\b/)
    expect(link.className).toMatch(/\bjustify-center\b/)
    expect(link.className).toMatch(/\bitems-center\b/)
    expect(link.className).toMatch(/\btext-primary-foreground\b/)
    expect(link.className).toMatch(/\bbg-primary\b/)

    const css = readFileSync(join(clientRoot, 'src/index.css'), 'utf8')
    expect(css).toMatch(/--primary:\s*#0066cc/)
  })
})

describe('WantIconLink (catalog compact action)', () => {
  afterEach(() => {
    cleanup()
  })

  it('has the WhatsApp accessible name and a decorative SVG', () => {
    render(<WantIconLink slug="seculus" title="Seculus" />)
    const link = screen.getByRole('link', { name: LINK_NAME })
    const icon = link.querySelector('svg')

    expect(icon).not.toBeNull()
    expect(icon?.getAttribute('aria-hidden')).toBe('true')
    expect(link.textContent).toBe('')
  })

  it('provides a 44px square icon-only target', () => {
    render(<WantIconLink slug="seculus" title="Seculus" />)
    const link = screen.getByRole('link', { name: LINK_NAME })

    expect(link.className).toMatch(/\bsize-11\b/)
    expect(link.querySelector('svg')).not.toBeNull()
  })

  it('uses the same sharing URL and message as WantLink', () => {
    const slug = 'addiesdive'
    const title = 'Addiesdive'
    render(
      <>
        <WantIconLink slug={slug} title={title} />
        <WantLink slug={slug} title={title} />
      </>,
    )
    const [iconLink, textLink] = screen.getAllByRole('link', { name: LINK_NAME })
    const href = iconLink.getAttribute('href')

    expect(href).toBe(textLink.getAttribute('href'))
    expect(href).toBe(waUrl(slug, title))
    expect(decodeWaText(href!)).toBe(
      `Olá, tenho interesse no ${title}. ${window.location.origin}/product/${slug}`,
    )
  })

  it('opens only the wa.me share URL without a phone number or nested product link', () => {
    render(<WantIconLink slug="seculus" title="Seculus" />)
    const link = screen.getByRole('link', { name: LINK_NAME })
    const url = new URL(link.getAttribute('href')!)

    expect(url.hostname).toBe('wa.me')
    expect(url.pathname).toBe('/')
    expect(url.searchParams.has('text')).toBe(true)
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('opens in a new tab with noopener noreferrer', () => {
    render(<WantIconLink slug="seculus" title="Seculus" />)
    const link = screen.getByRole('link', { name: LINK_NAME })

    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })
})
