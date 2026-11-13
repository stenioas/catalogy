import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  creditInstallmentLabel,
  homeCards,
  ProductSchema,
  shareMessage,
  type CatalogCard,
  type Product,
} from '@catalogo/shared'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, useLocation } from 'react-router-dom'

import { WatchCard } from './watch-card'
import { ON_ORDER_PRICE_NOTE } from './price-block'

const clientRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..')

function baseListing(
  listingOverrides: Record<string, unknown> = {},
  variantOverrides: Record<string, unknown> = {},
) {
  return {
    id: 'listing',
    state: 'new' as const,
    availabilityStatus: 'available' as const,
    images: ['foto-principal.webp', 'foto-extra.jpg'],
    variants: [
      {
        axes: [] as { axisId: string; valueId: string }[],
        price: 369.9,
        listPrice: 450,
        mainImage: 'foto-principal.webp',
        ...variantOverrides,
      },
    ],
    ...listingOverrides,
  }
}

function baseProduct(overrides: Record<string, unknown> = {}): Product {
  const raw = {
    slug: 'seculus-kit-com-cantil',
    title: 'Seculus',
    axes: [] as Product['axes'],
    listings: [baseListing()],
    ...overrides,
  }
  return ProductSchema.parse(raw)
}

function cardFor(product: Product, section: string | null = 'available'): CatalogCard {
  const [card] = homeCards([product], section)
  if (card === undefined) throw new Error('homeCards returned no card')
  return card
}

function renderWatchCard(product: Product = baseProduct(), section: string | null = 'available') {
  const card = cardFor(product, section)
  return render(
    <MemoryRouter>
      <WatchCard product={product} card={card} />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.stubGlobal('location', { ...window.location, origin: 'http://localhost' })
})

function CurrentPath() {
  const { pathname, search } = useLocation()
  return (
    <output data-testid="current-path">
      {pathname}
      {search}
    </output>
  )
}

describe('WatchCard (SV-13, SV-14)', () => {
  afterEach(() => {
    cleanup()
  })

  it('requests the card cover from img/thumbs so the 768px file stays on the gallery (CAT-28)', () => {
    const product = baseProduct()
    const card = cardFor(product)
    renderWatchCard(product)
    const img = screen.getByRole('img', { name: 'Seculus' })
    expect(img.getAttribute('src')).toBe(`/catalog/products/${product.slug}/img/thumbs/${card.image}`)
    expect(img.getAttribute('loading')).toBe('eager')
  })

  it('uses object-contain in a square frame and the card image file (CAT-52, CAT-53)', () => {
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

  it('links photo, title and price to the card variant path without seller query (SV-13)', () => {
    const product = baseProduct()
    const card = cardFor(product)
    renderWatchCard(product)
    const cardLink = screen.getByTestId('watch-card-link')
    expect(cardLink.getAttribute('href')).toBe(card.path)
    expect(cardLink.getAttribute('href')).not.toMatch(/seller=/)
  })

  it.each([
    ['new', null],
    ['openbox', 'Openbox'],
    ['used', 'Usado'],
    ['defective', null],
  ] as const)('shows availability without state text and an image badge only for %s', (state, badgeLabel) => {
    const product = baseProduct({
      listings: [
        baseListing({
          state,
        }),
      ],
    })
    renderWatchCard(product)
    const line = screen.getByTestId('product-condition')
    const heading = screen.getByRole('heading', { name: 'Seculus' })
    const availability = within(line).getByTestId('availability-badge')
    const image = screen.getByTestId('watch-card-image')
    const imageBadge = within(image).queryByTestId('card-image-state-badge')

    expect(within(line).queryByTestId('state-label')).toBeNull()
    expect(screen.queryByTestId('state-label')).toBeNull()
    expect(screen.queryByTestId('state-badge')).toBeNull()
    expect(line.textContent).not.toMatch(/Novo|Usado|Openbox|Com defeito/)
    expect(screen.getByTestId('watch-card-body').textContent).not.toMatch(/Novo|Usado|Openbox|Com defeito/)
    expect(availability.className).toMatch(/rounded-\[4px\]/)
    expect(availability.className).not.toMatch(/\brounded-full\b/)
    expect(line.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0)
    expect(
      line.compareDocumentPosition(screen.getByTestId('price-block')) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0)
    expect(image.contains(line)).toBe(false)
    if (badgeLabel === null) {
      expect(imageBadge).toBeNull()
    } else {
      expect(imageBadge?.textContent).toBe(badgeLabel)
      expect(imageBadge?.className).toMatch(/\bpointer-events-none\b/)
      expect(imageBadge?.className).toMatch(/\babsolute\b/)
      expect(imageBadge?.className).toMatch(/\btop-0\b/)
      expect(imageBadge?.className).toMatch(/\bright-0\b/)
      expect(imageBadge?.className).toMatch(/rounded-bl-\[4px\]/)
      expect(imageBadge?.className).toMatch(/\bmd:text-sm\b/)
      expect(imageBadge?.className).toMatch(/\bmd:px-2\.5\b/)
      expect(imageBadge?.className).toMatch(/\bmd:py-1\b/)
      expect(imageBadge?.className).toMatch(/\bbg-orange-600\b/)
      expect(imageBadge?.className).toMatch(/\btext-white\b/)
      expect(imageBadge?.className).toMatch(/\btext-xs\b/)
    }
  })

  it.each([
    ['available', 'Disponível'],
    ['coming_soon', 'Chega em breve'],
    ['on_order', 'Sob encomenda'],
  ] as const)('shows availability %s in the condition line above the title', (availabilityStatus, label) => {
    const section =
      availabilityStatus === 'available'
        ? 'available'
        : availabilityStatus === 'coming_soon'
          ? 'coming-soon'
          : 'on-order'
    const product = baseProduct({
      listings: [
        baseListing({
          state: availabilityStatus === 'on_order' ? 'new' : 'openbox',
          availabilityStatus,
        }),
      ],
    })
    renderWatchCard(product, section)
    const line = screen.getByTestId('product-condition')
    const badge = within(line).getByTestId('availability-badge')
    expect(badge.textContent).toBe(label)
    expect(badge.className.split(/\s+/)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^bg-availability-/),
        expect.stringMatching(/^text-availability-/),
        'border-0',
        'rounded-[4px]',
        'h-5',
        'px-1.5',
        'text-xs',
        'font-medium',
        'leading-none',
      ]),
    )
    expect(badge.className).not.toMatch(/\brounded-full\b/)
    if (availabilityStatus === 'on_order') {
      expect(screen.queryByTestId('price-block')).toBeNull()
    } else {
      expect(screen.getByTestId('price-block').contains(badge)).toBe(false)
    }
  })

  it('keeps Enviar no WhatsApp outside the card navigation link (SV-14)', () => {
    const product = baseProduct()
    const card = cardFor(product)
    const listing = product.listings[0]!
    const variant = listing.variants[0]!
    const expectedMessage = shareMessage(product, listing, variant, window.location.origin)
    renderWatchCard(product)
    expect(screen.getByRole('heading', { name: 'Seculus' })).toBeTruthy()
    expect(screen.getByTestId('price-current').textContent).toBe('R$ 369,90')
    expect(screen.getByTestId('price-installments').textContent).toBe(creditInstallmentLabel(369.9))
    expect(screen.getByTestId('price-pix').textContent).toBe('no pix')
    const wantLink = within(screen.getByTestId('watch-card-mobile-action')).getByRole('link', {
      name: 'Enviar no WhatsApp',
    })
    expect(screen.getAllByRole('link', { name: 'Enviar no WhatsApp' })).toHaveLength(1)
    expect(wantLink.getAttribute('href')).toBe(`https://wa.me/?text=${encodeURIComponent(expectedMessage)}`)
    expect(screen.getByTestId('watch-card-link').contains(wantLink)).toBe(false)
    expect(screen.queryByTestId('watch-card-actions')).toBeNull()
  })
})

describe('WatchCard listing card rules (VAR-42–VAR-50)', () => {
  afterEach(() => {
    cleanup()
  })

  it('uses product title on the card with no axis alias in the heading', () => {
    const product = baseProduct({
      axes: [
        {
          id: 'color',
          label: 'Cor',
          values: [{ id: 'azul', value: 'Azul', alias: 'AliasAzul' }],
        },
        {
          id: 'size',
          label: 'Tamanho',
          values: [{ id: 'mm40', value: '40' }],
        },
      ],
      listings: [
        baseListing({
          variants: [
            {
              axes: [
                { axisId: 'color', valueId: 'azul' },
                { axisId: 'size', valueId: 'mm40' },
              ],
              price: 100,
              mainImage: 'foto-principal.webp',
            },
          ],
        }),
      ],
    })
    renderWatchCard(product)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(product.title)
    expect(screen.getByRole('heading', { level: 2 }).textContent).not.toContain('AliasAzul')
  })

  it('links to the listing path with v query when the product has axes', () => {
    const product = baseProduct({
      axes: [
        {
          id: 'color',
          label: 'Cor',
          values: [
            { id: 'azul', value: 'Azul' },
            { id: 'preto', value: 'Preto' },
          ],
        },
        {
          id: 'size',
          label: 'Tamanho',
          values: [{ id: 'mm40', value: '40' }],
        },
      ],
      listings: [
        baseListing({
          variants: [
            {
              axes: [
                { axisId: 'color', valueId: 'azul' },
                { axisId: 'size', valueId: 'mm40' },
              ],
              price: 100,
              mainImage: 'foto-principal.webp',
            },
            {
              axes: [
                { axisId: 'color', valueId: 'preto' },
                { axisId: 'size', valueId: 'mm40' },
              ],
              price: 200,
              mainImage: 'foto-extra.jpg',
            },
          ],
        }),
      ],
    })
    const card = cardFor(product)
    renderWatchCard(product)
    expect(screen.getByTestId('watch-card-link').getAttribute('href')).toBe(card.path)
    expect(card.path).toMatch(/\?v=azul,mm40$/)
    expect(card.image).toBe('foto-principal.webp')
  })

  it('uses shareMessage for the WhatsApp link (same sentence as listing page)', () => {
    const product = baseProduct({
      axes: [
        {
          id: 'color',
          label: 'Cor',
          values: [{ id: 'azul', value: 'Azul' }],
        },
        {
          id: 'size',
          label: 'Tamanho',
          values: [{ id: 'mm40', value: '40' }],
        },
      ],
      listings: [
        baseListing({
          variants: [
            {
              axes: [
                { axisId: 'color', valueId: 'azul' },
                { axisId: 'size', valueId: 'mm40' },
              ],
              price: 100,
              mainImage: 'foto-principal.webp',
            },
          ],
        }),
      ],
    })
    const listing = product.listings[0]!
    const variant = listing.variants[0]!
    const expected = shareMessage(product, listing, variant, window.location.origin)
    renderWatchCard(product)
    const href = within(screen.getByTestId('watch-card-mobile-action'))
      .getByRole('link', { name: 'Enviar no WhatsApp' })
      .getAttribute('href')!
    const text = new URL(href).searchParams.get('text')
    expect(text).toBe(expected)
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
    expect(link.className).toMatch(/\bitems-start\b/)
    expect(link.className).not.toMatch(/\bitems-center\b/)
    expect(link.className).toMatch(/\bgap-2\b/)
    expect(link.className).toMatch(/\bmd:block\b/)
    expect(image.className).toMatch(/\bsize-32\b/)
    expect(body.className).toMatch(/\bmin-w-0\b/)
    expect(body.className).toMatch(/\bflex-1\b/)
  })

  it('keeps a long title on one line with ellipsis and its full text available', () => {
    const title = 'Relógio masculino automático de aço com mostrador azul e calendário'
    const product = baseProduct({ title })
    renderWatchCard(product)
    const heading = screen.getByRole('heading', { name: title })

    expect(heading.textContent).toBe(title)
    expect(heading.className).toMatch(/\bline-clamp-1\b/)
    expect(heading.className).toMatch(/\btruncate\b/)
    expect(heading.className).toMatch(/\boverflow-hidden\b/)
    expect(heading.className).toMatch(/\btext-ellipsis\b/)
    expect(heading.className).toMatch(/\bwhitespace-nowrap\b/)
    expect(heading.className).toMatch(/\btext-\[13px\]/)
    expect(heading.className).toMatch(/\bfont-medium\b/)
    expect(heading.className).toMatch(/\bmd:text-\[15px\]/)
    expect(heading.className).toMatch(/\bmd:font-semibold\b/)
  })

  it('keeps description and specifications out of the catalog row', () => {
    const product = baseProduct({
      description: 'Descrição longa do relógio',
      specifications: [{ label: 'Marca', value: 'Valor só da ficha' }],
    })
    renderWatchCard(product)

    expect(screen.queryByText('Descrição longa do relógio')).toBeNull()
    expect(screen.queryByText('Valor só da ficha')).toBeNull()
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
    expect(action.parentElement?.className).toMatch(/\bitems-start\b/)
    expect(action.parentElement?.className).not.toMatch(/\bitems-end\b/)
    expect(action.parentElement?.className).not.toMatch(/\bmd:items-center\b/)
    expect(action.className).toMatch(/\bself-stretch\b/)
    expect(action.className).toMatch(/\bjustify-end\b/)
    expect(action.className).toMatch(/\bflex-col\b/)
    expect(action.className).toMatch(/\bh-full\b/)
    expect(action.className).toMatch(/\bpb-1\b/)
    expect(action.className).toMatch(/\bpr-1\b/)
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
    expect(action.parentElement?.className).toMatch(/\bitems-start\b/)
    expect(action.parentElement?.className).not.toMatch(/\bitems-end\b/)
    expect(action.parentElement?.className).not.toMatch(/\bmd:items-center\b/)
    expect(action.className).toMatch(/\bjustify-end\b/)
    expect(action.className).toMatch(/\bself-stretch\b/)
    expect(action.className).toMatch(/\bmd:h-auto\b/)
    expect(screen.getByTestId('watch-card-body').contains(action)).toBe(true)
    expect(screen.getByTestId('watch-card-body').contains(price)).toBe(true)
    expect(link.className).toMatch(/\bmd:size-10\b/)
    expect(link.querySelector('svg')?.getAttribute('class')).toMatch(/\bmd:size-5\b/)
    expect(link.textContent).toBe('')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('navigates through product content while the WhatsApp action remains an independent share link', () => {
    const product = baseProduct()
    const card = cardFor(product)
    render(
      <MemoryRouter initialEntries={['/catalog']}>
        <WatchCard product={product} card={card} />
        <CurrentPath />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByTestId('watch-card-link'))
    expect(screen.getByTestId('current-path').textContent).toBe(card.path)
    const share = within(screen.getByTestId('watch-card-mobile-action')).getByRole('link', {
      name: 'Enviar no WhatsApp',
    })
    fireEvent.click(share)
    expect(screen.getByTestId('current-path').textContent).toBe(card.path)
    const listing = product.listings[0]!
    const variant = listing.variants[0]!
    expect(share.getAttribute('href')).toContain(
      encodeURIComponent(shareMessage(product, listing, variant, window.location.origin)),
    )
  })

  it('retains current price, discount, Pix, installment and availability text in the info column', () => {
    renderWatchCard()
    const body = screen.getByTestId('watch-card-body')

    expect(within(body).getByText('De R$ 450,00')).toBeDefined()
    expect(within(body).getByText('−17%')).toBeDefined()
    expect(within(body).getByText('R$ 369,90')).toBeDefined()
    expect(within(body).getByText('no pix')).toBeDefined()
    expect(within(body).getByText(creditInstallmentLabel(369.9))).toBeDefined()
    expect(within(body).getByText('Disponível')).toBeDefined()
    const list = screen.getByTestId('price-list')
    const badge = screen.getByTestId('price-badge')
    const current = screen.getByTestId('price-current')
    expect(list.className).toMatch(/\btext-xs\b/)
    expect(list.className).toMatch(/\bmd:text-sm\b/)
    expect(badge.className).toMatch(/text-\[11px\]/)
    expect(badge.className).not.toMatch(/\bmd:text-sm\b/)
    expect(current.className).toMatch(/\btext-base\b/)
    expect(current.className).toMatch(/\bmd:text-xl\b/)
    expect(badge.className.split(/\s+/)).toContain('row-start-1')
    expect(badge.className.split(/\s+/)).not.toContain('row-start-2')
    expect(badge.className).not.toMatch(/rotate/)
    expect(screen.getByTestId('price-installments').className).toMatch(/\btext-xs\b/)
  })

  it('OSC-33: draws no offer row on the photo or when offers is empty', () => {
    renderWatchCard()
    const frame = screen.getByTestId('watch-card-image')
    expect(screen.queryByTestId('offer-row')).toBeNull()
    expect(frame.querySelector('[data-testid="offer-badge"]')).toBeNull()

    cleanup()
    const product = baseProduct({
      listings: [
        baseListing(
          {},
          {
            offers: [
              {
                text: 'Black Friday',
                icon: 'Gift',
                background: '#000000',
                color: '#FFFFFF',
              },
            ],
          },
        ),
      ],
    })
    renderWatchCard(product)
    const offerRow = screen.getByTestId('offer-row')
    const body = screen.getByTestId('watch-card-body')
    expect(body.contains(offerRow)).toBe(true)
    expect(frame.contains(offerRow)).toBe(false)
    expect(screen.getByTestId('price-current').className).not.toMatch(/\btext-destructive\b/)
  })

  it('OSC-33: places the offer row in the card body above the title and the price', () => {
    const product = baseProduct({
      listings: [
        baseListing(
          {},
          {
            offers: [
              {
                text: 'Promo crua',
                icon: 'Gift',
                background: '#111111',
                color: '#eeeeee',
              },
            ],
          },
        ),
      ],
    })
    renderWatchCard(product)
    const offerRow = screen.getByTestId('offer-row')
    const priceBlock = screen.getByTestId('price-block')
    const condition = screen.getByTestId('product-condition')
    const heading = screen.getByRole('heading', { name: 'Seculus' })
    expect(offerRow.textContent).toContain('Promo crua')
    expect(
      offerRow.compareDocumentPosition(condition) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0)
    expect(
      offerRow.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0)
    expect(
      offerRow.compareDocumentPosition(priceBlock) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0)
  })

  it('OSC-25 OSC-27: on_order card shows Sob consulta without price, pix or installments', () => {
    const product = baseProduct({
      listings: [
        baseListing({
          availabilityStatus: 'on_order',
          variants: [
            {
              axes: [],
              price: 999,
              mainImage: 'foto-principal.webp',
              offers: [
                {
                  text: 'Black Friday',
                  icon: 'Gift',
                  background: '#000000',
                  color: '#FFFFFF',
                },
              ],
            },
          ],
        }),
      ],
    })
    const card = cardFor(product, 'on-order')
    renderWatchCard(product, 'on-order')
    const consult = screen.getByTestId('consult-label')
    expect(consult.textContent).toBe(ON_ORDER_PRICE_NOTE)
    expect(consult.className).toMatch(/\btext-xs\b/)
    expect(consult.className).toMatch(/\bmd:text-sm\b/)
    expect(consult.className).toMatch(/\bfont-medium\b/)
    expect(consult.className).toMatch(/\bmd:font-semibold\b/)
    expect(consult.className).toMatch(/\btext-destructive\b/)
    expect(consult.textContent).not.toMatch(/R\$/)
    expect(screen.queryByTestId('price-block')).toBeNull()
    expect(screen.queryByTestId('price-pix')).toBeNull()
    expect(screen.queryByTestId('price-installments')).toBeNull()
    expect(screen.queryByTestId('offer-row')).toBeNull()
    expect(card.path).not.toMatch(/\?v=/)
    expect(card.offers).toEqual([])
  })

  it('renders the same 128px image frame with short and long product titles', () => {
    const a = baseProduct()
    const b = baseProduct({
      slug: 'seculus-longo',
      title: 'Relógio Seculus automático masculino em aço inoxidável com mostrador azul',
    })
    const { container } = render(
      <MemoryRouter>
        <WatchCard product={a} card={cardFor(a)} />
        <WatchCard product={b} card={cardFor(b)} />
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
