import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Listing, Product, Variant } from '@catalogo/shared'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router-dom'

import { writeProductsModule } from '../../scripts/catalog'
import { ThemeProvider } from '../components/theme-provider'
import { CatalogPage } from './catalog-page'

const clientRoot = join(dirname(fileURLToPath(import.meta.url)), '../..')

function makeProduct(
  slug: string,
  title: string,
  listingOverrides: Partial<Listing> = {},
): Product {
  return {
    slug,
    title,
    axes: [],
    listings: [
      {
        id: slug,
        state: 'new',
        availabilityStatus: 'available',
        images: ['foto.webp'],
        variants: [
          {
            axes: [],
            price: 100,
            mainImage: 'foto.webp',
          },
        ],
        ...listingOverrides,
      },
    ],
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

function lengthToPx(token: string): number {
  const value = token.trim()
  if (value.endsWith('px')) return Number.parseFloat(value)
  if (value.endsWith('rem')) return Number.parseFloat(value) * 16
  throw new Error(`unsupported length ${value}`)
}

function breakpointToken(name: 'md' | 'lg'): string {
  const appCss = readFileSync(join(clientRoot, 'src/index.css'), 'utf8')
  const override = appCss.match(
    new RegExp(`--breakpoint-${name}:\\s*([^;]+)`),
  )
  if (override?.[1]) return override[1]
  const theme = readFileSync(
    join(clientRoot, 'node_modules/tailwindcss/theme.css'),
    'utf8',
  )
  const fallback = theme.match(new RegExp(`--breakpoint-${name}:\\s*([^;]+)`))
  if (!fallback?.[1]) throw new Error(`missing breakpoint ${name}`)
  return fallback[1]
}

function columnCount(className: string, width: number): number {
  const md = lengthToPx(breakpointToken('md'))
  const lg = lengthToPx(breakpointToken('lg'))
  const base = className.match(/(?:^|\s)grid-cols-(\d+)\b/)
  let cols = base?.[1] ? Number(base[1]) : 0
  const rules = [...className.matchAll(/\b(md|lg):grid-cols-(\d+)\b/g)]
    .map((match) => ({
      min: match[1] === 'md' ? md : lg,
      cols: Number(match[2]),
    }))
    .sort((a, b) => a.min - b.min)
  for (const rule of rules) {
    if (width >= rule.min) cols = rule.cols
  }
  return cols
}

function productsFromModule(source: string): Product[] {
  const prefix = 'export const products: Product[] = '
  return JSON.parse(source.split(prefix)[1]) as Product[]
}

function renderCatalogPage() {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={['/']}>
        <CatalogPage />
      </MemoryRouter>
    </ThemeProvider>,
  )
}

describe('CatalogPage (CAT-43, CAT-48, CAT-49–CAT-51, CAT-121, CAT-122)', () => {
  afterEach(() => {
    cleanup()
    mockProductsRef.current = []
  })

  beforeEach(() => {
    mockProductsRef.current = []
  })

  it('lists Addiesdive, then CURREN, then Seculus by Portuguese title order (CAT-48, AC19)', () => {
    mockProductsRef.current = [
      makeProduct('seculus-watch', 'Seculus'),
      makeProduct('addiesdive-watch', 'Addiesdive'),
      makeProduct('curren-watch', 'CURREN'),
    ]
    renderCatalogPage()
    const headings = screen.getAllByRole('heading', { level: 2 })
    expect(headings.map((node) => node.textContent)).toEqual([
      'Addiesdive',
      'CURREN',
      'Seculus',
    ])
  })

  it('hides a product with enabled false and keeps omitted or true', () => {
    mockProductsRef.current = [
      makeProduct('addiesdive-watch', 'Addiesdive'),
      makeProduct('curren-watch', 'CURREN', { enabled: false }),
      makeProduct('seculus-watch', 'Seculus', { enabled: true }),
    ]
    renderCatalogPage()
    expect(screen.queryByRole('heading', { name: 'CURREN' })).toBeNull()
    expect(screen.getByRole('heading', { name: 'Addiesdive' })).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Seculus' })).toBeDefined()
  })

  it('lists addiesdive, then Épico, then Zeta by Portuguese title order (CAT-46)', () => {
    mockProductsRef.current = [
      makeProduct('zeta-watch', 'Zeta'),
      makeProduct('addiesdive-watch', 'addiesdive'),
      makeProduct('epico-watch', 'Épico'),
    ]
    renderCatalogPage()
    const headings = screen.getAllByRole('heading', { level: 2 })
    expect(headings.map((node) => node.textContent)).toEqual([
      'addiesdive',
      'Épico',
      'Zeta',
    ])
  })

  it('uses one, two, and three grid columns at the md and lg breakpoints (CAT-49–CAT-51, AC20–22)', () => {
    mockProductsRef.current = [makeProduct('only-one', 'Only')]
    renderCatalogPage()
    const grid = screen.getByTestId('catalog-grid')
    expect(grid.className).toMatch(/\bgrid-cols-1\b/)
    expect(grid.className).toMatch(/\bmd:grid-cols-2\b/)
    expect(grid.className).toMatch(/\blg:grid-cols-3\b/)
    expect(grid.className).toMatch(/\bgap-4\b/)
    expect(grid.className).toMatch(/\bmd:gap-6\b/)
    expect(grid.classList.contains('catalog-grid')).toBe(true)
    const css = readFileSync(join(clientRoot, 'src/index.css'), 'utf8')
    expect(css).not.toMatch(/html\s*\{[^}]*font-size/)
    expect(lengthToPx(breakpointToken('md'))).toBe(768)
    expect(lengthToPx(breakpointToken('lg'))).toBe(1024)
    expect(columnCount(grid.className, 767)).toBe(1)
    expect(columnCount(grid.className, 768)).toBe(2)
    expect(columnCount(grid.className, 1023)).toBe(2)
    expect(columnCount(grid.className, 1024)).toBe(3)
    expect(grid.className).toMatch(/\bitems-stretch\b/)
    const item = grid.querySelector('li')
    const card = item?.querySelector('[data-slot="card"]')
    expect(item?.className).toMatch(/\bflex\b/)
    expect(item?.className).toMatch(/\bh-full\b/)
    expect(card?.className).toMatch(/\bh-full\b/)
  })

  it('paints the page background across the full viewport width (CAT-39)', () => {
    const css = readFileSync(join(clientRoot, 'src/index.css'), 'utf8')
    const body = css.match(/(?:^|\n)body\s*\{([^}]*)\}/)?.[1]
    expect(body).toBeDefined()
    const widths = [...body!.matchAll(/width:\s*([^;]+)/g)].map((match) => match[1].trim())
    expect(widths.at(-1)).toBe('100%')
    expect(body).not.toMatch(/100vw/)
    expect(body).not.toMatch(/max-width/)
    expect(body).toMatch(/background-color:\s*var\(--background\)/)
  })

  it('centers a column at most 1120px wide with 24px of horizontal padding (CAT-40, CAT-41, CAT-42)', () => {
    const css = readFileSync(join(clientRoot, 'src/index.css'), 'utf8')
    const block = css.match(/\.catalog-column\s*\{([^}]*)\}/)?.[1]
    expect(block).toBeDefined()
    expect(block).toMatch(/max-width:\s*1120px/)
    expect(block).toMatch(/margin-inline:\s*auto/)
    expect(block).toMatch(/padding-inline:\s*24px/)
  })

  it('centers a hairline in the mobile row gap and omits it after the last product', () => {
    const css = readFileSync(join(clientRoot, 'src/index.css'), 'utf8')
    const mobile = css.match(
      /@media\s*\(max-width:\s*767px\)\s*\{([\s\S]*?)\n\}/,
    )?.[1]
    expect(mobile).toBeDefined()
    expect(mobile).toMatch(/\.catalog-grid > li:not\(:last-child\)::after/)
    expect(mobile).toMatch(/top:\s*calc\(100% \+ 8px\)/)
    expect(mobile).toMatch(/transform:\s*translateY\(-50%\)/)
    expect(mobile).toMatch(/height:\s*1px/)
    expect(mobile).not.toMatch(/border-bottom/)
  })

  it('removes horizontal padding from the vitrine below md and restores 24px from 768px', () => {
    mockProductsRef.current = [makeProduct('one', 'One')]
    renderCatalogPage()
    const column = screen.getByTestId('catalog-page-column')
    expect(column.classList.contains('catalog-vitrine')).toBe(true)

    const css = readFileSync(join(clientRoot, 'src/index.css'), 'utf8')
    const block = css.match(/\.catalog-vitrine\s*\{([^}]*)\}/)?.[1]
    expect(block).toMatch(/padding-inline:\s*0/)
    const desktop = css.match(
      /@media\s*\(min-width:\s*768px\)\s*\{[\s\S]*?\.catalog-vitrine\s*\{([^}]*)\}/,
    )?.[1]
    expect(desktop).toMatch(/padding-inline:\s*24px/)
  })

  it('lists each watch in the product grid (SV-01, AC1)', () => {
    mockProductsRef.current = [
      makeProduct('alpha', 'Alpha'),
      makeProduct('beta', 'Beta'),
    ]
    renderCatalogPage()
    const grid = screen.getByTestId('catalog-grid')
    expect(within(grid).getAllByRole('heading', { level: 2 })).toHaveLength(2)
    expect(screen.getByText('Catálogo de Produtos')).toBeDefined()
  })

  it('shows the empty vitrine copy and keeps Catálogo in the top bar (SV-06, CAT-121, CAT-122, AC6–7)', () => {
    mockProductsRef.current = []
    renderCatalogPage()
    expect(screen.getByText('Catálogo de Produtos')).toBeDefined()
    expect(screen.getByText('Não temos nenhum anúncio ativo.')).toBeDefined()
    expect(screen.queryByTestId('catalog-grid')).toBeNull()
  })

  it('places the empty state inside the shared catalog column (CAT-43, AC14)', () => {
    mockProductsRef.current = []
    renderCatalogPage()
    const column = screen.getByTestId('catalog-page-column')
    expect(column.classList.contains('catalog-column')).toBe(true)
    expect(within(column).getByText('Não temos nenhum anúncio ativo.')).toBeDefined()
  })

  it('places the product grid inside the shared catalog column (CAT-43, AC14)', () => {
    mockProductsRef.current = [makeProduct('one', 'One')]
    renderCatalogPage()
    const column = screen.getByTestId('catalog-page-column')
    expect(column.classList.contains('catalog-column')).toBe(true)
    expect(within(column).getByTestId('catalog-grid')).toBeDefined()
  })

  it('gives the catalog main max-width 100%, min-width 0 and overflow-x clip (SV-51)', () => {
    mockProductsRef.current = [makeProduct('one', 'One')]
    renderCatalogPage()
    const main = screen.getByRole('main')
    const tokens = main.className.split(/\s+/)
    expect(tokens).toContain('max-w-full')
    expect(tokens).toContain('min-w-0')
    expect(tokens).toContain('overflow-x-clip')
    expect(main.contains(screen.getByTestId('catalog-page-column'))).toBe(true)
  })

  it('preserves stable title order when the source list is already sorted (CAT-47, AC18)', () => {
    mockProductsRef.current = [
      makeProduct('a', 'Addiesdive'),
      makeProduct('b', 'CURREN'),
      makeProduct('c', 'Seculus'),
    ]
    renderCatalogPage()
    const firstPass = screen.getAllByRole('heading', { level: 2 }).map((n) => n.textContent)
    cleanup()
    mockProductsRef.current = [
      makeProduct('a', 'Addiesdive'),
      makeProduct('b', 'CURREN'),
      makeProduct('c', 'Seculus'),
    ]
    renderCatalogPage()
    const secondPass = screen.getAllByRole('heading', { level: 2 }).map((n) => n.textContent)
    expect(secondPass).toEqual(firstPass)
    expect(secondPass).toEqual(['Addiesdive', 'CURREN', 'Seculus'])
  })

  it('keeps the same title order across two generated product modules (CAT-47, AC18)', () => {
    const shuffled = [
      makeProduct('seculus-watch', 'Seculus'),
      makeProduct('addiesdive-watch', 'Addiesdive'),
      makeProduct('curren-watch', 'CURREN'),
    ]
    const dir = mkdtempSync(join(tmpdir(), 'catalog-order-'))
    try {
      const firstFile = join(dir, 'first.ts')
      const secondFile = join(dir, 'second.ts')
      writeProductsModule(shuffled, firstFile)
      writeProductsModule([...shuffled].reverse(), secondFile)

      mockProductsRef.current = productsFromModule(readFileSync(firstFile, 'utf8'))
      renderCatalogPage()
      const firstBuild = screen
        .getAllByRole('heading', { level: 2 })
        .map((node) => node.textContent)
      cleanup()

      mockProductsRef.current = productsFromModule(readFileSync(secondFile, 'utf8'))
      renderCatalogPage()
      const secondBuild = screen
        .getAllByRole('heading', { level: 2 })
        .map((node) => node.textContent)

      expect(firstBuild).toEqual(['Addiesdive', 'CURREN', 'Seculus'])
      expect(secondBuild).toEqual(firstBuild)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

const NO_ACTIVE_LISTING_TEXT = 'Não temos nenhum anúncio ativo.'

function variant(overrides: Partial<Variant> = {}): Variant {
  return {
    axes: [],
    price: 100,
    mainImage: 'foto.webp',
    ...overrides,
  }
}

function listing(id: string, overrides: Partial<Listing> = {}): Listing {
  return {
    id,
    state: 'new',
    availabilityStatus: 'available',
    images: ['foto.webp'],
    variants: [variant()],
    ...overrides,
  }
}

function catalogProduct(fields: {
  slug: string
  title: string
  audience?: Product['audience']
  axes?: Product['axes']
  listings: Listing[]
}): Product {
  return {
    slug: fields.slug,
    title: fields.title,
    axes: fields.axes ?? [],
    listings: fields.listings,
    ...(fields.audience === undefined ? {} : { audience: fields.audience }),
  }
}

function searchParamsOf(search: string): URLSearchParams {
  return new URLSearchParams(search)
}

function renderHome(entry: string) {
  const router = createMemoryRouter(
    [
      { path: '/', element: <CatalogPage /> },
      { path: '/product/:slug/:listingId', element: <p>anúncio</p> },
    ],
    { initialEntries: [entry] },
  )
  render(
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>,
  )
  return router
}

const RESULTS_ENTER_CLASSES = [
  'motion-safe:animate-in',
  'motion-safe:fade-in',
  'motion-safe:slide-in-from-bottom-2',
  'motion-safe:duration-200',
]

function expectResultsEnter() {
  const results = screen.getByTestId('catalog-results')
  for (const className of RESULTS_ENTER_CLASSES) {
    expect(results.classList.contains(className)).toBe(true)
  }
  expect(screen.queryByRole('status', { name: 'Carregando' })).toBeNull()
}

describe('CatalogPage sections', () => {
  afterEach(() => {
    cleanup()
    mockProductsRef.current = []
  })

  beforeEach(() => {
    mockProductsRef.current = []
  })

  it('opens Todos with priced-section cards only and does not write section', () => {
    mockProductsRef.current = [
      catalogProduct({
        slug: 'encomenda',
        title: 'Encomenda',
        listings: [listing('encomenda', { availabilityStatus: 'on_order' })],
      }),
      catalogProduct({
        slug: 'breve',
        title: 'Breve',
        listings: [listing('breve', { availabilityStatus: 'coming_soon' })],
      }),
    ]
    const router = renderHome('/')
    expect(screen.getByRole('tab', { name: 'Todos', selected: true })).toBeDefined()
    expect(screen.getByRole('tab', { name: 'Pronta entrega', selected: false })).toHaveProperty('disabled', true)
    expect(screen.getByRole('tab', { name: 'Encomendar' })).toHaveProperty('disabled', false)
    expect(screen.getByRole('heading', { name: 'Breve' })).toBeDefined()
    expect(screen.queryByRole('heading', { name: 'Encomenda' })).toBeNull()
    expect(router.state.location.search).toBe('')
    expect(searchParamsOf(router.state.location.search).has('section')).toBe(false)
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Encomendar' }))
    expect(screen.getByRole('heading', { name: 'Encomenda' })).toBeDefined()
    expect(screen.getByTestId('consult-label').textContent).toBe('Sob consulta')
    expect(screen.queryByTestId('price-block')).toBeNull()
  })

  it('disables an empty section and opens Todos as the first section that has a card', () => {
    mockProductsRef.current = [
      catalogProduct({
        slug: 'agora',
        title: 'Agora',
        listings: [listing('agora')],
      }),
    ]
    const router = renderHome('/?section=on-order')
    expect(screen.getByRole('tab', { name: 'Todos', selected: true })).toHaveProperty('disabled', false)
    expect(screen.getByRole('tab', { name: 'Encomendar' })).toHaveProperty('disabled', true)
    expect(screen.getByRole('tab', { name: 'A caminho' })).toHaveProperty('disabled', true)
    expect(screen.getByRole('tab', { name: 'Pronta entrega', selected: false })).toHaveProperty('disabled', false)
    expect(screen.getByRole('heading', { name: 'Agora' })).toBeDefined()
    expect(screen.queryByText(NO_ACTIVE_LISTING_TEXT)).toBeNull()
    expect(searchParamsOf(router.state.location.search).get('section')).toBe('on-order')
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Encomendar' }))
    expect(searchParamsOf(router.state.location.search).get('section')).toBe('on-order')
  })

  it('recalculates an invalid section and leaves that key unchanged', () => {
    mockProductsRef.current = [
      catalogProduct({
        slug: 'breve',
        title: 'Breve',
        listings: [listing('breve', { availabilityStatus: 'coming_soon', state: 'used' })],
      }),
    ]
    const router = renderHome('/?section=foo&state=used')
    expect(screen.getByRole('tab', { name: 'Todos', selected: true })).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Breve' })).toBeDefined()
    const params = searchParamsOf(router.state.location.search)
    expect(params.get('section')).toBe('foo')
    expect(params.get('state')).toBe('used')
  })

  it('shows the empty text when the catalog has no active listing', () => {
    mockProductsRef.current = []
    const empty = renderHome('/')
    expect(screen.getByRole('tab', { name: 'Todos', selected: true })).toHaveProperty('disabled', true)
    expect(screen.getByRole('tab', { name: 'Pronta entrega' })).toHaveProperty('disabled', true)
    expect(screen.getByRole('tab', { name: 'A caminho' })).toHaveProperty('disabled', true)
    expect(screen.getByRole('tab', { name: 'Encomendar' })).toHaveProperty('disabled', true)
    expect(screen.getByText(NO_ACTIVE_LISTING_TEXT)).toBeDefined()
    expect(screen.queryByTestId('catalog-grid')).toBeNull()
    expect(empty.state.location.search).toBe('')
  })

  it('writes the section token for the chosen label and keeps the card status text', () => {
    mockProductsRef.current = [
      catalogProduct({
        slug: 'agora',
        title: 'Agora',
        listings: [listing('agora')],
      }),
      catalogProduct({
        slug: 'breve',
        title: 'Breve',
        listings: [listing('breve', { availabilityStatus: 'coming_soon' })],
      }),
      catalogProduct({
        slug: 'encomenda',
        title: 'Encomenda',
        listings: [listing('encomenda', { availabilityStatus: 'on_order' })],
      }),
    ]
    const router = renderHome('/')
    expect(screen.getByRole('tab', { name: 'Todos', selected: true })).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Agora' })).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Breve' })).toBeDefined()
    expect(screen.queryByRole('heading', { name: 'Encomenda' })).toBeNull()
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'A caminho' }))
    expect(searchParamsOf(router.state.location.search).get('section')).toBe('coming-soon')
    expect(within(screen.getByRole('heading', { name: 'Breve' }).closest('li')!).getByText('Chega em breve')).toBeDefined()
    expect(screen.queryByRole('heading', { name: 'Agora' })).toBeNull()
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Encomendar' }))
    expect(searchParamsOf(router.state.location.search).get('section')).toBe('on-order')
    const encomendaCard = screen.getByRole('heading', { name: 'Encomenda' }).closest('li')!
    expect(within(encomendaCard).getByText('Sob encomenda')).toBeDefined()
    expect(within(encomendaCard).getByTestId('consult-label').textContent).toBe('Sob consulta')
    expect(within(encomendaCard).queryByTestId('price-block')).toBeNull()
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Pronta entrega' }))
    expect(searchParamsOf(router.state.location.search).get('section')).toBe('available')
    expect(within(screen.getByRole('heading', { name: 'Agora' }).closest('li')!).getByText('Disponível')).toBeDefined()
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Todos' }))
    expect(searchParamsOf(router.state.location.search).get('section')).toBe('all')
    expect(screen.getByRole('heading', { name: 'Agora' })).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Breve' })).toBeDefined()
    expect(screen.queryByRole('heading', { name: 'Encomenda' })).toBeNull()
  })

})
