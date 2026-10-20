import { act } from 'react'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { creditInstallmentLabel, type Product } from '@catalogo/shared'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

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

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    slug: 'seculus-kit',
    title: 'Seculus',
    state: 'Novo',
    availabilityStatus: 'available',
    price: 369.9,
    images: ['foto.webp'],
    description: 'Caixa de aço.',
    observations: 'Entrega em mãos.',
    specifications: [
      { label: 'Marca', value: 'Seculus' },
      { label: 'Pulseira', value: 'Aço' },
    ],
    ...overrides,
  }
}

const { mockProductsRef } = vi.hoisted(() => ({
  mockProductsRef: { current: [] as Product[] },
}))

vi.mock('../catalog/products.generated', () => ({
  get products() {
    return mockProductsRef.current
  },
}))

function renderWatchPage(slug = 'seculus-kit', withSellerQuery = false) {
  const path = withSellerQuery ? `/product/${slug}?seller=alexandre` : `/product/${slug}`
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <WatchPage slug={slug} />
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

  it.each(['Novo', 'Openbox', 'Usado'] as const)('shows state %s as plain text before the title', (state) => {
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
    expect(heading.className).toMatch(/\btext-base\b/)
    expect(heading.className).not.toMatch(/\btext-lg\b/)
    expect(heading.className).not.toMatch(/\btext-xl\b/)
    expect(follows(stateLabel, heading)).toBe(true)
  })

  it.each([
    ['available', 'Em estoque'],
    ['on_order', 'Sob encomenda'],
    ['unavailable', 'Indisponível'],
    ['sold_out', 'Esgotado'],
  ] as const)('shows availability %s below installments', (availabilityStatus, label) => {
    mockProductsRef.current = [makeProduct({ availabilityStatus })]
    renderWatchPage()
    const heading = screen.getByRole('heading', { level: 1, name: 'Seculus' })
    const installments = screen.getByTestId('price-installments')
    const badge = screen.getByTestId('availability-badge')
    expect(badge.textContent).toBe(label)
    expect(within(screen.getByTestId('watch-offer')).queryByTestId('availability-badge')).toBeNull()
    expect(screen.getByTestId('watch-metadata').contains(badge)).toBe(true)
    expect(follows(badge, heading)).toBe(true)
    expect(follows(badge, installments)).toBe(true)
    expect(badge.closest('[data-testid="watch-metadata"]')).toBe(screen.getByTestId('watch-metadata'))
    expect(badge.className.split(/\s+/)).toContain('text-xs')
  })

  it('places Oferta imperdível above the price only when unmissableOffer is true', () => {
    renderWatchPage()
    expect(screen.queryByTestId('unmissable-offer')).toBeNull()
    cleanup()
    mockProductsRef.current = [makeProduct({ unmissableOffer: true })]
    renderWatchPage()
    const badge = screen.getByTestId('unmissable-offer')
    const price = screen.getByTestId('price-block')
    expect(badge.textContent).toContain('OFERTA IMPERDÍVEL')
    expect(screen.getByTestId('watch-commerce').contains(badge)).toBe(true)
    expect(follows(badge, price)).toBe(true)
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
    const catalog = within(bar).getByRole('link', { name: 'Catálogo de Produtos' })
    expect(back.getAttribute('href')).toBe(catalogHref)
    expect(back.querySelector('svg')).not.toBeNull()
    expect(follows(back, catalog)).toBe(true)
  })

  it('links Catálogo to the same / href as Voltar (SV-12, CAT-60)', () => {
    renderWatchPage()
    const catalog = screen.getByRole('link', { name: 'Catálogo de Produtos' })
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
    const catalog = screen.getByRole('link', { name: 'Catálogo de Produtos' })
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
    const ordered = [screen.getByTestId('watch-metadata'), screen.getByRole('heading', { name: 'Seculus' }), screen.getByTestId('watch-carousel'), screen.getByTestId('price-block'), screen.getByRole('link', { name: 'Compartilhar' }), screen.getByRole('heading', { name: 'Descrição' }), screen.getByRole('heading', { name: 'Observações' }), screen.getByRole('heading', { name: 'Características do produto' })]
    for (let index = 1; index < ordered.length; index++) expect(follows(ordered[index - 1], ordered[index])).toBe(true)
    expect(screen.getByRole('img', { name: 'Seculus' }).getAttribute('src')).toBe('/catalog/products/seculus-kit/img/foto.webp')
    expect(screen.getByTestId('price-current').textContent).toBe('R$ 369,90')
    expect(screen.getByTestId('watch-page-column').classList.contains('catalog-column')).toBe(true)
    expect(screen.getByTestId('watch-page-column').classList.contains('watch-page-column')).toBe(true)
    expect(screen.getByTestId('watch-page-column').className).toMatch(/\bpt-2\b/)
    expect(screen.getByTestId('watch-page-column').className).toMatch(/\bmd:py-8\b/)
    expect(screen.getByTestId('top-bar-inner').classList.contains('watch-page-column')).toBe(true)
    const intro = screen.getByTestId('watch-intro')
    expect(intro.className).toMatch(/\bgap-2\b/)
    expect(intro.className).toMatch(/\bmd:contents\b/)
    expect(intro.contains(screen.getByTestId('watch-identity'))).toBe(true)
    expect(intro.contains(screen.getByTestId('watch-carousel'))).toBe(true)
    expect(intro.contains(screen.getByTestId('watch-commerce'))).toBe(true)
    expect(screen.getByTestId('watch-identity').className).toMatch(/\bgap-0\.5\b/)
    const share = screen.getByRole('link', { name: 'Compartilhar' })
    expect(share.querySelector('svg')?.classList.contains('lucide-share-2')).toBe(true)
    expect(share.className).toMatch(/\bh-11\b/)
    expect(share.className).toMatch(/\bw-full\b/)
    expect(share.className).not.toMatch(/\bsize-10\b/)
    expect(share.className).toMatch(/color-mix\(in_srgb,var\(--primary\)_16%,white\)/)
    expect(screen.getByTestId('watch-offer').className).toMatch(/\bflex-col\b/)
    expect(screen.getByTestId('watch-offer').className).toMatch(/\bmd:max-\[919px\]:grid-cols-2\b/)
    expect(screen.getByTestId('watch-offer').contains(share)).toBe(true)
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
    ).toEqual(['Pulseira', 'Aço'])
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

  it('repeats Oferta imperdível in the footer and paints the current price red', () => {
    installObserver(0)
    mockProductsRef.current = [makeProduct({ unmissableOffer: true })]
    renderWatchPage()
    const bar = screen.getByTestId('sticky-bar')
    const footerBadge = within(bar).getByTestId('unmissable-offer')
    const footerPrice = within(bar).getByTestId('price-current')
    const pagePrice = within(screen.getByTestId('watch-commerce')).getByTestId('price-current')
    expect(footerBadge.textContent).toContain('OFERTA IMPERDÍVEL')
    expect(follows(footerBadge, footerPrice)).toBe(true)
    expect(footerPrice.className).toMatch(/\btext-destructive\b/)
    expect(pagePrice.className).toMatch(/\btext-destructive\b/)
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
      'Pulseira',
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
    const table = screen.getByRole('table')
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
    mockProductsRef.current = [makeProduct({ title: 'Título completo '.repeat(20), color: '  Azul  ', listPrice: 449.9, unmissableOffer: true })]
    renderWatchPage()
    const heading = screen.getByRole('heading', { level: 1 })
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(heading.textContent).toBe('Título completo '.repeat(20))
    expect(heading.className).not.toMatch(/line-clamp|truncate/)
    expect(screen.getAllByRole('link', { name: 'Compartilhar' })).toHaveLength(1)
    expect(screen.getByTestId('watch-color').textContent).toBe('Cor:   Azul  ')
    expect(screen.getByTestId('price-list').textContent).toBe('De R$ 449,90')
    expect(follows(heading, screen.getByTestId('unmissable-offer'))).toBe(true)
    expect(follows(screen.getByTestId('unmissable-offer'), screen.getByTestId('price-current'))).toBe(true)
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
      expect(follows(screen.getByTestId('watch-metadata'), heading)).toBe(true)
      expect(follows(screen.getByTestId('watch-metadata'), screen.getByTestId('watch-offer'))).toBe(true)
      const share = screen.getByRole('link', { name: 'Compartilhar' })
      expect(screen.getByTestId('watch-offer').contains(share)).toBe(true)
      expect(screen.getByTestId('watch-offer').className).toMatch(/\bflex-col\b/)
      expect(screen.getByTestId('watch-offer').className).toMatch(/\bmd:max-\[919px\]:grid-cols-2\b/)
      if (viewport >= 768) {
        expect(screen.getByRole('group', { name: 'Miniaturas do produto' })).toBeDefined()
        expect(screen.queryByTestId('watch-carousel')).toBeNull()
        expect(screen.queryByRole('button', { name: 'Anterior' })).toBeNull()
        expect(screen.queryByTestId('carousel-dots')).toBeNull()
      } else {
        expect(screen.getByTestId('watch-carousel')).toBeDefined()
      }
    }
  })

  it.each([undefined, '', '   '])('omits absent or empty color %s without inferring Cor from specifications (CATREF-55/56)', (color) => {
    mockProductsRef.current = [makeProduct({ color, description: 'Relógio dourado', specifications: [{ label: 'Cor', value: 'Prata' }] })]
    renderWatchPage()
    expect(screen.queryByTestId('watch-color')).toBeNull()
    expect(within(screen.getByRole('table')).getByText('Prata')).toBeDefined()
  })

  it.each([390, 920])('preserves color and independent repeated specifications at %i px (CATREF-54/57/58)', (viewport) => {
    width = viewport
    mockProductsRef.current = [makeProduct({ color: '  Azul  ', specifications: [{ label: 'Cor', value: 'Prata' }, { label: 'Cor do mostrador', value: 'Preto' }, { label: 'Cor da pulseira', value: 'Aço' }, { label: 'Cor', value: 'Prata' }, { label: 'Vazio', value: '' }, { label: 'Espaços', value: '   ' }] })]
    renderWatchPage()
    expect(screen.getByTestId('watch-color').textContent).toBe('Cor:   Azul  ')
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
    for (const link of screen.getAllByRole('link', { name: 'Compartilhar' })) expect(link.getAttribute('href')).toBe(`https://wa.me/?text=${encodeURIComponent(`Olá, tenho interesse no Seculus. ${window.location.origin}/product/seculus-kit`)}`)
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

})
