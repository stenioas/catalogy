import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Product } from '@catalogo/shared'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter, useLocation } from 'react-router-dom'

import { WatchCard } from './watch-card'

const clientRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..')

const sampleProduct: Product = {
  slug: 'seculus-kit-com-cantil',
  title: 'Seculus',
  state: 'Novo',
  availabilityStatus: 'available',
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

function CurrentPath() {
  const { pathname } = useLocation()
  return <output data-testid="current-path">{pathname}</output>
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
    expect(frame?.className).toMatch(/\bmd:aspect-square\b/)
    expect(frame?.className).toMatch(/\bsize-32\b/)
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

  it('links photo, title and price to /product/<slug> without seller query (SV-13)', () => {
    renderWatchCard()
    const cardLink = screen.getByTestId('watch-card-link')
    expect(cardLink.getAttribute('href')).toBe('/product/seculus-kit-com-cantil')
    expect(cardLink.getAttribute('href')).not.toMatch(/seller=/)
  })

  it.each(['Novo', 'Usado', 'Openbox'] as const)('keeps %s in the mobile info column and desktop photo', (state) => {
    renderWatchCard({ ...sampleProduct, state })
    const badges = screen.getAllByTestId('state-badge')
    const price = screen.getByTestId('price-block')
    const photoBadge = badges.find((badge) => badge.className.includes('md:block'))
    const infoBadge = badges.find((badge) => badge.className.includes('md:hidden'))
    const frame = screen.getByTestId('watch-card-image')
    const body = screen.getByTestId('watch-card-body')
    expect(badges).toHaveLength(2)
    expect(photoBadge?.textContent).toBe(state)
    expect(photoBadge?.parentElement).toBe(frame)
    expect(photoBadge?.className.split(/\s+/)).toEqual(expect.arrayContaining(['absolute', 'right-3', 'bottom-3']))
    expect(infoBadge?.textContent).toBe(state)
    expect(body.contains(infoBadge as Node)).toBe(true)
    expect(frame.contains(infoBadge as Node)).toBe(false)
    expect(price.contains(infoBadge as Node)).toBe(false)
    expect(photoBadge?.className).not.toMatch(/rotate/)
    expect(infoBadge?.className).not.toMatch(/rotate/)
    const palette = state === 'Novo' ? 'new' : 'neutral'
    for (const badge of badges) {
      expect(badge.className.split(/\s+/)).toContain(`bg-product-state-${palette}`)
      expect(badge.className.split(/\s+/)).toContain(`text-product-state-${palette}-foreground`)
    }
  })

  it.each([
    ['available', 'Em estoque', 'available'],
    ['on_order', 'Sob encomenda', 'on-order'],
    ['unavailable', 'Indisponível', 'unavailable'],
    ['sold_out', 'Esgotado', 'sold-out'],
  ] as const)('keeps availability %s below the price block', (availabilityStatus, label, palette) => {
    renderWatchCard({ ...sampleProduct, availabilityStatus })
    const price = screen.getByTestId('price-block')
    const badge = screen.getByTestId('availability-badge')
    expect(badge.textContent).toBe(label)
    expect(badge.className.split(/\s+/)).toEqual(expect.arrayContaining([
      `bg-availability-${palette}`,
      `text-availability-${palette}-foreground`,
      `border-availability-${palette}-border`,
      'text-xs',
    ]))
    const meta = price.nextElementSibling
    expect(meta?.contains(badge)).toBe(true)
    expect(badge.parentElement).toBe(meta)
    expect(screen.getByTestId('watch-card-body').contains(badge)).toBe(true)
  })

  it('keeps Enviar no WhatsApp outside the card navigation link (SV-14)', () => {
    renderWatchCard()
    expect(screen.getByRole('heading', { name: 'Seculus' })).toBeTruthy()
    expect(screen.getByTestId('price-current').textContent).toBe('R$ 369,90')
    expect(screen.getByTestId('price-installments').textContent).toBe('ou em até 12x com juros')
    expect(screen.getByTestId('price-pix').textContent).toBe('no pix')
    const mobileWantLink = within(screen.getByTestId('watch-card-mobile-action')).getByRole('link', { name: 'Enviar no WhatsApp' })
    const desktopWantLink = within(screen.getByTestId('watch-card-actions')).getByRole('link', { name: 'Enviar no WhatsApp' })
    expect(mobileWantLink.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/\?text=/)
    expect(desktopWantLink.getAttribute('href')).toBe(mobileWantLink.getAttribute('href'))
    expect(screen.getByTestId('watch-card-link').contains(mobileWantLink)).toBe(false)
    expect(screen.getByTestId('watch-card-link').contains(desktopWantLink)).toBe(false)
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
    expect(tokens).toContain('rounded-none')
    expect(tokens).toContain('md:rounded-[12px]')
    expect(tokens).not.toContain('rounded-[12px]')
    expect(tokens).toContain('border-0')
    expect(tokens).toContain('md:border-[1px]')
    expect(tokens).toContain('shadow-none')
    expect(tokens.some((token) => /^shadow-(?!none$)/.test(token))).toBe(false)
    expect(tokens).not.toContain('ring-1')
    expect(tokens.some((token) => token.startsWith('drop-shadow'))).toBe(false)
  })

  it('paints the card with the canvas token in light and surface-tile-2 in dark (SV-37, SV-38)', () => {
    const { container } = renderWatchCard()
    const card = container.querySelector('[data-slot="card"]') as HTMLElement
    expect(classTokens(card.className)).toContain('bg-background')
    expect(classTokens(card.className)).toContain('md:bg-card')

    const css = readFileSync(join(clientRoot, 'src/index.css'), 'utf8')
    const root = blockBody(css, ':root')
    const dark = blockBody(css, '\\.dark')
    expect(decl(root, '--card')).toBe('var(--canvas)')
    expect(decl(dark, '--card')).toBe('var(--surface-tile-2)')
    expect(decl(root, '--canvas')).toBe('#ffffff')
    expect(decl(root, '--surface-tile-2')).toBe('#2a2a2c')
  })

  it('uses a fixed compact photo and a full-width square desktop photo (SV-39)', () => {
    const { container } = renderWatchCard()
    const card = container.querySelector('[data-slot="card"]') as HTMLElement
    const img = screen.getByRole('img', { name: 'Seculus' })
    const frame = img.parentElement as HTMLElement
    expect(classTokens(frame.className)).toContain('size-32')
    expect(classTokens(frame.className)).toContain('md:w-full')
    expect(classTokens(frame.className)).toContain('md:aspect-square')
    expect(classTokens(img.className)).toContain('w-full')
    expect(classTokens(card.className)).toContain('p-0')

    let node: HTMLElement | null = frame
    while (node && node !== card) {
      const tokens = classTokens(node.className)
      expect(tokens.some((token) => /^(?:[\w-]+:)?px-/.test(token) && !token.startsWith('md:'))).toBe(false)
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
    const button = within(actions).getByRole('link', { name: 'Enviar no WhatsApp' })
    const img = screen.getByRole('img', { name: 'Seculus' })

    expect(classTokens(body.className)).toContain('md:px-[24px]')
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

describe('WatchCard compact catalog row (CATREF-01–CATREF-12, CATREF-62, CATREF-64, CATREF-67, CATREF-71, CATREF-72)', () => {
  afterEach(() => {
    cleanup()
  })

  it('places the fixed photo beside a flexible text column below md and restores the card stack at md', () => {
    renderWatchCard()
    const link = screen.getByTestId('watch-card-link')
    const image = screen.getByTestId('watch-card-image')
    const body = screen.getByTestId('watch-card-body')

    expect(link.className).toMatch(/\bflex\b/)
    expect(link.className).toMatch(/\bitems-center\b/)
    expect(link.className).toMatch(/\bgap-2\b/)
    expect(link.className).toMatch(/\bmd:block\b/)
    expect(image.className).toMatch(/\bsize-32\b/)
    expect(body.className).toMatch(/\bmin-w-0\b/)
    expect(body.className).toMatch(/\bflex-1\b/)
  })

  it('clamps a long title to two compact lines while keeping its full text available', () => {
    const title = 'Relógio masculino automático de aço com mostrador azul e calendário'
    renderWatchCard({ ...sampleProduct, title })
    const heading = screen.getByRole('heading', { name: title })

    expect(heading.textContent).toBe(title)
    expect(heading.className).toMatch(/\bline-clamp-2\b/)
    expect(heading.className).toMatch(/\bmd:line-clamp-none\b/)
    expect(heading.className).toMatch(/text-\[13px\]/)
    expect(heading.className).toMatch(/\bfont-medium\b/)
    expect(heading.className).toMatch(/\bmd:text-xl\b/)
    expect(heading.className).toMatch(/\bmd:font-semibold\b/)
  })

  it('keeps description and specifications out of the catalog row', () => {
    renderWatchCard({
      ...sampleProduct,
      description: 'Descrição longa do relógio',
      specifications: [{ label: 'Movimento', value: 'Automático' }],
    })

    expect(screen.queryByText('Descrição longa do relógio')).toBeNull()
    expect(screen.queryByText('Automático')).toBeNull()
  })

  it('places a small share icon at the bottom-right of the photo', () => {
    renderWatchCard()
    const action = screen.getByTestId('watch-card-mobile-action')
    const link = within(action).getByRole('link', { name: 'Enviar no WhatsApp' })
    const icon = link.querySelector('svg')
    const anchor = link.parentElement

    expect(action.className).toMatch(/\babsolute\b/)
    expect(action.className).toMatch(/\binset-0\b/)
    expect(action.className).toMatch(/\bitems-center\b/)
    expect(action.className).toMatch(/\bmd:hidden\b/)
    expect(anchor?.className).toMatch(/\bright-1\b/)
    expect(anchor?.className).toMatch(/\bbottom-1\b/)
    expect(link.className).toMatch(/\bsize-8\b/)
    expect(link.className).toContain('bg-[color-mix(in_srgb,var(--canvas-parchment)_52%,transparent)]')
    expect(link.className).toContain('[backdrop-filter:saturate(140%)_blur(8px)]')
    expect(link.className).toContain('text-[var(--ink)]')
    expect(link.textContent).toBe('')
    expect(icon?.getAttribute('aria-hidden')).toBe('true')
    expect(icon?.classList.contains('lucide-share-2')).toBe(true)
  })

  it('keeps the textual WhatsApp action for desktop at the existing md breakpoint', () => {
    renderWatchCard()
    const action = screen.getByTestId('watch-card-actions')
    const link = within(action).getByRole('link', { name: 'Enviar no WhatsApp' })

    expect(action.className).toMatch(/\bmd:block\b/)
    expect(action.className).toMatch(/\bhidden\b/)
    expect(link.textContent).toBe('Enviar no WhatsApp')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('navigates through product content while the WhatsApp action remains an independent share link', () => {
    render(
      <MemoryRouter initialEntries={['/catalog']}>
        <WatchCard product={sampleProduct} />
        <CurrentPath />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByTestId('watch-card-link'))
    expect(screen.getByTestId('current-path').textContent).toBe('/product/seculus-kit-com-cantil')
    const share = within(screen.getByTestId('watch-card-mobile-action')).getByRole('link', {
      name: 'Enviar no WhatsApp',
    })
    fireEvent.click(share)
    expect(screen.getByTestId('current-path').textContent).toBe('/product/seculus-kit-com-cantil')
    expect(share.getAttribute('href')).toContain(encodeURIComponent('Olá, tenho interesse no Seculus.'))
  })

  it('retains current price, discount, Pix, installment and availability text in the info column', () => {
    renderWatchCard()
    const body = screen.getByTestId('watch-card-body')

    expect(within(body).getByText('De R$ 450,00')).toBeDefined()
    expect(within(body).getByText('−17%')).toBeDefined()
    expect(within(body).getByText('R$ 369,90')).toBeDefined()
    expect(within(body).getByText('no pix')).toBeDefined()
    expect(within(body).getByText('ou em até 12x com juros')).toBeDefined()
    expect(within(body).getByText('Em estoque')).toBeDefined()
    const list = screen.getByTestId('price-list')
    const badge = screen.getByTestId('price-badge')
    const current = screen.getByTestId('price-current')
    expect(list.className).toMatch(/\btext-xs\b/)
    expect(list.className).toMatch(/\bmd:text-base\b/)
    expect(current.className).toMatch(/\btext-base\b/)
    expect(current.className).toMatch(/\bmd:text-xl\b/)
    expect(badge.className.split(/\s+/)).toContain('row-start-2')
    expect(badge.className.split(/\s+/)).toContain('md:row-start-1')
    expect(badge.className.split(/\s+/)).toContain('md:-rotate-[8deg]')
    expect(badge.className.split(/\s+/)).not.toContain('-rotate-[8deg]')
    expect(screen.getByTestId('price-installments').className).toMatch(/\btext-xs\b/)
  })

  it('hides the unmissable offer line unless unmissableOffer is true', () => {
    renderWatchCard()
    expect(screen.queryByTestId('unmissable-offer')).toBeNull()

    cleanup()
    renderWatchCard({ ...sampleProduct, unmissableOffer: false })
    expect(screen.queryByTestId('unmissable-offer')).toBeNull()
  })

  it('shows a small OFERTA IMPERDÍVEL line above the title on mobile when unmissableOffer is true', () => {
    renderWatchCard({ ...sampleProduct, unmissableOffer: true })
    const offer = screen.getByTestId('unmissable-offer')
    const heading = screen.getByRole('heading', { name: 'Seculus' })
    const body = screen.getByTestId('watch-card-body')

    expect(offer.textContent).toBe('OFERTA IMPERDÍVEL')
    expect(offer.className).toMatch(/text-\[10px\]/)
    expect(offer.className).toMatch(/\buppercase\b/)
    expect(offer.className).toMatch(/\bmd:hidden\b/)
    expect(body.contains(offer)).toBe(true)
    expect(offer.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0)
  })

  it('renders the same 128px image frame with short and long product titles', () => {
    const { container } = render(
      <MemoryRouter>
        <WatchCard product={sampleProduct} />
        <WatchCard product={{ ...sampleProduct, slug: 'seculus-longo', title: 'Relógio Seculus automático masculino em aço inoxidável com mostrador azul' }} />
      </MemoryRouter>,
    )
    const frames = container.querySelectorAll('[data-testid="watch-card-image"]')

    expect(frames).toHaveLength(2)
    expect(Array.from(frames, (frame) => frame.className)).toEqual([
      expect.stringContaining('size-32'),
      expect.stringContaining('size-32'),
    ])
  })
})
