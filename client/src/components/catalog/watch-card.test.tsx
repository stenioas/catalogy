import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Product } from '@catalogo/shared'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { WatchCard } from './watch-card'

const clientRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..')

const sampleProduct: Product = {
  slug: 'seculus-kit-com-cantil',
  title: 'Seculus',
  price: 369.9,
  listPrice: 450,
  images: ['foto-principal.webp', 'foto-extra.jpg'],
}

function renderWatchCard(product: Product = sampleProduct) {
  return render(
    <MemoryRouter>
      <WatchCard product={product} />
    </MemoryRouter>,
  )
}

describe('WatchCard (SV-13, SV-14)', () => {
  afterEach(() => {
    cleanup()
  })

  it('requests the first image at /catalog/products/<slug>/img/<file> (CAT-28)', () => {
    renderWatchCard()
    const img = screen.getByRole('img', { name: 'Seculus' })
    expect(img.getAttribute('src')).toBe(
      '/catalog/products/seculus-kit-com-cantil/img/foto-principal.webp',
    )
  })

  it('uses object-contain in a square frame and the first images entry (CAT-52, CAT-53)', () => {
    renderWatchCard()
    const img = screen.getByRole('img', { name: 'Seculus' })
    expect(img.className).toMatch(/\bobject-contain\b/)
    const frame = img.parentElement
    expect(frame).not.toBeNull()
    expect(frame?.className).toMatch(/\baspect-square\b/)
    const backgroundTokens = frame?.className.match(/\bbg-\S+/g) ?? []
    expect(backgroundTokens.filter((token) => token !== 'bg-transparent')).toEqual([])
    expect(frame?.getAttribute('style') ?? '').not.toMatch(/background/i)
    expect(img.getAttribute('src')).toContain('foto-principal.webp')
    expect(img.getAttribute('src')).not.toContain('foto-extra.jpg')
  })

  it('aligns card text to the left (CAT-54)', () => {
    renderWatchCard()
    const textBlock = screen.getByTestId('watch-card-body')
    expect(textBlock.className).toMatch(/\btext-left\b/)
  })

  it('links photo, title and price to /relogio/<slug> without seller query (SV-13)', () => {
    renderWatchCard()
    const cardLink = screen.getByTestId('watch-card-link')
    expect(cardLink.getAttribute('href')).toBe('/relogio/seculus-kit-com-cantil')
    expect(cardLink.getAttribute('href')).not.toMatch(/seller=/)
  })

  it('keeps Enviar no WhatsApp outside the card navigation link (SV-14)', () => {
    renderWatchCard()
    expect(screen.getByRole('heading', { name: 'Seculus' })).toBeTruthy()
    expect(screen.getByTestId('price-current').textContent).toBe('R$ 369,90')
    const wantLink = screen.getByRole('link', { name: 'Enviar no WhatsApp' })
    expect(wantLink.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/\?text=/)
    expect(screen.getByTestId('watch-card-link').contains(wantLink)).toBe(false)
  })
})

function classTokens(className: string): string[] {
  return className.split(/\s+/).filter(Boolean)
}

function blockBody(css: string, selector: string): string {
  const pattern = new RegExp(`(?:^|\\n)\\s*${selector}\\s*\\{`)
  const start = css.search(pattern)
  if (start < 0) throw new Error(`missing ${selector}`)
  const open = css.indexOf('{', start)
  let depth = 0
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth += 1
    else if (css[i] === '}') {
      depth -= 1
      if (depth === 0) return css.slice(open + 1, i)
    }
  }
  throw new Error(`unclosed ${selector}`)
}

function decl(block: string, name: string): string | undefined {
  const match = block.match(new RegExp(`(?:^|[\\s;{])${name}\\s*:\\s*([^;}]+)`))
  return match?.[1]?.trim()
}

describe('WatchCard frame (SV-36, SV-37, SV-38, SV-39, SV-40, SV-42)', () => {
  afterEach(() => {
    cleanup()
  })

  it('uses a 1px border, an 18px radius and no shadow (SV-36)', () => {
    const { container } = renderWatchCard()
    const card = container.querySelector('[data-slot="card"]')
    expect(card).not.toBeNull()
    const tokens = classTokens((card as HTMLElement).className)
    expect(tokens).toContain('rounded-[18px]')
    expect(tokens).toContain('border-[1px]')
    expect(tokens).toContain('shadow-none')
    expect(tokens.some((token) => /^shadow-(?!none$)/.test(token))).toBe(false)
    expect(tokens).not.toContain('ring-1')
    expect(tokens.some((token) => token.startsWith('drop-shadow'))).toBe(false)
  })

  it('paints the card with the canvas token in light and surface-tile-2 in dark (SV-37, SV-38)', () => {
    const { container } = renderWatchCard()
    const card = container.querySelector('[data-slot="card"]') as HTMLElement
    expect(classTokens(card.className)).toContain('bg-card')

    const css = readFileSync(join(clientRoot, 'src/index.css'), 'utf8')
    const root = blockBody(css, ':root')
    const dark = blockBody(css, '\\.dark')
    expect(decl(root, '--card')).toBe('var(--canvas)')
    expect(decl(dark, '--card')).toBe('var(--surface-tile-2)')
    expect(decl(root, '--canvas')).toBe('#ffffff')
    expect(decl(root, '--surface-tile-2')).toBe('#2a2a2c')
  })

  it('lets the photo use the full width of the card (SV-39)', () => {
    const { container } = renderWatchCard()
    const card = container.querySelector('[data-slot="card"]') as HTMLElement
    const img = screen.getByRole('img', { name: 'Seculus' })
    const frame = img.parentElement as HTMLElement
    expect(classTokens(frame.className)).toContain('w-full')
    expect(classTokens(img.className)).toContain('w-full')
    expect(classTokens(card.className)).toContain('p-0')

    let node: HTMLElement | null = frame
    while (node && node !== card) {
      const tokens = classTokens(node.className)
      expect(tokens.some((token) => /^(?:[\w-]+:)?px-/.test(token))).toBe(false)
      expect(tokens.some((token) => /^(?:[\w-]+:)?px-\[/.test(token))).toBe(false)
      expect(tokens.some((token) => /^(?:[\w-]+:)?p-\[/.test(token))).toBe(false)
      node = node.parentElement
    }
  })

  it('pads the title, price and button by 24px on the sides and bottom (SV-40)', () => {
    renderWatchCard()
    const body = screen.getByTestId('watch-card-body')
    const actions = screen.getByTestId('watch-card-actions')
    const heading = screen.getByRole('heading', { name: 'Seculus' })
    const price = screen.getByTestId('price-current')
    const button = screen.getByRole('link', { name: 'Enviar no WhatsApp' })
    const img = screen.getByRole('img', { name: 'Seculus' })

    expect(classTokens(body.className)).toContain('px-[24px]')
    expect(body.contains(heading)).toBe(true)
    expect(body.contains(price)).toBe(true)
    expect(body.contains(img)).toBe(false)

    expect(classTokens(actions.className)).toContain('px-[24px]')
    expect(classTokens(actions.className)).toContain('pb-[24px]')
    expect(actions.contains(button)).toBe(true)
    expect(actions.contains(img)).toBe(false)
    expect(screen.getByTestId('watch-card-link').contains(button)).toBe(false)
  })

  it('paints the card title with foreground (SV-42)', () => {
    renderWatchCard()
    const heading = screen.getByRole('heading', { name: 'Seculus' })
    expect(classTokens(heading.className)).toContain('text-foreground')
    expect(classTokens(heading.className)).not.toContain('text-ink')
  })
})
