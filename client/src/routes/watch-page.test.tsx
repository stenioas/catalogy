import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Product } from '@catalogo/shared'
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

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    slug: 'seculus-kit',
    title: 'Seculus',
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
    mockProductsRef.current = [makeProduct()]
    // Ratio 1: in-page Eu quero! fully visible, so the sticky bar is absent.
    installObserver(1)
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

  it('shows carousel, title, price, Eu quero!, then the sections that apply (SV-10, CAT-62)', () => {
    renderWatchPage()
    const carousel = screen.getByTestId('watch-carousel')
    expect(screen.getByRole('img', { name: 'Seculus' }).getAttribute('src')).toBe(
      '/catalog/products/seculus-kit/img/foto.webp',
    )
    const title = screen.getByRole('heading', { name: 'Seculus' })
    const price = screen.getByTestId('price-block')
    const want = screen.getByRole('link', { name: 'Enviar no WhatsApp' })
    const description = screen.getByRole('heading', { name: 'Descrição' })
    const specs = screen.getByRole('heading', { name: 'Especificações' })
    const notes = screen.getByRole('heading', { name: 'Observações' })
    expect(follows(carousel, title)).toBe(true)
    expect(follows(title, price)).toBe(true)
    expect(follows(price, want)).toBe(true)
    const offer = screen.getByTestId('watch-offer')
    expect(offer.className).toMatch(/\bflex-col\b/)
    expect(offer.className).toMatch(/\bmd:flex-row\b/)
    expect(price.parentElement?.className).toMatch(/\bmd:flex-1\b/)
    expect(want.parentElement?.className).toMatch(/\bmd:flex-1\b/)
    expect(follows(want, description)).toBe(true)
    expect(follows(description, specs)).toBe(true)
    expect(follows(specs, notes)).toBe(true)
    expect(screen.getByTestId('price-current').textContent).toBe('R$ 369,90')
    const column = screen.getByTestId('watch-page-column')
    expect(column.classList.contains('catalog-column')).toBe(true)
    expect(column.className.split(/\s+/)).toContain('gap-8')
    expect(within(column).getByTestId('watch-carousel')).toBeDefined()
  })

  it('shows Descrição when description is a non-empty string, including whitespace (CAT-63)', () => {
    mockProductsRef.current = [makeProduct({ description: '   ' })]
    renderWatchPage()
    const heading = screen.getByRole('heading', { name: 'Descrição' })
    expect(heading.parentElement?.querySelector('p')?.textContent).toBe('   ')
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

  it('shows Especificações as a two-column table with no header row (CAT-67)', () => {
    renderWatchPage()
    expect(screen.getByRole('heading', { name: 'Especificações' })).toBeDefined()
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

  it('hides Especificações when specifications is missing or an empty list (CAT-68)', () => {
    mockProductsRef.current = [makeProduct({ specifications: undefined })]
    renderWatchPage()
    expect(screen.queryByRole('heading', { name: 'Especificações' })).toBeNull()
    expect(screen.queryByRole('table')).toBeNull()
    cleanup()
    mockProductsRef.current = [makeProduct({ specifications: [] })]
    renderWatchPage()
    expect(screen.queryByRole('heading', { name: 'Especificações' })).toBeNull()
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
    expect(screen.queryByRole('link', { name: 'Enviar no WhatsApp' })).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Seculus' })).toBeNull()
  })

  it('shows the sticky bar with the same Eu quero! href as the in-page link at ratio 0.4 (CAT-89, CAT-90, CAT-151)', () => {
    installObserver(0.4)
    renderWatchPage()
    const bar = screen.getByTestId('sticky-bar')
    const barLink = within(bar).getByRole('link', { name: 'Enviar no WhatsApp' })
    const links = screen.getAllByRole('link', { name: 'Enviar no WhatsApp' })
    expect(links).toHaveLength(2)
    const pageLink = links.find((link) => !bar.contains(link))
    if (!pageLink) throw new Error('in-page WhatsApp link not found')
    expect(barLink.getAttribute('href')).toBe(pageLink.getAttribute('href'))
    expect(pageLink.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/\?text=/)
    expect(within(bar).getByTestId('price-current').textContent).toBe('R$ 369,90')
  })

  it('hides the sticky bar at ratio 1 (CAT-89)', () => {
    installObserver(1)
    renderWatchPage()
    expect(screen.queryByTestId('sticky-bar')).toBeNull()
    expect(screen.getAllByRole('link', { name: 'Enviar no WhatsApp' })).toHaveLength(1)
  })

  it('shows specifications in the shadcn Table under Especificações (SV-45)', () => {
    renderWatchPage()
    const heading = screen.getByRole('heading', { name: 'Especificações' })
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
    for (const name of ['Seculus', 'Descrição', 'Especificações', 'Observações']) {
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
})
