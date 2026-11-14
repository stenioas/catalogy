import { act } from 'react'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { creditInstallmentLabel, homeCards, type Listing, type Product, type Variant } from '@catalogo/shared'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryRouter, MemoryRouter, RouterProvider, useParams } from 'react-router-dom'

import { WatchCard } from '../components/catalog/watch-card'
import { ON_ORDER_PRICE_NOTE } from '../components/catalog/price-block'

import {
  applyThemeClass,
  THEME_STORAGE_KEY,
  ThemeProvider,
} from '../components/theme-provider'
import { WatchPage } from './watch-page'

const catalogHref = '/'
let width = 390
const mediaListeners = new Set<() => void>()
function resize(next: number) {
  width = next
  act(() => { mediaListeners.forEach((listener) => listener()) })
}

const STATE_FROM_LABEL: Record<string, Listing['state']> = {
  Novo: 'new',
  Openbox: 'openbox',
  Usado: 'used',
  new: 'new',
  openbox: 'openbox',
  used: 'used',
  defective: 'defective',
}

type PageFixture = {
  slug?: string
  title?: string
  description?: string
  specifications?: Product['specifications']
  state?: keyof typeof STATE_FROM_LABEL
  availabilityStatus?: Listing['availabilityStatus']
  price?: number
  listPrice?: number
  images?: string[]
  observations?: string
  offers?: NonNullable<Variant['offers']>
  enabled?: boolean
  color?: string
  orderable?: boolean
  listings?: Listing[]
  axes?: Product['axes']
}

function makeProduct(overrides: PageFixture = {}): Product {
  const images = overrides.images ?? ['foto.webp']
  const color = overrides.color
  const colorAxis = color !== undefined && color.trim().length > 0
  const axes = overrides.axes ?? (colorAxis
    ? [{ id: 'color', label: 'Cor', values: [{ id: 'color-value', value: color }] }]
    : [])
  const variant: Variant = {
    axes: colorAxis ? [{ axisId: 'color', valueId: 'color-value' }] : [],
    price: overrides.price ?? 369.9,
    mainImage: images[0] ?? 'foto.webp',
  }
  if (overrides.listPrice !== undefined) variant.listPrice = overrides.listPrice
  if (overrides.offers !== undefined) variant.offers = overrides.offers
  if (overrides.orderable !== undefined) variant.orderable = overrides.orderable
  if ('observations' in overrides) {
    if (overrides.observations !== undefined) variant.observations = overrides.observations
  } else {
    variant.observations = 'Entrega em mãos.'
  }
  const listing: Listing = {
    id: 'listing',
    state: STATE_FROM_LABEL[overrides.state ?? 'new'] ?? 'new',
    availabilityStatus: overrides.availabilityStatus ?? 'available',
    images,
    variants: overrides.listings === undefined ? [variant] : [],
  }
  if (overrides.enabled !== undefined) listing.enabled = overrides.enabled
  const product: Product = {
    slug: overrides.slug ?? 'seculus-kit',
    title: overrides.title ?? 'Seculus',
    axes,
    listings: overrides.listings ?? [listing],
  }
  if ('description' in overrides) {
    if (overrides.description !== undefined) product.description = overrides.description
  } else {
    product.description = 'Caixa de aço.'
  }
  if ('specifications' in overrides) {
    if (overrides.specifications !== undefined) product.specifications = overrides.specifications
  } else {
    product.specifications = [
      { label: 'Marca', value: 'Seculus' },
      { label: 'Material da pulseira', value: 'Aço' },
    ]
  }
  return product
}

const { mockProductsRef } = vi.hoisted(() => ({
  mockProductsRef: { current: [] as Product[] },
}))

vi.mock('../catalog/products.generated', () => ({
  get products() {
    return mockProductsRef.current
  },
}))

function renderWatchPage(slug = 'seculus-kit', withSellerQuery = false, listingId?: string) {
  const params = new URLSearchParams()
  if (withSellerQuery) params.set('seller', 'alexandre')
  const query = params.toString()
  const path = listingId
    ? `/product/${slug}/${listingId}${query ? `?${query}` : ''}`
    : `/product/${slug}${query ? `?${query}` : ''}`
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <WatchPage slug={slug} listingId={listingId} />
      </MemoryRouter>
    </ThemeProvider>,
  )
}

function installObserver(intersectionRatio: number) {
  class FakeIntersectionObserver {
    constructor(private readonly callback: IntersectionObserverCallback) {}

    observe() {
      this.callback(
        [{ intersectionRatio, isIntersecting: intersectionRatio > 0 } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      )
    }

    unobserve() {}

    disconnect() {}

    takeRecords() {
      return []
    }
  }

  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
}

function follows(earlier: HTMLElement, later: HTMLElement) {
  return (
    earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING
  ) !== 0
}

describe('WatchPage (CAT-57–CAT-69, CAT-87, CAT-88)', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    mockProductsRef.current = []
    localStorage.removeItem(THEME_STORAGE_KEY)
    document.documentElement.classList.remove('dark')
  })

  beforeEach(() => {
    width = 390
    mediaListeners.clear()
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
      get matches() {
        if (query === '(min-width: 768px)') return width >= 768
        if (query === '(min-width: 920px)') return width >= 920
        return false
      },
      media: query,
      addEventListener: (_event: string, listener: () => void) => { if (query === '(min-width: 768px)' || query === '(min-width: 920px)') mediaListeners.add(listener) },
      removeEventListener: (_event: string, listener: () => void) => { if (query === '(min-width: 768px)' || query === '(min-width: 920px)') mediaListeners.delete(listener) },
    })))
    mockProductsRef.current = [makeProduct()]
    // Ratio 1: watch-commerce is on screen, so the sticky bar is absent.
    installObserver(1)
  })

  it.each(['Novo', 'Openbox', 'Usado'] as const)('shows state %s as plain text under the title on mobile', (state) => {
    mockProductsRef.current = [makeProduct({ state })]
    renderWatchPage()
    const heading = screen.getByRole('heading', { level: 1, name: 'Seculus' })
    const line = screen.getByTestId('product-condition')
    const stateLabel = within(line).getByTestId('state-label')
    const identity = screen.getByTestId('watch-identity')
    expect(screen.queryByTestId('state-badge')).toBeNull()
    expect(stateLabel.textContent).toBe(state)
    expect(stateLabel.className).not.toMatch(/rounded/)
    expect(line.className).toMatch(/\bgap-1\.5\b/)
    expect(screen.getByTestId('watch-metadata').contains(line)).toBe(true)
    expect(identity.className).toMatch(/\bgap-0\.5\b/)
    expect(identity.className).toMatch(/\bmd:gap-2\b/)
    expect(identity.contains(line)).toBe(true)
    expect(identity.contains(heading)).toBe(true)
    expect(heading.className).toMatch(/text-\[16px\]/)
    expect(heading.className).toMatch(/\bmd:text-\[17px\]/)
    expect(heading.className).toMatch(/\bmax-md:mt-3\b/)
    expect(heading.className).toMatch(/\bmax-md:order-2\b/)
    expect(screen.getByTestId('watch-metadata').className).toMatch(/\bmax-md:order-3\b/)
    expect(heading.className).not.toMatch(/\btext-lg\b/)
    expect(heading.className).not.toMatch(/\btext-xl\b/)
  })

  it.each([
    ['available', 'Disponível'],
    ['coming_soon', 'Chega em breve'],
    ['on_order', 'Sob encomenda'],
  ] as const)('shows availability %s before the price or Sob consulta', (availabilityStatus, label) => {
    mockProductsRef.current = [makeProduct({ availabilityStatus })]
    renderWatchPage()
    const heading = screen.getByRole('heading', { level: 1, name: 'Seculus' })
    const badge = screen.getByTestId('availability-badge')
    expect(badge.textContent).toBe(label)
    expect(screen.getByTestId('watch-metadata').contains(badge)).toBe(true)
    expect(heading.className).toMatch(/\bmax-md:order-2\b/)
    expect(screen.getByTestId('watch-metadata').className).toMatch(/\bmax-md:order-3\b/)
    expect(badge.closest('[data-testid="watch-metadata"]')).toBe(screen.getByTestId('watch-metadata'))
    expect(badge.className.split(/\s+/)).toContain('text-xs')
    if (availabilityStatus === 'on_order') {
      expect(screen.queryByTestId('watch-offer')).toBeNull()
      expect(screen.queryByTestId('price-block')).toBeNull()
      expect(screen.queryByTestId('price-pix')).toBeNull()
      expect(screen.queryByTestId('price-installments')).toBeNull()
      expect(screen.getByTestId('consult-label').textContent).toBe(ON_ORDER_PRICE_NOTE)
      expect(screen.getByTestId('consult-label').className).toMatch(/text-\[15px\]/)
      expect(screen.getByTestId('consult-label').className).toMatch(/\bmd:text-base\b/)
      expect(screen.getByTestId('consult-label').className).toMatch(/\bfont-semibold\b/)
      expect(screen.getByTestId('consult-label').className).toMatch(/\btext-destructive\b/)
      expect(follows(heading, screen.getByTestId('consult-label'))).toBe(true)
      return
    }
    const installments = screen.getByTestId('price-installments')
    expect(within(screen.getByTestId('watch-offer')).queryByTestId('availability-badge')).toBeNull()
    expect(follows(badge, installments)).toBe(true)
  })

  it.each([undefined, 369.9])('renders on_order with price %s as Sob consulta in page and sticky bar', (price) => {
    const product = makeProduct({ availabilityStatus: 'on_order' })
    const variant = product.listings[0].variants[0]
    if (price === undefined) delete variant.price
    else variant.price = price
    mockProductsRef.current = [product]
    installObserver(0)
    renderWatchPage()
    expect(within(screen.getByTestId('watch-commerce')).getByTestId('consult-label').textContent).toBe(ON_ORDER_PRICE_NOTE)
    expect(within(screen.getByTestId('sticky-bar')).getByTestId('consult-label').textContent).toBe(ON_ORDER_PRICE_NOTE)
    expect(screen.queryByTestId('price-block')).toBeNull()
    expect(screen.queryByTestId('price-installments')).toBeNull()
    expect(screen.queryByTestId('price-pix')).toBeNull()
  })

  it('places the stored offer text above the price and draws no row when offers is omitted', () => {
    renderWatchPage()
    expect(screen.queryByTestId('offer-row')).toBeNull()
    cleanup()
    const stored = 'Oferta do dia'
    mockProductsRef.current = [makeProduct({
      offers: [{ text: stored, background: '#0066cc', color: '#ffffff', icon: 'Gift' }],
    })]
    renderWatchPage()
    const badge = screen.getByTestId('offer-badge')
    const price = screen.getByTestId('price-block')
    expect(badge.textContent).toBe(stored)
    expect(screen.getByTestId('watch-commerce').contains(badge)).toBe(true)
    expect(follows(badge, price)).toBe(true)
    expect(screen.queryByTestId('unmissable-offer')).toBeNull()
  })

  it('shows installment terms below the in-page price', () => {
    renderWatchPage()
    const offer = screen.getByTestId('watch-offer')
    expect(within(offer).getByTestId('price-installments').textContent).toBe(creditInstallmentLabel(369.9))
    expect(within(offer).getByTestId('price-pix').textContent).toBe('no pix')
  })

  it('places a back icon named Voltar to the left of Catálogo, linking to / (SV-12, CAT-57, CAT-58, CAT-59)', () => {
    renderWatchPage()
    const bar = screen.getByTestId('top-bar')
    const back = within(bar).getByRole('link', { name: 'Voltar' })
    const catalog = within(bar).getByRole('link', { name: 'Achavio' })
    expect(back.getAttribute('href')).toBe(catalogHref)
    expect(back.querySelector('svg')).not.toBeNull()
    expect(follows(back, catalog)).toBe(true)
  })

  it('links Catálogo to the same / href as Voltar (SV-12, CAT-60)', () => {
    renderWatchPage()
    const catalog = screen.getByRole('link', { name: 'Achavio' })
    expect(catalog.getAttribute('href')).toBe(catalogHref)
  })

  it('does not call history.back or history.go when Voltar is activated (CAT-61)', () => {
    const backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {})
    const goSpy = vi.spyOn(window.history, 'go').mockImplementation(() => {})
    const topBarSource = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../components/catalog/top-bar.tsx'),
      'utf8',
    )
    renderWatchPage()
    const back = screen.getByRole('link', { name: 'Voltar' })
    const catalog = screen.getByRole('link', { name: 'Achavio' })
    expect(back.getAttribute('href')).toBe('/')
    expect(catalog.getAttribute('href')).toBe('/')
    expect(back.tagName).toBe('A')
    expect(topBarSource).not.toMatch(/history\s*\.\s*back\b/)
    expect(topBarSource).not.toMatch(/history\s*\.\s*go\b/)
    fireEvent.click(back)
    fireEvent.click(catalog)
    expect(backSpy).not.toHaveBeenCalled()
    expect(goSpy).not.toHaveBeenCalled()
    backSpy.mockRestore()
    goSpy.mockRestore()
  })

  it('orders mobile title, media, badges, price, share, description, notes and characteristics (CATREF-13)', () => {
    renderWatchPage()
    expect(screen.getByTestId('watch-carousel').parentElement?.className).toMatch(/\bmax-md:order-1\b/)
    expect(screen.getByRole('heading', { name: 'Seculus' }).className).toMatch(/\bmax-md:order-2\b/)
    expect(screen.getByTestId('watch-metadata').className).toMatch(/\bmax-md:order-3\b/)
    expect(screen.getByTestId('watch-commerce').parentElement?.className).toMatch(/\bmax-md:order-4\b/)
    const share = screen.getByRole('link', { name: 'Compartilhar' })
    expect(screen.getByTestId('watch-offer').contains(share)).toBe(true)
    expect(screen.getByTestId('watch-offer').className).toMatch(/\bgap-3\b/)
    expect(screen.getByTestId('watch-offer').className).not.toMatch(/grid-cols-2/)
    expect(screen.getByRole('heading', { name: 'Descrição' }).parentElement?.className).toMatch(/\bmax-md:order-7\b/)
    expect(screen.getByRole('heading', { name: 'Observações' }).parentElement?.className).toMatch(/\bmax-md:order-8\b/)
    expect(screen.getByRole('heading', { name: 'Características do produto' }).parentElement?.className).toMatch(/\bmax-md:order-8\b/)
    expect(follows(screen.getByTestId('price-current'), screen.getByTestId('price-installments'))).toBe(true)
    expect(follows(screen.getByTestId('price-pix'), screen.getByTestId('price-installments'))).toBe(true)
    expect(screen.getByRole('img', { name: 'Seculus' }).getAttribute('src')).toBe('/catalog/products/seculus-kit/img/foto.webp')
    expect(screen.getByTestId('price-current').textContent).toBe('R$ 369,90')
    expect(screen.getByTestId('watch-page-column').classList.contains('catalog-column')).toBe(true)
    expect(screen.getByTestId('watch-page-column').classList.contains('watch-page-column')).toBe(true)
    expect(screen.getByTestId('watch-page-column').className).not.toMatch(/\bpt-2\b/)
    expect(screen.getByTestId('watch-page-column').className).toMatch(/\bpb-8\b/)
    expect(screen.getByTestId('watch-page-column').className).toMatch(/\bmd:py-8\b/)
    expect(screen.getByTestId('top-bar-inner').classList.contains('watch-page-column')).toBe(true)
    const intro = screen.getByTestId('watch-intro')
    expect(intro.className).toMatch(/\bcontents\b/)
    expect(intro.parentElement?.className).toMatch(/\bmax-md:gap-0\b/)
    expect(intro.parentElement?.className).toMatch(/\bgap-8\b/)
    expect(intro.contains(screen.getByTestId('watch-identity'))).toBe(true)
    expect(intro.contains(screen.getByTestId('watch-carousel'))).toBe(true)
    expect(intro.contains(screen.getByTestId('watch-commerce'))).toBe(true)
    expect(screen.getByTestId('watch-identity').className).toMatch(/\bgap-0\.5\b/)
    expect(share.querySelector('svg')?.classList.contains('lucide-share-2')).toBe(true)
    expect(share.className).toMatch(/\bh-11\b/)
    expect(share.className).toMatch(/\bw-full\b/)
    expect(share.className).toMatch(/\bpx-4\b/)
    expect(share.className).toMatch(/\bgap-2\b/)
    expect(share.className).toMatch(/\brounded-lg\b/)
    expect(share.className).toMatch(/\btext-base\b/)
    expect(share.className).not.toMatch(/\bsize-10\b/)
    expect(share.className).not.toMatch(/\bp-0\b/)
    expect(share.className).toMatch(/color-mix\(in_srgb,var\(--primary\)_16%,white\)/)
    const offer = screen.getByTestId('watch-offer')
    expect(offer.contains(share)).toBe(true)
    expect(offer.className).toMatch(/\bflex-col\b/)
    expect(offer.className).toMatch(/\bitems-stretch\b/)
    expect(offer.className).toMatch(/\bgap-3\b/)
    expect(offer.className).not.toMatch(/grid-cols-2/)
    expect(screen.getByRole('heading', { name: 'Características do produto' }).parentElement?.className).toMatch(/\bmax-md:order-8\b/)
    expect(share.textContent).toBe('Compartilhar')
  })

  it('uses 16px horizontal padding on the product content below 768px', () => {
    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../index.css'), 'utf8')
    const mobile = css.match(/@media\s*\(max-width:\s*767px\)\s*\{([\s\S]*?)\n\}/)?.[1]
    expect(mobile).toBeDefined()
    expect(mobile).toMatch(/\.watch-page-column\s*\{[^}]*padding-inline:\s*16px/)
    expect(mobile).toMatch(/\.watch-carousel\s*\{[^}]*width:\s*calc\(100% \+ 32px\)/)
    expect(mobile).toMatch(/\.watch-carousel\s*\{[^}]*margin-inline:\s*-16px/)
    const column = css.match(/\.catalog-column\s*\{([^}]*)\}/)?.[1]
    expect(column).toMatch(/padding-inline:\s*24px/)
    expect(column).toMatch(/max-width:\s*1120px/)
    expect(css).not.toMatch(/\.watch-page-column\s*\{[^}]*max-width/)
  })

  it('hides Descrição when description contains only whitespace (CATREF-59, supersedes CAT-63)', () => {
    mockProductsRef.current = [makeProduct({ description: '   ' })]
    renderWatchPage()
    expect(screen.queryByRole('heading', { name: 'Descrição' })).toBeNull()
    expect(screen.queryByText('   ')).toBeNull()
  })

  it('hides Descrição when description is missing or "" (CAT-64)', () => {
    mockProductsRef.current = [makeProduct({ description: undefined })]
    renderWatchPage()
    expect(screen.queryByRole('heading', { name: 'Descrição' })).toBeNull()
    cleanup()
    mockProductsRef.current = [makeProduct({ description: '' })]
    renderWatchPage()
    expect(screen.queryByRole('heading', { name: 'Descrição' })).toBeNull()
  })

  it('shows Observações when observations is a non-empty string (CAT-65)', () => {
    renderWatchPage()
    expect(screen.getByRole('heading', { name: 'Observações' })).toBeDefined()
    expect(screen.getByText('Entrega em mãos.')).toBeDefined()
  })

  it('hides Observações when observations is missing or "" (CAT-66)', () => {
    mockProductsRef.current = [makeProduct({ observations: undefined })]
    renderWatchPage()
    expect(screen.queryByRole('heading', { name: 'Observações' })).toBeNull()
    cleanup()
    mockProductsRef.current = [makeProduct({ observations: '' })]
    renderWatchPage()
    expect(screen.queryByRole('heading', { name: 'Observações' })).toBeNull()
  })

  it('shows Características do produto as a two-column table with no header row (CAT-67)', () => {
    renderWatchPage()
    expect(screen.getByRole('heading', { name: 'Características do produto' })).toBeDefined()
    const table = screen.getByRole('table')
    expect(table.querySelectorAll('th')).toHaveLength(0)
    expect(table.querySelector('thead')).toBeNull()
    const rows = within(table).getAllByRole('row')
    expect(rows).toHaveLength(2)
    expect(
      within(rows[0]).getAllByRole('cell').map((cell) => cell.textContent),
    ).toEqual(['Marca', 'Seculus'])
    expect(
      within(rows[1]).getAllByRole('cell').map((cell) => cell.textContent),
    ).toEqual(['Material da pulseira', 'Aço'])
  })

  it('hides Características do produto when specifications is missing or an empty list (CAT-68)', () => {
    mockProductsRef.current = [makeProduct({ specifications: undefined })]
    renderWatchPage()
    expect(screen.queryByRole('heading', { name: 'Características do produto' })).toBeNull()
    expect(screen.queryByRole('table')).toBeNull()
    cleanup()
    mockProductsRef.current = [makeProduct({ specifications: [] })]
    renderWatchPage()
    expect(screen.queryByRole('heading', { name: 'Características do produto' })).toBeNull()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('left-aligns the specification table text (CAT-69)', () => {
    renderWatchPage()
    const table = screen.getByRole('table')
    expect(table.className).toMatch(/\btext-left\b/)
  })

  it('shows the same watch when the URL has ?seller= (SV-10, AC2)', () => {
    renderWatchPage('seculus-kit', true)
    expect(screen.getByRole('heading', { name: 'Seculus' })).toBeDefined()
    expect(screen.getByRole('link', { name: 'Voltar' }).getAttribute('href')).toBe('/')
  })

  it('shows the missing-watch message when enabled is false', () => {
    mockProductsRef.current = [makeProduct({ enabled: false })]
    renderWatchPage()
    expect(screen.getByText('Este relógio não está no catálogo.')).toBeDefined()
    expect(screen.queryByRole('heading', { name: 'Seculus' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Compartilhar' })).toBeNull()
    expect(document.querySelector('a[href*="wa.me"]')).toBeNull()
  })

  it('shows the missing-watch message and hides Eu quero! when the slug is absent (SV-15, CAT-87, CAT-88)', () => {
    renderWatchPage('slug-ausente')
    const column = screen.getByTestId('watch-page-column')
    expect(column.classList.contains('catalog-column')).toBe(true)
    expect(within(column).getByText('Este relógio não está no catálogo.')).toBeDefined()
    expect(screen.queryByRole('link', { name: 'Compartilhar' })).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Seculus' })).toBeNull()
  })

  it('shows the sticky bar with price and the same share href when watch-commerce is offscreen (CAT-89, CAT-90, CAT-151)', () => {
    installObserver(0)
    renderWatchPage()
    const bar = screen.getByTestId('sticky-bar')
    const barLink = within(bar).getByRole('link', { name: 'Compartilhar' })
    const links = screen.getAllByRole('link', { name: 'Compartilhar' })
    expect(links).toHaveLength(2)
    const pageLink = links.find((link) => !bar.contains(link))
    if (!pageLink) throw new Error('in-page WhatsApp link not found')
    expect(barLink.getAttribute('href')).toBe(pageLink.getAttribute('href'))
    expect(pageLink.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/\?text=/)
    expect(within(bar).getByTestId('price-current').textContent).toBe('R$ 369,90')
    expect(within(bar).getAllByRole('link')).toHaveLength(1)
  })

  it('repeats the stored offer above the price in the footer and keeps the normal price color', () => {
    installObserver(0)
    const stored = 'Oferta do dia'
    mockProductsRef.current = [makeProduct({
      offers: [{ text: stored, background: '#0066cc', color: '#ffffff', icon: 'Gift' }],
    })]
    renderWatchPage()
    const bar = screen.getByTestId('sticky-bar')
    const footerBadge = within(bar).getByTestId('offer-badge')
    const footerPrice = within(bar).getByTestId('price-current')
    const pagePrice = within(screen.getByTestId('watch-commerce')).getByTestId('price-current')
    expect(footerBadge.textContent).toBe(stored)
    expect(follows(footerBadge, footerPrice)).toBe(true)
    expect(footerPrice.className).not.toMatch(/\btext-destructive\b/)
    expect(pagePrice.className).not.toMatch(/\btext-destructive\b/)
  })

  it('hides the sticky bar while any part of watch-commerce is visible (CAT-89)', () => {
    installObserver(0.4)
    renderWatchPage()
    expect(screen.queryByTestId('sticky-bar')).toBeNull()
    expect(screen.getAllByRole('link', { name: 'Compartilhar' })).toHaveLength(1)
  })

  it('hides the sticky bar at ratio 1 (CAT-89)', () => {
    installObserver(1)
    renderWatchPage()
    expect(screen.queryByTestId('sticky-bar')).toBeNull()
    expect(screen.getAllByRole('link', { name: 'Compartilhar' })).toHaveLength(1)
  })

  it('shows specifications in the shadcn Table under Características do produto (SV-45)', () => {
    renderWatchPage()
    const heading = screen.getByRole('heading', { name: 'Características do produto' })
    const table = screen.getByRole('table')
    expect(table.getAttribute('data-slot')).toBe('table')
    expect(follows(heading, table)).toBe(true)
    const rows = within(table).getAllByRole('row')
    expect(rows).toHaveLength(2)
    for (const row of rows) {
      expect(within(row).getAllByRole('cell')).toHaveLength(2)
    }
    expect(within(rows[0]).getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      'Marca',
      'Seculus',
    ])
    expect(within(rows[1]).getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      'Material da pulseira',
      'Aço',
    ])
    expect(table.className.split(/\s+/)).toContain('table-fixed')
    const section = heading.parentElement
    expect(section?.className.split(/\s+/)).toEqual(expect.arrayContaining(['w-full', 'min-w-0']))
    for (const cell of within(table).getAllByRole('cell')) {
      const tokens = cell.className.split(/\s+/)
      expect(tokens).toContain('whitespace-normal')
      expect(tokens).toContain('break-words')
      expect(tokens).not.toContain('whitespace-nowrap')
    }
  })

  it('turns http and https specification values into Ver anúncio similar (SV-46, SV-49)', () => {
    const httpsUrl = `https://example.com/anuncio/${'a'.repeat(180)}`
    const httpUrl = 'http://example.com/espelho'
    mockProductsRef.current = [
      makeProduct({
        specifications: [
          { label: 'Anúncio', value: httpsUrl },
          { label: 'Espelho', value: httpUrl },
          { label: 'Marca', value: 'Seculus' },
        ],
      }),
    ]
    renderWatchPage()
    const table = screen.getByRole('table')
    const rows = within(table).getAllByRole('row')
    expect(rows.map((row) => within(row).getAllByRole('cell')[0].textContent)).toEqual([
      'Anúncio',
      'Espelho',
      'Marca',
    ])
    const links = screen.getAllByRole('link', { name: 'Ver anúncio similar' })
    expect(links).toHaveLength(2)
    expect(links[0].getAttribute('href')).toBe(httpsUrl)
    expect(links[0].getAttribute('target')).toBe('_blank')
    expect(links[0].getAttribute('rel')).toBe('noopener noreferrer')
    expect(links[0].textContent).toBe('Ver anúncio similar')
    expect(links[1].getAttribute('href')).toBe(httpUrl)
    expect(links[1].getAttribute('target')).toBe('_blank')
    expect(links[1].getAttribute('rel')).toBe('noopener noreferrer')
    expect(links[1].textContent).toBe('Ver anúncio similar')
    expect(table.textContent).not.toContain(httpsUrl)
    expect(table.textContent).not.toContain(httpUrl)
    expect(table.textContent).toContain('Seculus')
    expect(within(table).queryByRole('link', { name: 'Seculus' })).toBeNull()
  })

  it('paints Ver anúncio similar #0066cc while the theme is light (SV-47)', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
    applyThemeClass('light')
    mockProductsRef.current = [
      makeProduct({
        specifications: [{ label: 'Anúncio', value: 'https://example.com/claro' }],
      }),
    ]
    renderWatchPage()
    const link = screen.getByRole('link', { name: 'Ver anúncio similar' })
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(link.className.split(/\s+/)).toContain('text-[#0066cc]')
  })

  it('paints Ver anúncio similar #2997ff while the theme is dark (SV-48)', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    applyThemeClass('dark')
    mockProductsRef.current = [
      makeProduct({
        specifications: [{ label: 'Anúncio', value: 'https://example.com/escuro' }],
      }),
    ]
    renderWatchPage()
    const link = screen.getByRole('link', { name: 'Ver anúncio similar' })
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(link.className.split(/\s+/)).toContain('dark:text-[#2997ff]')
  })

  it('paints the page title and section titles with foreground (SV-42)', () => {
    renderWatchPage()
    for (const name of ['Seculus', 'Descrição', 'Características do produto', 'Observações']) {
      const heading = screen.getByRole('heading', { name })
      expect(heading.className.split(/\s+/)).toContain('text-foreground')
    }
  })

  it('gives the watch page main max-width 100%, min-width 0 and overflow-x clip (SV-51)', () => {
    renderWatchPage()
    const main = screen.getByRole('main')
    const tokens = main.className.split(/\s+/)
    expect(tokens).toContain('max-w-full')
    expect(tokens).toContain('min-w-0')
    expect(tokens).toContain('overflow-x-clip')
    expect(main.contains(screen.getByTestId('watch-page-column'))).toBe(true)
  })

  it('does not add horizontal document scroll when a specification URL is long (SV-52)', () => {
    const longUrl = `https://example.com/${'segmento-longo-'.repeat(40)}`
    mockProductsRef.current = [
      makeProduct({
        specifications: [{ label: 'Link', value: longUrl }],
      }),
    ]
    renderWatchPage()
    const root = document.documentElement
    expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
    expect(document.body.scrollWidth).toBeLessThanOrEqual(document.body.clientWidth)
    const main = screen.getByRole('main')
    expect(main.scrollWidth).toBeLessThanOrEqual(main.clientWidth)
    expect(main.textContent).not.toContain(longUrl)
    expect(screen.getByRole('link', { name: 'Ver anúncio similar' }).textContent).toBe(
      'Ver anúncio similar',
    )
  })
  it.each([390, 768, 919, 920, 1440])('renders one title and primary action at %i px (CATREF-14/17)', (viewport) => {
    width = viewport
    mockProductsRef.current = [makeProduct({
      title: 'Título completo '.repeat(20),
      color: '  Azul  ',
      listPrice: 449.9,
      offers: [{ text: 'Oferta do dia', background: '#0066cc', color: '#ffffff', icon: 'Gift' }],
    })]
    renderWatchPage()
    const heading = screen.getByRole('heading', { level: 1 })
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(heading.textContent).toBe('Título completo '.repeat(20))
    expect(heading.className).not.toMatch(/line-clamp|truncate/)
    expect(screen.getAllByRole('link', { name: 'Compartilhar' })).toHaveLength(1)
    expect(screen.queryByTestId('axis-line')).toBeNull()
    expect(screen.queryByTestId('variant-name')).toBeNull()
    expect(screen.queryByTestId('variant-strip')).toBeNull()
    expect(screen.getByTestId('axis-selectors').textContent).toContain('Cor:   Azul  ')
    expect(screen.getByTestId('price-list').textContent).toBe('De R$ 449,90')
    expect(follows(heading, screen.getByTestId('offer-badge'))).toBe(true)
    expect(follows(screen.getByTestId('offer-badge'), screen.getByTestId('price-current'))).toBe(true)
    expect(follows(screen.getByTestId('price-current'), screen.getByTestId('axis-selectors'))).toBe(true)
    if (viewport >= 920) {
      const left = screen.getByTestId('watch-left-column')
      const right = screen.getByTestId('watch-right-column')
      expect(left.parentElement).toBe(right.parentElement)
      expect(left.parentElement?.className).toContain('grid-cols-[fit-content(calc(476px+3.5rem+0.75rem))_minmax(220px,1fr)]')
      expect(within(left).getByRole('group', { name: 'Miniaturas do produto' })).toBeDefined()
      expect(within(right).getByRole('heading', { level: 1 })).toBe(heading)
      expect(follows(within(right).getByTestId('watch-metadata'), heading)).toBe(true)
      expect(follows(heading, within(right).getByTestId('watch-offer'))).toBe(true)
      expect(follows(within(right).getByTestId('price-current'), within(right).getByTestId('price-installments'))).toBe(true)
      const description = within(right).getByRole('heading', { name: 'Descrição' })
      const share = within(right).getByRole('link', { name: 'Compartilhar' })
      expect(follows(within(right).getByTestId('watch-offer'), description)).toBe(true)
      expect(follows(description, share)).toBe(true)
      expect(within(right).getByTestId('watch-offer').contains(share)).toBe(false)
      expect(share.className).toMatch(/\bw-full\b/)
      expect(share.className).toMatch(/color-mix\(in_srgb,var\(--primary\)_16%,white\)/)
      expect(share.textContent).toBe('Compartilhar')
      expect(share.querySelector('svg')?.classList.contains('lucide-share-2')).toBe(true)
      expect(screen.getByTestId('price-list').className).toMatch(/\btext-sm\b/)
      expect(screen.getByTestId('price-badge').className).toMatch(/\btext-xs\b/)
      expect(screen.getByTestId('price-current').className).toMatch(/\btext-2xl\b/)
      const sections = within(left).getAllByRole('heading').map((node) => node.textContent)
      expect(sections).toEqual(['Observações', 'Características do produto'])
      expect(follows(within(left).getByTestId('desktop-product-media'), within(left).getByRole('heading', { name: 'Observações' }))).toBe(true)
      expect(screen.queryByTestId('watch-carousel')).toBeNull()
    } else {
      expect(screen.queryByTestId('watch-left-column')).toBeNull()
      const share = screen.getByRole('link', { name: 'Compartilhar' })
      expect(screen.getByTestId('watch-offer').contains(share)).toBe(true)
      expect(screen.getByTestId('watch-offer').className).toMatch(/\bflex-col\b/)
      expect(screen.getByTestId('watch-offer').className).toMatch(/\bgap-3\b/)
      expect(follows(screen.getByTestId('axis-selectors'), share)).toBe(true)
      if (viewport >= 768) {
        expect(follows(screen.getByTestId('watch-metadata'), heading)).toBe(true)
        expect(follows(screen.getByTestId('watch-metadata'), screen.getByTestId('watch-offer'))).toBe(true)
        expect(follows(screen.getByTestId('price-current'), share)).toBe(true)
        expect(screen.getByRole('group', { name: 'Miniaturas do produto' })).toBeDefined()
        expect(screen.queryByTestId('watch-carousel')).toBeNull()
        expect(screen.queryByRole('button', { name: 'Anterior' })).toBeNull()
        expect(screen.queryByTestId('carousel-dots')).toBeNull()
      } else {
        expect(screen.getByTestId('watch-carousel').parentElement?.className).toMatch(/\bmax-md:order-1\b/)
        expect(heading.className).toMatch(/\bmax-md:order-2\b/)
        expect(screen.getByTestId('watch-metadata').className).toMatch(/\bmax-md:order-3\b/)
        expect(screen.getByTestId('watch-commerce').parentElement?.className).toMatch(/\bmax-md:order-4\b/)
        expect(screen.getByTestId('watch-offer').contains(screen.getByTestId('axis-selectors'))).toBe(true)
        expect(follows(screen.getByTestId('axis-selectors'), share)).toBe(true)
        expect(screen.getByTestId('watch-offer').className).toMatch(/\bgap-3\b/)
        expect(screen.getByRole('heading', { name: 'Descrição' }).parentElement?.className).toMatch(/\bmax-md:order-7\b/)
        expect(screen.getByRole('heading', { name: 'Características do produto' }).parentElement?.className).toMatch(/\bmax-md:order-8\b/)
      }
    }
  })

  it.each([undefined, '', '   '])('omits absent or empty color %s without inferring Cor from specifications (CATREF-55/56)', (color) => {
    mockProductsRef.current = [makeProduct({ color, description: 'Relógio dourado', specifications: [{ label: 'Cor', value: 'Prata' }] })]
    renderWatchPage()
    expect(screen.queryByTestId('axis-line')).toBeNull()
    expect(screen.queryByTestId('variant-name')).toBeNull()
    expect(within(screen.getByRole('table')).getByText('Prata')).toBeDefined()
  })

  it.each([390, 920])('preserves color and independent repeated specifications at %i px (CATREF-54/57/58)', (viewport) => {
    width = viewport
    mockProductsRef.current = [makeProduct({ color: '  Azul  ', specifications: [{ label: 'Cor', value: 'Prata' }, { label: 'Cor do mostrador', value: 'Preto' }, { label: 'Cor da pulseira', value: 'Aço' }, { label: 'Cor', value: 'Prata' }, { label: 'Vazio', value: '' }, { label: 'Espaços', value: '   ' }] })]
    renderWatchPage()
    expect(screen.queryByTestId('axis-line')).toBeNull()
    expect(screen.getByTestId('axis-selectors').textContent).toContain('Cor:   Azul  ')
    expect(follows(screen.getByTestId('price-block'), screen.getByTestId('axis-selectors'))).toBe(true)
    expect(within(screen.getByRole('table')).getAllByRole('row').map((row) => row.textContent)).toEqual(['CorPrata', 'Cor do mostradorPreto', 'Cor da pulseiraAço', 'CorPrata'])
  })

  it.each([390, 920])('omits all empty sections at %i px (CATREF-59)', (viewport) => {
    width = viewport
    mockProductsRef.current = [makeProduct({ description: '   ', observations: ' \n ', specifications: [{ label: 'Marca', value: ' ' }] })]
    renderWatchPage()
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull()
    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.getByRole('main').querySelectorAll('section')).toHaveLength(0)
  })

  it.each([390, 920])('preserves filled content verbatim and exact sharing destination at %i px (CATREF-59/67)', (viewport) => {
    width = viewport
    installObserver(0.4)
    mockProductsRef.current = [makeProduct({ description: '  Caixa de aço.  ', observations: '  Entrega em mãos.  ' })]
    renderWatchPage()
    expect(screen.getByRole('heading', { name: 'Descrição' }).parentElement?.querySelector('p')?.textContent).toBe('  Caixa de aço.  ')
    expect(screen.getByRole('heading', { name: 'Observações' }).parentElement?.querySelector('p')?.textContent).toBe('  Entrega em mãos.  ')
    for (const link of screen.getAllByRole('link', { name: 'Compartilhar' })) expect(link.getAttribute('href')).toBe(`https://wa.me/?text=${encodeURIComponent(`Olá, tenho interesse no Seculus. Novo, Disponível. ${window.location.origin}/product/seculus-kit/listing`)}`)
  })

  it('reobserves the current primary WhatsApp after a breakpoint switch (CATREF-68/69)', () => {
    const targets: Element[] = []
    const disconnect = vi.fn()
    vi.stubGlobal('IntersectionObserver', class {
      constructor(private callback: IntersectionObserverCallback) {}
      observe(target: Element) { targets.push(target); this.callback([{ intersectionRatio: 1 } as IntersectionObserverEntry], this as unknown as IntersectionObserver) }
      disconnect = disconnect
    })
    renderWatchPage()
    const mobile = screen.getByTestId('watch-commerce')
    resize(920)
    const desktop = screen.getByTestId('watch-commerce')
    expect(mobile.isConnected).toBe(false)
    expect(desktop).not.toBe(mobile)
    expect(targets).toEqual([mobile, desktop])
    expect(disconnect).toHaveBeenCalled()
    expect(screen.queryByTestId('sticky-bar')).toBeNull()
  })

  describe('closed specification labels on the watch page (SPEC-09–SPEC-13)', () => {
    it('shows specifications in registration order (SPEC-09)', () => {
      mockProductsRef.current = [
        makeProduct({
          specifications: [
            { label: 'Garantia', value: '90 dias.' },
            { label: 'Marca', value: 'Seculus' },
            { label: 'Resistência à água', value: '50m (5 ATM)' },
            { label: 'Modelo', value: 'Kit' },
          ],
        }),
      ]
      renderWatchPage()
      expect(
        within(screen.getByRole('table'))
          .getAllByRole('row')
          .map((row) => within(row).getAllByRole('cell')[0].textContent),
      ).toEqual(['Garantia', 'Marca', 'Resistência à água', 'Modelo'])
    })

    it('keeps labels outside the old watch list in registration order (SPEC-10)', () => {
      mockProductsRef.current = [
        makeProduct({
          specifications: [
            { label: 'Fora Z', value: 'último-fora' },
            { label: 'Garantia', value: '90 dias.' },
            { label: 'Fora A', value: 'primeiro-fora' },
            { label: 'Marca', value: 'Seculus' },
          ] as Product['specifications'],
        }),
      ]
      renderWatchPage()
      expect(
        within(screen.getByRole('table'))
          .getAllByRole('row')
          .map((row) => within(row).getAllByRole('cell').map((cell) => cell.textContent)),
      ).toEqual([
        ['Fora Z', 'último-fora'],
        ['Garantia', '90 dias.'],
        ['Fora A', 'primeiro-fora'],
        ['Marca', 'Seculus'],
      ])
    })

    it('omits specification rows whose value has no non-space character (SPEC-11)', () => {
      mockProductsRef.current = [
        makeProduct({
          specifications: [
            { label: 'Marca', value: 'Seculus' },
            { label: 'Modelo', value: '   ' },
            { label: 'Garantia', value: '' },
          ],
        }),
      ]
      renderWatchPage()
      const rows = within(screen.getByRole('table')).getAllByRole('row')
      expect(rows).toHaveLength(1)
      expect(within(rows[0]).getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
        'Marca',
        'Seculus',
      ])
    })

    it('reads displayed color only from the color field, not from specifications (SPEC-12)', () => {
      mockProductsRef.current = [
        makeProduct({
          color: 'Azul',
          specifications: [{ label: 'Material da pulseira', value: 'Prata' }],
        }),
      ]
      renderWatchPage()
      expect(screen.queryByTestId('axis-line')).toBeNull()
      expect(screen.getByRole('group', { name: 'Cor: Azul' })).toBeDefined()
      expect(follows(screen.getByTestId('price-block'), screen.getByTestId('axis-selectors'))).toBe(true)
      expect(within(screen.getByRole('table')).queryByText('Azul')).toBeNull()
      expect(within(screen.getByRole('table')).getByText('Prata')).toBeDefined()
    })

    it('shows Ver anúncio similar for http(s) values without raw URL text (SPEC-13)', () => {
      const url = 'https://loja.example/item'
      mockProductsRef.current = [
        makeProduct({
          specifications: [{ label: 'Modelo', value: url }],
        }),
      ]
      renderWatchPage()
      const link = screen.getByRole('link', { name: 'Ver anúncio similar' })
      expect(link.getAttribute('href')).toBe(url)
      expect(screen.getByRole('table').textContent).not.toContain(url)
    })
  })

  it('keeps the shared gallery and selection mounted across page compositions (CATREF-31)', () => {
    width = 920
    mockProductsRef.current = [makeProduct({ images: ['one.webp', 'two.webp'] })]
    renderWatchPage()
    fireEvent.click(screen.getByRole('button', { name: 'Foto 2' }))
    fireEvent.click(screen.getByRole('button', { name: 'Abrir galeria na foto 2' }))
    const gallery = screen.getByRole('dialog', { name: 'Galeria de fotos' })
    resize(390)
    expect(screen.getByRole('dialog', { name: 'Galeria de fotos' })).toBe(gallery)
    expect(within(gallery).getByRole('img', { name: 'Seculus' }).getAttribute('src')).toBe('/catalog/products/seculus-kit/img/two.webp')
    fireEvent.click(within(gallery).getByRole('button', { name: 'Fechar' }))
    expect(within(screen.getByTestId('watch-carousel')).getByRole('img', { name: 'Seculus' }).getAttribute('src')).toBe('/catalog/products/seculus-kit/img/two.webp')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Abrir galeria na foto 2' }))
  })

  function listingProduct(): Product {
    return {
      slug: 'seculus-kit',
      title: 'Seculus',
      description: 'Caixa de aço.',
      axes: [
        {
          id: 'color',
          label: 'Cor',
          values: [
            { id: 'azul', value: 'Azul marinho', alias: 'Azul' },
            { id: 'preto', value: 'Preto' },
          ],
        },
      ],
      specifications: [{ label: 'Marca', value: 'Do produto' }],
      listings: [
        {
          id: 'listing',
          state: 'new',
          availabilityStatus: 'available',
          images: ['a.webp', 'b.webp'],
          specifications: [{ label: 'Garantia', value: 'Do anúncio' }],
          variants: [
            {
              axes: [{ axisId: 'color', valueId: 'azul' }],
              price: 10,
              listPrice: 12,
              mainImage: 'a.webp',
              observations: 'Obs A',
            },
            {
              axes: [{ axisId: 'color', valueId: 'preto' }],
              price: 20,
              mainImage: 'b.webp',
              observations: 'Obs B',
              offers: [{ text: 'oferta preto', background: '#111111', color: '#ffffff', icon: 'Gift' }],
            },
          ],
        },
        {
          id: 'outro',
          state: 'used',
          availabilityStatus: 'coming_soon',
          images: ['c.webp'],
          specifications: [{ label: 'Garantia', value: 'Do outro' }],
          variants: [
            {
              axes: [{ axisId: 'color', valueId: 'azul' }],
              price: 99,
              mainImage: 'c.webp',
              observations: 'Obs outro',
            },
          ],
        },
      ],
    }
  }

  it('shows the product sheet before the listing sheet and hides the other listing', () => {
    mockProductsRef.current = [listingProduct()]
    renderWatchPage()
    const productHeading = screen.getByRole('heading', { name: 'Características do produto' })
    const listingHeading = screen.getByRole('heading', { name: 'Características do anúncio' })
    expect(follows(productHeading, listingHeading)).toBe(true)
    const tables = screen.getAllByRole('table')
    expect(tables).toHaveLength(2)
    expect(within(tables[0]!).getByText('Do produto')).toBeDefined()
    expect(within(tables[1]!).getByText('Do anúncio')).toBeDefined()
    expect(follows(tables[0]!, tables[1]!)).toBe(true)
    expect(screen.queryByText('Do outro')).toBeNull()
    expect(screen.queryByText('Obs outro')).toBeNull()
    expect(screen.queryByText('R$ 99,00')).toBeNull()
    expect(screen.queryByText('Usado')).toBeNull()
    expect(screen.queryByText('Chega em breve')).toBeNull()
    expect(screen.getByTestId('state-label').textContent).toBe('Novo')
    expect(screen.getByTestId('price-current').textContent).toBe('R$ 10,00')
  })

  it('keeps Indisponível on the availability line, the state label and the price, and still shares', () => {
    mockProductsRef.current = [makeProduct({ orderable: false, price: 15 })]
    renderWatchPage('seculus-kit', false, 'listing')
    expect(screen.getByTestId('state-label').textContent).toBe('Novo')
    expect(screen.getByTestId('availability-badge').textContent).toBe('Indisponível')
    expect(screen.getByTestId('price-current').textContent).toBe('R$ 15,00')
    const share = screen.getByRole('link', { name: 'Compartilhar' })
    expect(share.getAttribute('href')).toBe(`https://wa.me/?text=${encodeURIComponent(`Olá, tenho interesse no Seculus. Novo, Indisponível. ${window.location.origin}/product/seculus-kit/listing`)}`)
  })

  it('opens a listing that would not enter the home when its id is requested', () => {
    mockProductsRef.current = [{
      slug: 'oculto',
      title: 'Oculto',
      axes: [],
      listings: [{
        id: 'fora',
        state: 'used',
        availabilityStatus: 'on_order',
        images: ['foto.webp'],
        variants: [{ axes: [], price: 15, mainImage: 'foto.webp', orderable: false }],
      }],
    }]
    renderWatchPage('oculto')
    expect(screen.getByText('Este relógio não está no catálogo.')).toBeDefined()
    expect(screen.queryByRole('link', { name: 'Compartilhar' })).toBeNull()
    cleanup()
    renderWatchPage('oculto', false, 'fora')
    expect(screen.getByRole('heading', { level: 1, name: 'Oculto' })).toBeDefined()
    expect(screen.getByTestId('state-label').textContent).toBe('Usado')
    expect(screen.getByTestId('availability-badge').textContent).toBe('Indisponível')
    expect(screen.getByTestId('consult-label').textContent).toBe(ON_ORDER_PRICE_NOTE)
    expect(screen.queryByTestId('price-block')).toBeNull()
    expect(screen.queryByTestId('price-pix')).toBeNull()
    expect(screen.queryByTestId('price-installments')).toBeNull()
    expect(screen.getByRole('link', { name: 'Compartilhar' })).toBeDefined()
  })

  it('shows the missing phrase and omits WhatsApp when the listing id does not exist', () => {
    mockProductsRef.current = [makeProduct()]
    renderWatchPage('seculus-kit', false, 'ausente')
    expect(screen.getByText('Este relógio não está no catálogo.')).toBeDefined()
    expect(screen.queryByRole('link', { name: 'Compartilhar' })).toBeNull()
    expect(document.querySelector('a[href*="wa.me"]')).toBeNull()
  })

  it('places the axis value after the price and drops the name line when there is no axis', () => {
    mockProductsRef.current = [listingProduct()]
    renderWatchPage()
    const price = screen.getByTestId('price-block')
    const selector = screen.getByTestId('axis-selectors')
    expect(screen.queryByTestId('axis-line')).toBeNull()
    expect(screen.queryByTestId('variant-name')).toBeNull()
    expect(screen.queryByTestId('variant-strip')).toBeNull()
    expect(screen.getByRole('group', { name: 'Cor: Azul marinho' })).toBeDefined()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Seculus')
    expect(follows(price, selector)).toBe(true)
    expect(selector.textContent).not.toContain('Azul marinho alias')
    cleanup()
    mockProductsRef.current = [makeProduct()]
    renderWatchPage()
    expect(screen.queryByTestId('axis-line')).toBeNull()
    expect(screen.queryByTestId('variant-name')).toBeNull()
    expect(screen.queryByTestId('axis-selectors')).toBeNull()
  })

  it('changes price, observation and offer with the variant and keeps description and both sheets', () => {
    mockProductsRef.current = [listingProduct()]
    width = 390
    renderWatchPage()
    expect(screen.queryByTestId('variant-strip')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Preto' }))
    expect(screen.getByTestId('price-current').textContent).toBe('R$ 20,00')
    expect(screen.queryByTestId('price-list')).toBeNull()
    expect(screen.getByText('Obs B')).toBeDefined()
    expect(screen.queryByText('Obs A')).toBeNull()
    expect(screen.getByTestId('offer-badge').textContent).toBe('oferta preto')
    expect(screen.queryByTestId('variant-name')).toBeNull()
    expect(screen.queryByTestId('axis-line')).toBeNull()
    expect(screen.getByRole('group', { name: 'Cor: Preto' })).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Descrição' }).parentElement?.querySelector('p')?.textContent).toBe('Caixa de aço.')
    const tables = screen.getAllByRole('table')
    expect(within(tables[0]!).getByText('Do produto')).toBeDefined()
    expect(within(tables[1]!).getByText('Do anúncio')).toBeDefined()
    expect(screen.getByRole('img', { name: 'Seculus' }).getAttribute('src')).toBe('/catalog/products/seculus-kit/img/b.webp')
    expect(screen.getByRole('link', { name: 'Compartilhar' }).getAttribute('href')).toBe(`https://wa.me/?text=${encodeURIComponent(`Olá, tenho interesse no Seculus Preto. Novo, Disponível. ${window.location.origin}/product/seculus-kit/listing?v=preto`)}`)
  })

  it('changes the active variant from the axis selector at 920px', () => {
    width = 920
    mockProductsRef.current = [listingProduct()]
    renderWatchPage()
    const right = screen.getByTestId('watch-right-column')
    fireEvent.click(within(right).getByRole('button', { name: 'Preto' }))
    expect(screen.getByTestId('price-current').textContent).toBe('R$ 20,00')
    expect(screen.getByText('Obs B')).toBeDefined()
    expect(within(right).getByTestId('offer-badge').textContent).toBe('oferta preto')
    expect(follows(within(right).getByTestId('price-block'), within(right).getByTestId('axis-selectors'))).toBe(true)
    expect(screen.getByRole('heading', { name: 'Descrição' }).parentElement?.querySelector('p')?.textContent).toBe('Caixa de aço.')
    expect(within(screen.getAllByRole('table')[0]!).getByText('Do produto')).toBeDefined()
    expect(within(screen.getAllByRole('table')[1]!).getByText('Do anúncio')).toBeDefined()
  })

  it('orders identity, media, price and axes and does not render the variant strip', () => {
    const product: Product = {
      ...listingProduct(),
      axes: [
        {
          id: 'color',
          label: 'Cor',
          values: [
            { id: 'azul', value: 'Azul marinho', alias: 'Azul' },
            { id: 'preto', value: 'Preto' },
          ],
        },
        {
          id: 'size',
          label: 'Tamanho',
          values: [
            { id: 'p', value: 'Pequeno', alias: 'P' },
            { id: 'm', value: 'Médio' },
          ],
        },
      ],
      listings: [
        {
          ...listingProduct().listings[0]!,
          variants: [
            {
              axes: [
                { axisId: 'color', valueId: 'azul' },
                { axisId: 'size', valueId: 'p' },
              ],
              price: 10,
              mainImage: 'a.webp',
              observations: 'Obs A',
            },
            {
              axes: [
                { axisId: 'color', valueId: 'preto' },
                { axisId: 'size', valueId: 'm' },
              ],
              price: 20,
              mainImage: 'b.webp',
              observations: 'Obs B',
            },
          ],
        },
        listingProduct().listings[1]!,
      ],
    }
    mockProductsRef.current = [product]
    width = 390
    renderWatchPage()
    const carousel = screen.getByTestId('watch-carousel')
    const price = screen.getByTestId('price-block')
    const selectors = screen.getByTestId('axis-selectors')
    expect(screen.queryByTestId('carousel-dots')).toBeNull()
    expect(screen.queryByRole('group', { name: 'Miniaturas do produto' })).toBeNull()
    expect(screen.queryByTestId('variant-strip')).toBeNull()
    expect(screen.queryByTestId('variant-name')).toBeNull()
    expect(screen.queryByTestId('axis-line')).toBeNull()
    expect(carousel.parentElement?.className).toMatch(/\bmax-md:order-1\b/)
    expect(screen.getByRole('heading', { level: 1 }).className).toMatch(/\bmax-md:order-2\b/)
    expect(screen.getByTestId('watch-commerce').parentElement?.className).toMatch(/\bmax-md:order-4\b/)
    expect(screen.getByTestId('watch-offer').contains(selectors)).toBe(true)
    expect(screen.getByTestId('watch-offer').className).toMatch(/\bgap-3\b/)
    expect(follows(selectors, screen.getByRole('link', { name: 'Compartilhar' }))).toBe(true)
    expect(follows(price, selectors)).toBe(true)
    expect(within(selectors).getAllByTestId('axis-selector-group').map((group) => group.textContent)).toEqual([
      'Cor: Azul marinhoAzul marinhoPreto',
      'Tamanho: PequenoPequenoMédio',
    ])
    cleanup()

    width = 800
    renderWatchPage()
    const media = screen.getByTestId('desktop-product-media')
    expect(screen.getByRole('group', { name: 'Miniaturas do produto' })).toBeDefined()
    expect(screen.queryByTestId('variant-strip')).toBeNull()
    expect(within(media).queryByTestId('axis-selectors')).toBeNull()
    expect(follows(media, screen.getByTestId('price-block'))).toBe(true)
    expect(follows(screen.getByTestId('price-block'), screen.getByTestId('axis-selectors'))).toBe(true)
    expect(screen.queryByTestId('carousel-dots')).toBeNull()
    expect(screen.queryByTestId('watch-carousel')).toBeNull()
    cleanup()

    width = 920
    renderWatchPage()
    expect(screen.queryByTestId('variant-strip')).toBeNull()
    expect(screen.queryByTestId('variant-name')).toBeNull()
    expect(screen.queryByTestId('axis-line')).toBeNull()
    const right = screen.getByTestId('watch-right-column')
    const ordered = [
      within(right).getByTestId('product-condition'),
      within(right).getByRole('heading', { level: 1, name: 'Seculus' }),
      within(right).getByTestId('price-block'),
      within(right).getByTestId('axis-selectors'),
      within(right).getByRole('heading', { name: 'Descrição' }),
      within(right).getByRole('link', { name: 'Compartilhar' }),
    ]
    for (let index = 1; index < ordered.length; index += 1) {
      expect(follows(ordered[index - 1]!, ordered[index]!)).toBe(true)
    }
    const groups = within(right).getAllByTestId('axis-selector-group')
    expect(groups.map((group) => group.getAttribute('data-axis-id'))).toEqual(['color', 'size'])
    expect(within(groups[0]!).getByRole('button', { name: 'Azul marinho' })).toBeDefined()
    expect(within(groups[1]!).getByRole('button', { name: 'Pequeno' })).toBeDefined()
    expect(within(right).queryByTestId('variant-strip')).toBeNull()
    expect(screen.getByRole('link', { name: 'Compartilhar' }).getAttribute('href')).toBe(`https://wa.me/?text=${encodeURIComponent(`Olá, tenho interesse no Seculus Azul P. Novo, Disponível. ${window.location.origin}/product/seculus-kit/listing?v=azul,p`)}`)
  })

  const consultOffer = { text: 'leve 2', background: '#0066cc', color: '#ffffff', icon: 'Gift' }

  function consultProduct(orderable: boolean, offers?: Variant['offers']): Product {
    return makeProduct({
      availabilityStatus: 'on_order',
      orderable,
      offers,
      color: 'Azul',
      description: 'Caixa de aço.',
      specifications: [{ label: 'Marca', value: 'Seculus' }],
    })
  }

  it.each([919, 920])('OSC-27 OSC-29 OSC-35 OSC-38 OSC-39 OSC-40: on_order order at %i px shows offers above Sob consulta and no strip', (viewport) => {
    width = viewport
    mockProductsRef.current = [consultProduct(true, [consultOffer])]
    renderWatchPage()
    const identity = screen.getByTestId('watch-identity')
    const offer = screen.getByTestId('offer-row')
    const consult = screen.getByTestId('consult-label')
    const axes = screen.getByTestId('axis-selectors')
    expect(consult.textContent).toBe(ON_ORDER_PRICE_NOTE)
    expect(offer.textContent).toBe('leve 2')
    expect(screen.queryByTestId('price-block')).toBeNull()
    expect(screen.queryByTestId('price-pix')).toBeNull()
    expect(screen.queryByTestId('price-installments')).toBeNull()
    expect(screen.queryByTestId('variant-strip')).toBeNull()
    expect(screen.queryByTestId('variant-name')).toBeNull()
    expect(screen.queryByTestId('axis-line')).toBeNull()
    expect(follows(offer, consult)).toBe(true)
    expect(follows(consult, axes)).toBe(true)
    if (viewport < 920) {
      const media = screen.getByTestId('desktop-product-media')
      expect(screen.queryByTestId('watch-left-column')).toBeNull()
      expect(follows(identity, media)).toBe(true)
      expect(follows(media, offer)).toBe(true)
      expect(follows(axes, screen.getByRole('heading', { name: 'Descrição' }))).toBe(true)
      expect(follows(axes, screen.getByRole('link', { name: 'Compartilhar' }))).toBe(true)
      expect(follows(screen.getByRole('link', { name: 'Compartilhar' }), screen.getByRole('heading', { name: 'Descrição' }))).toBe(true)
      return
    }
    const left = screen.getByTestId('watch-left-column')
    const right = screen.getByTestId('watch-right-column')
    expect(within(left).getByTestId('desktop-product-media')).toBeDefined()
    expect(within(right).queryByTestId('desktop-product-media')).toBeNull()
    const ordered = [
      within(right).getByTestId('watch-identity'),
      within(right).getByTestId('offer-row'),
      within(right).getByTestId('consult-label'),
      within(right).getByTestId('axis-selectors'),
      within(right).getByRole('heading', { name: 'Descrição' }),
      within(right).getByRole('link', { name: 'Compartilhar' }),
    ]
    for (let index = 1; index < ordered.length; index += 1) {
      expect(follows(ordered[index - 1]!, ordered[index]!)).toBe(true)
    }
    expect(within(left).getByRole('heading', { name: 'Características do produto' })).toBeDefined()
  })

  it.each([919, 920])('OSC-28: on_order with Indisponível hides the price at %i px', (viewport) => {
    width = viewport
    mockProductsRef.current = [consultProduct(false, [consultOffer])]
    renderWatchPage('seculus-kit', false, 'listing')
    expect(screen.getByTestId('availability-badge').textContent).toBe('Indisponível')
    expect(screen.getByTestId('consult-label').textContent).toBe(ON_ORDER_PRICE_NOTE)
    expect(follows(screen.getByTestId('offer-row'), screen.getByTestId('consult-label'))).toBe(true)
    expect(screen.queryByTestId('price-block')).toBeNull()
    expect(screen.queryByTestId('price-pix')).toBeNull()
    expect(screen.queryByTestId('price-installments')).toBeNull()
    expect(screen.queryByTestId('variant-strip')).toBeNull()
  })

  it('OSC-29: on_order without offers draws no offer row above Sob consulta', () => {
    mockProductsRef.current = [consultProduct(true)]
    renderWatchPage()
    expect(screen.getByTestId('consult-label').textContent).toBe(ON_ORDER_PRICE_NOTE)
    expect(screen.queryByTestId('offer-row')).toBeNull()
    expect(screen.queryByTestId('price-block')).toBeNull()
  })

  it('opens the cheaper variant from a card, that photo from a direct link, then the chosen variant photo', () => {
    const product: Product = {
      slug: 'capa',
      title: 'Capa',
      axes: [
        {
          id: 'color',
          label: 'Cor',
          values: [
            { id: 'azul', value: 'Azul' },
            { id: 'preto', value: 'Preto' },
          ],
        },
      ],
      listings: [
        {
          id: 'anuncio',
          state: 'new',
          availabilityStatus: 'available',
          images: ['cover.png', 'azul.png', 'preto.png'],
          variants: [
            {
              axes: [{ axisId: 'color', valueId: 'azul' }],
              price: 10,
              mainImage: 'azul.png',
            },
            {
              axes: [{ axisId: 'color', valueId: 'preto' }],
              price: 30,
              mainImage: 'preto.png',
            },
          ],
        },
      ],
    }
    mockProductsRef.current = [product]
    const card = homeCards([product], 'available')[0]!
    expect(card.image).toBe('azul.png')
    expect(card.path).toBe('/product/capa/anuncio?v=azul')

    function WatchListingRoute() {
      const { slug, listingId } = useParams()
      return <WatchPage slug={slug ?? ''} listingId={listingId ?? ''} />
    }

    const router = createMemoryRouter(
      [
        { path: '/', element: <WatchCard product={product} card={card} /> },
        { path: '/product/:slug/:listingId', element: <WatchListingRoute /> },
      ],
      { initialEntries: ['/?section=available'] },
    )
    render(
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>,
    )

    fireEvent.click(screen.getByTestId('watch-card-link'))
    expect(`${router.state.location.pathname}${router.state.location.search}`).toBe(card.path)
    expect(router.state.location.state).toEqual({ fromCatalog: true, section: 'available' })
    expect(screen.getByRole('button', { name: 'Abrir galeria na foto 2' })).toBeDefined()
    expect(screen.getByRole('img', { name: 'Capa' }).getAttribute('src')).toBe('/catalog/products/capa/img/azul.png')
    expect(screen.getByTestId('price-current').textContent).toBe('R$ 10,00')
    expect(screen.getByRole('link', { name: 'Voltar' }).getAttribute('href')).toBe('/?section=available')

    fireEvent.click(screen.getByRole('button', { name: 'Preto' }))
    expect(screen.getByRole('button', { name: 'Abrir galeria na foto 3' })).toBeDefined()
    expect(screen.getByRole('img', { name: 'Capa' }).getAttribute('src')).toBe('/catalog/products/capa/img/preto.png')
    expect(screen.getByTestId('price-current').textContent).toBe('R$ 30,00')
    expect(router.state.location.state).toEqual({ section: 'available' })
    expect(screen.getByRole('link', { name: 'Voltar' }).getAttribute('href')).toBe('/?section=available')

    cleanup()
    mockProductsRef.current = [product]
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={[card.path]}>
          <WatchPage slug="capa" listingId="anuncio" />
        </MemoryRouter>
      </ThemeProvider>,
    )
    expect(screen.getByRole('button', { name: 'Abrir galeria na foto 2' })).toBeDefined()
    expect(screen.getByRole('img', { name: 'Capa' }).getAttribute('src')).toBe('/catalog/products/capa/img/azul.png')
    expect(screen.getByTestId('price-current').textContent).toBe('R$ 10,00')
    expect(screen.getByRole('link', { name: 'Voltar' }).getAttribute('href')).toBe('/')
  })

  it('opens the listing cover from a card when every variant has the same price', () => {
    const product: Product = {
      slug: 'capa',
      title: 'Capa',
      axes: [
        {
          id: 'color',
          label: 'Cor',
          values: [
            { id: 'azul', value: 'Azul' },
            { id: 'preto', value: 'Preto' },
          ],
        },
      ],
      listings: [
        {
          id: 'anuncio',
          state: 'new',
          availabilityStatus: 'available',
          images: ['cover.png', 'azul.png', 'preto.png'],
          variants: [
            {
              axes: [{ axisId: 'color', valueId: 'azul' }],
              price: 10,
              mainImage: 'azul.png',
            },
            {
              axes: [{ axisId: 'color', valueId: 'preto' }],
              price: 10,
              mainImage: 'preto.png',
            },
          ],
        },
      ],
    }
    mockProductsRef.current = [product]
    const card = homeCards([product], 'available')[0]!
    expect(card.image).toBe('cover.png')
    expect(card.path).toBe('/product/capa/anuncio')

    function WatchListingRoute() {
      const { slug, listingId } = useParams()
      return <WatchPage slug={slug ?? ''} listingId={listingId ?? ''} />
    }

    const router = createMemoryRouter(
      [
        { path: '/', element: <WatchCard product={product} card={card} /> },
        { path: '/product/:slug/:listingId', element: <WatchListingRoute /> },
      ],
      { initialEntries: ['/?section=available'] },
    )
    render(
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>,
    )

    fireEvent.click(screen.getByTestId('watch-card-link'))
    expect(`${router.state.location.pathname}${router.state.location.search}`).toBe('/product/capa/anuncio')
    expect(screen.getByRole('button', { name: 'Abrir galeria na foto 1' })).toBeDefined()
    expect(screen.getByRole('img', { name: 'Capa' }).getAttribute('src')).toBe('/catalog/products/capa/img/cover.png')
    expect(screen.getByTestId('price-current').textContent).toBe('R$ 10,00')
  })

  it.each([919, 920])('OSC-46: choosing another enabled option selects that variant at %i px', (viewport) => {
    width = viewport
    mockProductsRef.current = [listingProduct()]
    renderWatchPage()
    fireEvent.click(screen.getByRole('button', { name: 'Preto' }))
    expect(screen.getByTestId('price-current').textContent).toBe('R$ 20,00')
    expect(screen.getByRole('group', { name: 'Cor: Preto' })).toBeDefined()
    expect(screen.getByTestId('offer-badge').textContent).toBe('oferta preto')
    expect(screen.queryByTestId('variant-strip')).toBeNull()
  })

})
