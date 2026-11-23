import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  creditInstallmentLabel,
  homeCards,
  parseLabels,
  ProductSchema,
  shareMessage,
  type CatalogCard,
  type Label,
  type Product,
} from '@catalogo/shared'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, useLocation } from 'react-router-dom'

import { WatchCard } from './watch-card'
import { ON_ORDER_PRICE_NOTE } from './price-block'

const clientRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..')

const initialLabels = parseLabels([
  {
    id: 'black-friday',
    enabled: true,
    type: 'campaign',
    text: 'Black Friday',
    shortText: 'Black Friday',
    icon: 'Gift',
    background: '#000000',
    color: '#FFFFFF',
    filterable: true,
  },
  {
    id: 'discount-20',
    enabled: true,
    type: 'offer',
    category: 'discount',
    description: 'Desconto mínimo',
    priority: 1,
    text: 'acima 20%',
    icon: 'Gift',
    background: '#000000',
    color: '#FFFFFF',
    filterable: true,
    trigger: { kind: 'discount-at-least', percent: 20 },
  },
])

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

function cardFor(
  product: Product,
  section: string | null = 'available',
  labels: Label[] = [],
): CatalogCard {
  const [card] = homeCards([product], section, labels)
  if (card === undefined) throw new Error('homeCards returned no card')
  return card
}

function renderWatchCard(
  product: Product = baseProduct(),
  section: string | null = 'available',
  labels: Label[] = [],
) {
  const card = cardFor(product, section, labels)
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
    const frame = screen.getByTestId('watch-card-image')
    expect(frame.contains(img)).toBe(true)
    expect(frame?.className).toMatch(/\baspect-square\b/)
    expect(frame?.className).toMatch(/\bw-full\b/)
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

  it.each(['new', 'openbox', 'used', 'defective'] as const)(
    'keeps %s off the home card photo',
    (state) => {
      const product = baseProduct({
        listings: [
          baseListing({
            state,
          }),
        ],
      })
      renderWatchCard(product)
      const heading = screen.getByRole('heading', { name: 'Seculus' })
      const image = screen.getByTestId('watch-card-image')

      expect(within(image).queryByTestId('card-image-state-badge')).toBeNull()
      expect(screen.queryByTestId('product-condition')).toBeNull()
      expect(screen.queryByTestId('availability-badge')).toBeNull()
      expect(screen.queryByTestId('state-label')).toBeNull()
      expect(screen.queryByTestId('state-badge')).toBeNull()
      expect(screen.getByTestId('watch-card-body').textContent).not.toMatch(/Novo|Usado|Openbox|Com defeito|Disponível/)
      expect(heading.compareDocumentPosition(screen.getByTestId('price-block')) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0)
    },
  )

  it.each([
    ['available', 'Disponível'],
    ['coming_soon', 'Chega em breve'],
    ['on_order', 'Sob encomenda'],
  ] as const)('places availability %s under the photo, hiding Disponível', (availabilityStatus, label) => {
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
    const image = screen.getByTestId('watch-card-image')
    const body = screen.getByTestId('watch-card-body')

    if (availabilityStatus === 'available') {
      expect(within(image).queryByTestId('availability-badge')).toBeNull()
      expect(body.textContent).not.toContain('Disponível')
      return
    }

    const badge = within(body).getByTestId('availability-badge')
    expect(badge.textContent).toBe(label)
    expect(image.contains(badge)).toBe(false)
    expect(badge.className).not.toMatch(/\babsolute\b/)
    expect(badge.className).toMatch(/rounded-\[4px\]/)
    expect(badge.className).toMatch(/\bpx-1\.5\b/)
    expect(badge.className).toMatch(/\bpy-0\.5\b/)
    expect(badge.className).toMatch(/\btext-xs\b/)
    expect(badge.className).toMatch(/\bfont-medium\b/)
    expect(badge.className).toMatch(/\bleading-none\b/)
    const heading = screen.getByRole('heading', { name: 'Seculus' })
    expect(badge.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0)
    expect(within(image).queryByTestId('card-image-state-badge')).toBeNull()
    if (availabilityStatus === 'coming_soon') {
      expect(badge.className).toMatch(/\bbg-availability-coming-soon\b/)
      expect(badge.className).toMatch(/\btext-availability-coming-soon-foreground\b/)
    } else {
      expect(badge.className).toMatch(/\bbg-availability-on-order\b/)
      expect(badge.className).toMatch(/\btext-availability-on-order-foreground\b/)
      expect(within(image).queryByTestId('card-image-state-badge')).toBeNull()
      expect(screen.queryByTestId('price-block')).toBeNull()
    }
  })

  it('keeps share outside the card navigation link (SV-14)', () => {
    const product = baseProduct()
    const card = cardFor(product)
    const listing = product.listings[0]!
    const variant = listing.variants[0]!
    const expectedMessage = shareMessage(product, listing, variant, window.location.origin)
    renderWatchCard(product)
    expect(screen.getByRole('heading', { name: 'Seculus' })).toBeTruthy()
    expect(screen.getByTestId('price-current').getAttribute('aria-label')).toBe('R$ 369,90')
    expect(screen.getByTestId('price-installments').textContent).toBe(creditInstallmentLabel(369.9))
    expect(screen.getByTestId('price-pix').textContent).toBe('no pix')
    const wantLink = within(screen.getByTestId('watch-card-mobile-action')).getByRole('link', {
      name: 'share',
    })
    expect(screen.getAllByRole('link', { name: 'share' })).toHaveLength(1)
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
      .getByRole('link', { name: 'share' })
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

  it('drops the card elevation and rounds every corner of the photo (SV-36)', () => {
    const { container } = renderWatchCard()
    const card = container.querySelector('[data-slot="card"]')
    expect(card).not.toBeNull()
    const tokens = classTokens((card as HTMLElement).className)
    expect(tokens).toContain('rounded-none')
    expect(tokens).toContain('border-0')
    expect(tokens).toContain('bg-transparent')
    expect(tokens).not.toContain('border-[1px]')
    const frame = screen.getByTestId('watch-card-image')
    expect(classTokens(frame.className)).toContain('rounded-[12px]')
    expect(classTokens(frame.className)).toContain('overflow-hidden')
    expect(tokens).toContain('shadow-none')
    expect(tokens.some((token) => /^shadow-(?!none$)/.test(token))).toBe(false)
    expect(tokens).not.toContain('ring-1')
    expect(tokens.some((token) => token.startsWith('drop-shadow'))).toBe(false)
  })

  it('paints the card with the canvas token in light and surface-tile-2 in dark (SV-37, SV-38)', () => {
    const { container } = renderWatchCard()
    const card = container.querySelector('[data-slot="card"]') as HTMLElement
    expect(classTokens(card.className)).toContain('bg-transparent')
    expect(classTokens(card.className)).not.toContain('bg-card')

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
    const frame = screen.getByTestId('watch-card-image')
    expect(classTokens(frame.className)).toContain('aspect-square')
    expect(classTokens(frame.className)).toContain('w-full')
    expect(classTokens(frame.className)).not.toContain('size-32')
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

  it('pads the title and price, and keeps share on the photo (SV-40)', () => {
    renderWatchCard()
    const body = screen.getByTestId('watch-card-body')
    const heading = screen.getByRole('heading', { name: 'Seculus' })
    const price = screen.getByTestId('price-current')
    const button = screen.getByRole('link', { name: 'share' })
    const img = screen.getByRole('img', { name: 'Seculus' })

    expect(classTokens(body.className)).toContain('px-2')
    expect(classTokens(body.className)).toContain('pb-2')
    expect(body.contains(heading)).toBe(true)
    expect(body.contains(price)).toBe(true)
    expect(body.contains(button)).toBe(false)
    expect(screen.getByTestId('watch-card-image').contains(button)).toBe(true)
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

  it('stacks the square photo above the text on every width', () => {
    renderWatchCard()
    const row = screen.getByTestId('watch-card-row')
    const image = screen.getByTestId('watch-card-image')
    const body = screen.getByTestId('watch-card-body')

    expect(row.className).toMatch(/\bflex-col\b/)
    expect(row.className).not.toMatch(/\bmd:block\b/)
    expect(image.className).toMatch(/\baspect-square\b/)
    expect(image.className).toMatch(/\bw-full\b/)
    expect(image.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0)
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
    expect(heading.className).not.toMatch(/\bmd:text-\[15px\]/)
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

  it('places a small share icon at the top-right of the photo', () => {
    renderWatchCard()
    const action = screen.getByTestId('watch-card-mobile-action')
    const body = screen.getByTestId('watch-card-body')
    const link = within(action).getByRole('link', { name: 'share' })
    const icon = link.querySelector('svg')

    expect(screen.getByTestId('watch-card-image').contains(action)).toBe(true)
    expect(body.contains(action)).toBe(false)
    expect(screen.getByTestId('watch-card-link').contains(action)).toBe(false)
    expect(action.className).toMatch(/\babsolute\b/)
    expect(action.className).toMatch(/\bright-1\b/)
    expect(action.className).toMatch(/\btop-1\b/)
    expect(link.className).toMatch(/\bsize-8\b/)
    expect(link.className).toMatch(/\bmd:size-9\b/)
    expect(link.className).toContain('bg-[color-mix(in_srgb,var(--primary)_16%,white)]')
    expect(link.className).toContain('text-[var(--ink)]')
    expect(link.textContent).toBe('')
    expect(icon?.getAttribute('aria-hidden')).toBe('true')
    expect(icon?.classList.contains('lucide-share-2')).toBe(true)
  })

  it('keeps the share icon beside the price at md, slightly larger than on mobile', () => {
    renderWatchCard()
    const action = screen.getByTestId('watch-card-mobile-action')
    const link = within(action).getByRole('link', { name: 'share' })
    const price = screen.getByTestId('price-block')

    expect(screen.queryByTestId('watch-card-actions')).toBeNull()
    expect(action.className).toMatch(/\bright-1\b/)
    expect(action.className).toMatch(/\btop-1\b/)
    expect(screen.getByTestId('watch-card-image').contains(action)).toBe(true)
    expect(screen.getByTestId('watch-card-body').contains(action)).toBe(false)
    expect(screen.getByTestId('watch-card-body').contains(price)).toBe(true)
    expect(link.className).toMatch(/\bmd:size-9\b/)
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
      name: 'share',
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

    expect(within(body).getByText('R$ 450,00')).toBeDefined()
    expect(within(body).getByText('17% OFF')).toBeDefined()
    expect(within(body).getByTestId('price-current').getAttribute('aria-label')).toBe('R$ 369,90')
    expect(within(body).getByText('no pix')).toBeDefined()
    expect(within(body).getByText(creditInstallmentLabel(369.9))).toBeDefined()
    expect(within(body).queryByText('Disponível')).toBeNull()
    const list = screen.getByTestId('price-list')
    const badge = screen.getByTestId('price-badge')
    const current = screen.getByTestId('price-current')
    expect(list.className).toMatch(/\btext-xs\b/)
    expect(list.className).not.toMatch(/\bmd:text-sm\b/)
    expect(badge.className).toMatch(/text-\[11px\]/)
    expect(badge.className).not.toMatch(/\bmd:text-sm\b/)
    expect(current.className).toMatch(/text-\[18px\]/)
    expect(screen.getByTestId('price-currency').className).toMatch(/text-\[12px\]/)
    expect(screen.getByTestId('price-cents').className).toMatch(/text-\[12px\]/)
    expect(badge.parentElement).toBe(list.parentElement)
    expect(screen.getByTestId('price-pix').parentElement).toBe(current.parentElement)
    expect(screen.getByTestId('price-pix').parentElement).not.toBe(list.parentElement)
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
      listings: [baseListing({}, { price: 80, listPrice: 100 })],
    })
    renderWatchCard(product, 'available', initialLabels)
    const offerRow = screen.getByTestId('offer-row')
    const body = screen.getByTestId('watch-card-body')
    expect(body.contains(offerRow)).toBe(true)
    expect(frame.contains(offerRow)).toBe(false)
    expect(within(offerRow).getByTestId('offer-badge').textContent).toContain('acima 20%')
    expect(screen.getByTestId('price-current').className).toMatch(/\btext-destructive\b/)
  })

  it('OSC-33: places the offer row in the card body above the title and the price', () => {
    const product = baseProduct({
      listings: [baseListing({}, { price: 80, listPrice: 100 })],
    })
    renderWatchCard(product, 'available', initialLabels)
    const offerRow = screen.getByTestId('offer-row')
    const priceBlock = screen.getByTestId('price-block')
    const heading = screen.getByRole('heading', { name: 'Seculus' })
    expect(offerRow.textContent).toContain('acima 20%')
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
              listPrice: 1200,
              mainImage: 'foto-principal.webp',
            },
          ],
        }),
      ],
    })
    const card = cardFor(product, 'on-order', initialLabels)
    renderWatchCard(product, 'on-order', initialLabels)
    const consult = screen.getByTestId('consult-label')
    expect(consult.textContent).toBe(ON_ORDER_PRICE_NOTE)
    expect(consult.className).toMatch(/\btext-xs\b/)
    expect(consult.className).not.toMatch(/\bmd:text-sm\b/)
    expect(consult.className).toMatch(/\bfont-medium\b/)
    expect(consult.className).toMatch(/\btext-destructive\b/)
    expect(consult.textContent).not.toMatch(/R\$/)
    expect(screen.queryByTestId('price-block')).toBeNull()
    expect(screen.queryByTestId('price-pix')).toBeNull()
    expect(screen.queryByTestId('price-installments')).toBeNull()
    expect(screen.queryByTestId('offer-row')).toBeNull()
    expect(screen.queryByTestId('campaign-badge')).toBeNull()
    expect(screen.queryByTestId('watch-card-campaign')).toBeNull()
    expect(card.path).not.toMatch(/\?v=/)
    expect(card.offers).toEqual([])
    expect(card.campaign).toBeNull()
  })

  it('LBL-25: shows campaign shortText in a badge at the bottom-left of the photo', () => {
    const product = baseProduct({
      listings: [baseListing({}, { price: 100 })],
    })
    renderWatchCard(product, 'available', initialLabels)
    const frame = screen.getByTestId('watch-card-image')
    const anchor = within(frame).getByTestId('watch-card-campaign')
    const badge = within(anchor).getByTestId('campaign-badge')
    expect(anchor.className).toMatch(/\bbottom-1\b/)
    expect(anchor.className).toMatch(/\bleft-1\b/)
    expect(anchor.className).toMatch(/\babsolute\b/)
    expect(badge.textContent).toContain('Black Friday')
    expect(badge.className).toMatch(/\bh-5\b/)
    expect(badge.className).toMatch(/\btext-xs\b/)
  })

  it('LBL-26: shows each resolved offer text above the price when not on order', () => {
    const product = baseProduct({
      listings: [baseListing({}, { price: 80, listPrice: 100 })],
    })
    renderWatchCard(product, 'available', initialLabels)
    const offerBadge = screen.getByTestId('offer-badge')
    expect(offerBadge.textContent).toContain('acima 20%')
    expect(
      offerBadge.compareDocumentPosition(screen.getByTestId('price-block')) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0)
  })

  it('LBL-27: omits campaign badge and offer row while the card variant is on order', () => {
    const product = baseProduct({
      listings: [
        baseListing({
          availabilityStatus: 'on_order',
          variants: [
            {
              axes: [],
              price: 80,
              listPrice: 100,
              mainImage: 'foto-principal.webp',
            },
          ],
        }),
      ],
    })
    renderWatchCard(product, 'on-order', initialLabels)
    expect(screen.queryByTestId('watch-card-campaign')).toBeNull()
    expect(screen.queryByTestId('campaign-badge')).toBeNull()
    expect(screen.queryByTestId('offer-row')).toBeNull()
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
      expect.stringContaining('aspect-square'),
      expect.stringContaining('aspect-square'),
    ])
  })
})
