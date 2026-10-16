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

  it.each(['Novo', 'Usado', 'Openbox'] as const)('shows %s and availability as one line above the title', (state) => {
    renderWatchCard({ ...sampleProduct, state, availabilityStatus: 'available' })
    const line = screen.getByTestId('product-condition')
    const heading = screen.getByRole('heading', { name: 'Seculus' })
    const stateLabel = within(line).getByTestId('state-label')
    const availability = within(line).getByTestId('availability-badge')

    expect(screen.queryByTestId('state-badge')).toBeNull()
    expect(stateLabel.textContent).toBe(state)
    expect(stateLabel.className).not.toMatch(/rounded/)
    expect(line.textContent).toBe(`${state}Em estoque`)
    expect(line.className).toMatch(/\bgap-1\.5\b/)
    expect(stateLabel.nextElementSibling).toBe(availability)
    expect(availability.className).toMatch(/rounded-\[4px\]/)
    expect(availability.className).not.toMatch(/\brounded-full\b/)
    expect(line.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0)
    expect(line.compareDocumentPosition(screen.getByTestId('price-block')) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0)
    expect(screen.getByTestId('watch-card-image').contains(line)).toBe(false)
  })

  it.each([
    ['available', 'Em estoque', 'available'],
    ['on_order', 'Sob encomenda', 'on-order'],
    ['unavailable', 'Indisponível', 'unavailable'],
    ['sold_out', 'Esgotado', 'sold-out'],
  ] as const)('shows availability %s in the condition line above the title', (availabilityStatus, label, palette) => {
    renderWatchCard({ ...sampleProduct, state: 'Openbox', availabilityStatus })
    const line = screen.getByTestId('product-condition')
    const badge = within(line).getByTestId('availability-badge')
    expect(badge.textContent).toBe(label)
    expect(badge.className.split(/\s+/)).toEqual(expect.arrayContaining([
      `bg-availability-${palette}`,
      `text-availability-${palette}-foreground`,
      `border-availability-${palette}-border`,
      'rounded-[4px]',
      'h-5',
      'px-1.5',
      'text-xs',
      'font-medium',
      'leading-none',
    ]))
    expect(badge.className).not.toMatch(/\brounded-full\b/)
    expect(screen.getByTestId('price-block').contains(badge)).toBe(false)
  })

  it('keeps Enviar no WhatsApp outside the card navigation link (SV-14)', () => {
    renderWatchCard()
    expect(screen.getByRole('heading', { name: 'Seculus' })).toBeTruthy()
    expect(screen.getByTestId('price-current').textContent).toBe('R$ 369,90')
    expect(screen.getByTestId('price-installments').textContent).toBe('ou em até 12x com juros')
    expect(screen.getByTestId('price-pix').textContent).toBe('no pix')
    const wantLink = within(screen.getByTestId('watch-card-mobile-action')).getByRole('link', { name: 'Enviar no WhatsApp' })
    expect(screen.getAllByRole('link', { name: 'Enviar no WhatsApp' })).toHaveLength(1)
    expect(wantLink.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/\?text=/)
    expect(screen.getByTestId('watch-card-link').contains(wantLink)).toBe(false)
    expect(screen.queryByTestId('watch-card-actions')).toBeNull()
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

  it('pads the title, price and share icon by 24px on the sides and bottom (SV-40)', () => {
    renderWatchCard()
    const body = screen.getByTestId('watch-card-body')
    const heading = screen.getByRole('heading', { name: 'Seculus' })
    const price = screen.getByTestId('price-current')
    const button = within(body).getByRole('link', { name: 'Enviar no WhatsApp' })
    const img = screen.getByRole('img', { name: 'Seculus' })

    expect(classTokens(body.className)).toContain('md:px-[24px]')
    expect(classTokens(body.className)).toContain('md:pb-[24px]')
    expect(body.contains(heading)).toBe(true)
    expect(body.contains(price)).toBe(true)
    expect(body.contains(button)).toBe(true)
    expect(body.contains(img)).toBe(false)
    expect(screen.queryByTestId('watch-card-actions')).toBeNull()
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
    const link = screen.getByTestId('watch-card-row')
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

  it('places a small share icon at the bottom-right of the price group', () => {
    renderWatchCard()
    const action = screen.getByTestId('watch-card-mobile-action')
    const body = screen.getByTestId('watch-card-body')
    const link = within(action).getByRole('link', { name: 'Enviar no WhatsApp' })
    const icon = link.querySelector('svg')

    expect(body.contains(action)).toBe(true)
    expect(screen.getByTestId('watch-card-link').contains(action)).toBe(false)
    expect(screen.getByTestId('watch-card-image').contains(action)).toBe(false)
    expect(action.parentElement?.className).toMatch(/\bitems-end\b/)
    expect(action.parentElement?.className).not.toMatch(/\bmd:items-center\b/)
    expect(action.className).toMatch(/\bshrink-0\b/)
    expect(link.className).toMatch(/\bsize-8\b/)
    expect(link.className).toMatch(/\bmd:size-10\b/)
    expect(link.className).toContain('bg-[color-mix(in_srgb,var(--primary)_16%,white)]')
    expect(link.className).toContain('text-[var(--ink)]')
    expect(link.textContent).toBe('')
    expect(icon?.getAttribute('aria-hidden')).toBe('true')
    expect(icon?.classList.contains('lucide-share-2')).toBe(true)
  })

  it('keeps the share icon beside the price at md, slightly larger than on mobile', () => {
    renderWatchCard()
    const action = screen.getByTestId('watch-card-mobile-action')
    const link = within(action).getByRole('link', { name: 'Enviar no WhatsApp' })
    const price = screen.getByTestId('price-block')

    expect(screen.queryByTestId('watch-card-actions')).toBeNull()
    expect(action.parentElement?.className).toMatch(/\bitems-end\b/)
    expect(action.parentElement?.className).not.toMatch(/\bmd:items-center\b/)
    expect(screen.getByTestId('watch-card-body').contains(action)).toBe(true)
    expect(screen.getByTestId('watch-card-body').contains(price)).toBe(true)
    expect(link.className).toMatch(/\bmd:size-10\b/)
    expect(link.querySelector('svg')?.getAttribute('class')).toMatch(/\bmd:size-5\b/)
    expect(link.textContent).toBe('')
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

  it('places OFERTA IMPERDÍVEL above the title on mobile and on the photo from md', () => {
    renderWatchCard({ ...sampleProduct, unmissableOffer: true })
    const offers = screen.getAllByTestId('unmissable-offer')
    const frame = screen.getByTestId('watch-card-image')
    const body = screen.getByTestId('watch-card-body')
    const heading = screen.getByRole('heading', { name: 'Seculus' })
    const aboveTitle = offers.find((offer) => offer.className.includes('md:hidden'))
    const onPhoto = offers.find((offer) => offer.className.includes('md:inline-flex'))

    expect(offers).toHaveLength(2)
    expect(aboveTitle?.textContent).toBe('OFERTA IMPERDÍVEL')
    expect(body.contains(aboveTitle as Node)).toBe(true)
    expect(frame.contains(aboveTitle as Node)).toBe(false)
    expect(aboveTitle?.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0)
    expect(onPhoto?.textContent).toBe('OFERTA IMPERDÍVEL')
    expect(frame.contains(onPhoto as Node)).toBe(true)
    expect(body.contains(onPhoto as Node)).toBe(false)
    for (const offer of offers) {
      const icon = offer.querySelector('svg')
      expect(icon?.getAttribute('aria-hidden')).toBe('true')
      expect(icon?.classList.contains('lucide-gift')).toBe(true)
      expect(offer.firstElementChild).toBe(icon)
      expect(offer.className).toMatch(/rounded-\[4px\]/)
      expect(offer.className).not.toMatch(/\brounded-full\b/)
      expect(offer.className).toMatch(/\bh-5\b/)
      expect(offer.className).toMatch(/\bpx-1\.5\b/)
      expect(offer.className).toMatch(/\btext-xs\b/)
      expect(offer.className).toMatch(/\bbg-primary\b/)
      expect(offer.className).toMatch(/\btext-primary-foreground\b/)
    }
    expect(onPhoto?.className.split(/\s+/)).toEqual(expect.arrayContaining(['absolute', 'left-3', 'bottom-3', 'hidden']))
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
