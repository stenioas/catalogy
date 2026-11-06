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
const NO_FILTER_MATCH_TEXT = 'Nenhum anúncio corresponde aos filtros.'

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

function groupNames(): string[] {
  return screen.getAllByRole('group').map((node) => {
    const legend = node.querySelector('legend')
    return legend?.textContent ?? node.getAttribute('aria-label') ?? ''
  })
}

describe('CatalogPage section and filter', () => {
  afterEach(() => {
    cleanup()
    mockProductsRef.current = []
  })

  beforeEach(() => {
    mockProductsRef.current = []
  })

  it('opens the first section that has a card and does not write section', () => {
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
    expect(screen.getByRole('button', { name: 'Chega em breve', pressed: true })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Disponível', pressed: false })).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Breve' })).toBeDefined()
    expect(screen.queryByRole('heading', { name: 'Encomenda' })).toBeNull()
    expect(router.state.location.search).toBe('')
    expect(searchParamsOf(router.state.location.search).has('section')).toBe(false)
  })

  it('stays on an empty section named in the URL', () => {
    mockProductsRef.current = [
      catalogProduct({
        slug: 'agora',
        title: 'Agora',
        listings: [listing('agora')],
      }),
    ]
    const router = renderHome('/?section=on-order')
    expect(screen.getByRole('button', { name: 'Sob encomenda', pressed: true })).toBeDefined()
    expect(screen.queryByRole('heading', { name: 'Agora' })).toBeNull()
    expect(screen.queryByText(NO_ACTIVE_LISTING_TEXT)).toBeNull()
    expect(screen.queryByText(NO_FILTER_MATCH_TEXT)).toBeNull()
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
    expect(screen.getByRole('button', { name: 'Chega em breve', pressed: true })).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Breve' })).toBeDefined()
    const params = searchParamsOf(router.state.location.search)
    expect(params.get('section')).toBe('foo')
    expect(params.get('state')).toBe('used')
  })

  it('shows the exact empty texts for no listing and for a filter that hides every card', () => {
    mockProductsRef.current = []
    const empty = renderHome('/')
    expect(screen.getByRole('button', { name: 'Disponível', pressed: true })).toBeDefined()
    expect(screen.getByText(NO_ACTIVE_LISTING_TEXT)).toBeDefined()
    expect(screen.queryByTestId('catalog-grid')).toBeNull()
    expect(empty.state.location.search).toBe('')
    cleanup()

    mockProductsRef.current = [
      catalogProduct({
        slug: 'novo',
        title: 'Novo',
        listings: [listing('novo', { state: 'new' })],
      }),
      catalogProduct({
        slug: 'usado',
        title: 'Usado',
        listings: [listing('usado', { state: 'used' })],
      }),
    ]
    const filtered = renderHome('/?state=openbox')
    expect(screen.getByText(NO_FILTER_MATCH_TEXT)).toBeDefined()
    expect(screen.queryByRole('heading', { name: 'Novo' })).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Usado' })).toBeNull()
    expect(screen.queryByRole('checkbox', { name: 'Openbox' })).toBeNull()
    expect(searchParamsOf(filtered.state.location.search).get('state')).toBe('openbox')
  })

  it('keeps filter marks when the section changes', () => {
    mockProductsRef.current = [
      catalogProduct({
        slug: 'agora',
        title: 'Agora',
        audience: 'male',
        listings: [listing('agora', { state: 'new' })],
      }),
      catalogProduct({
        slug: 'breve',
        title: 'Breve',
        audience: 'male',
        listings: [listing('breve', { availabilityStatus: 'coming_soon', state: 'new' })],
      }),
    ]
    const router = renderHome('/?state=new&audience=male&cor=azul')
    fireEvent.click(screen.getByRole('button', { name: 'Chega em breve' }))
    const params = searchParamsOf(router.state.location.search)
    expect(params.get('section')).toBe('coming-soon')
    expect(params.get('state')).toBe('new')
    expect(params.get('audience')).toBe('male')
    expect(params.get('cor')).toBe('azul')
    expect(screen.getByRole('heading', { name: 'Breve' })).toBeDefined()
    expect(screen.queryByRole('heading', { name: 'Agora' })).toBeNull()
  })

  it('returns from a listing with the same home query', async () => {
    mockProductsRef.current = [
      catalogProduct({
        slug: 'usado',
        title: 'Usado',
        audience: 'male',
        listings: [listing('usado', { state: 'used' })],
      }),
      catalogProduct({
        slug: 'novo',
        title: 'Novo',
        audience: 'female',
        listings: [listing('novo', { state: 'new' })],
      }),
    ]
    const router = renderHome('/?state=used&audience=male')
    const cardLink = screen.getAllByRole('link').find((node) =>
      node.getAttribute('href')?.startsWith('/product/usado/usado'),
    )
    expect(cardLink).toBeDefined()
    fireEvent.click(cardLink!)
    expect(router.state.location.pathname).toBe('/product/usado/usado')
    await router.navigate(-1)
    const params = searchParamsOf(router.state.location.search)
    expect(router.state.location.pathname).toBe('/')
    expect(params.get('state')).toBe('used')
    expect(params.get('audience')).toBe('male')
    expect(params.has('section')).toBe(false)
    expect(await screen.findByRole('heading', { name: 'Usado' })).toBeDefined()
    expect(screen.queryByRole('heading', { name: 'Novo' })).toBeNull()
  })

  it('renders Estado, Público-alvo, then axes, and hides a group with one option', () => {
    mockProductsRef.current = [
      catalogProduct({
        slug: 'alfa',
        title: 'Alfa',
        audience: 'unisex',
        listings: [listing('alfa', { state: 'defective' })],
      }),
      catalogProduct({
        slug: 'cores',
        title: 'Delta',
        audience: 'male',
        axes: [
          {
            id: 'pulseira',
            label: 'Pulseira',
            values: [
              { id: 'm', value: 'Médio' },
              { id: 'g', value: 'Grande' },
            ],
          },
          {
            id: 'cor',
            label: 'Cor',
            values: [
              { id: 'az', value: 'Azul' },
              { id: 'am', value: 'Amarelo' },
            ],
          },
        ],
        listings: [
          listing('cores', {
            state: 'new',
            variants: [
              variant({
                axes: [
                  { axisId: 'pulseira', valueId: 'm' },
                  { axisId: 'cor', valueId: 'az' },
                ],
              }),
              variant({
                price: 120,
                axes: [
                  { axisId: 'pulseira', valueId: 'g' },
                  { axisId: 'cor', valueId: 'am' },
                ],
              }),
            ],
          }),
        ],
      }),
    ]
    renderHome('/')
    expect(groupNames()).toEqual(['Seção', 'Estado', 'Público-alvo', 'Cor', 'Pulseira'])
    const optionLabels = (name: string) =>
      within(screen.getByRole('group', { name }))
        .getAllByRole('checkbox')
        .map((node) => node.parentElement?.textContent?.trim())
    expect(optionLabels('Estado')).toEqual(['Novo', 'Com defeito'])
    expect(screen.queryByRole('checkbox', { name: 'Openbox' })).toBeNull()
    expect(screen.queryByRole('checkbox', { name: 'Usado' })).toBeNull()
    expect(optionLabels('Público-alvo')).toEqual(['Masculino', 'Unissex'])
    expect(optionLabels('Cor')).toEqual(['Amarelo', 'Azul'])
    expect(optionLabels('Pulseira')).toEqual(['Grande', 'Médio'])
    cleanup()

    mockProductsRef.current = [
      catalogProduct({
        slug: 'unico',
        title: 'Único',
        audience: 'male',
        axes: [{ id: 'cor', label: 'Cor', values: [{ id: 'preto', value: 'Preto' }] }],
        listings: [
          listing('unico', {
            variants: [variant({ axes: [{ axisId: 'cor', valueId: 'preto' }] })],
          }),
        ],
      }),
    ]
    renderHome('/')
    expect(screen.queryByRole('group', { name: 'Estado' })).toBeNull()
    expect(screen.queryByRole('group', { name: 'Público-alvo' })).toBeNull()
    expect(screen.queryByRole('group', { name: 'Cor' })).toBeNull()
    expect(screen.getByRole('heading', { name: 'Único' })).toBeDefined()
  })

  it('ORs marks inside a group and ANDs marks across groups from the query', () => {
    mockProductsRef.current = [
      catalogProduct({
        slug: 'm-new',
        title: 'B',
        audience: 'male',
        listings: [listing('m-new', { state: 'new' })],
      }),
      catalogProduct({
        slug: 'f-new',
        title: 'A',
        audience: 'female',
        listings: [listing('f-new', { state: 'new' })],
      }),
      catalogProduct({
        slug: 'm-used',
        title: 'C',
        audience: 'male',
        listings: [listing('m-used', { state: 'used' })],
      }),
    ]
    const router = renderHome('/')
    fireEvent.click(screen.getByRole('checkbox', { name: 'Novo' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Usado' }))
    expect(searchParamsOf(router.state.location.search).get('state')).toBe('new,used')
    expect(screen.getAllByRole('heading', { level: 2 }).map((node) => node.textContent)).toEqual([
      'A',
      'B',
      'C',
    ])
    fireEvent.click(screen.getByRole('checkbox', { name: 'Usado' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Masculino' }))
    expect(searchParamsOf(router.state.location.search).get('state')).toBe('new')
    expect(searchParamsOf(router.state.location.search).get('audience')).toBe('male')
    expect(searchParamsOf(router.state.location.search).has('section')).toBe(false)
    expect(screen.getAllByRole('heading', { level: 2 }).map((node) => node.textContent)).toEqual(['B'])
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
    expect(screen.getByRole('button', { name: 'Disponível', pressed: true })).toBeDefined()
    expect(within(screen.getByRole('heading', { name: 'Agora' }).closest('li')!).getByText('Disponível')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Chega em breve' }))
    expect(searchParamsOf(router.state.location.search).get('section')).toBe('coming-soon')
    expect(within(screen.getByRole('heading', { name: 'Breve' }).closest('li')!).getByText('Chega em breve')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Sob encomenda' }))
    expect(searchParamsOf(router.state.location.search).get('section')).toBe('on-order')
    expect(within(screen.getByRole('heading', { name: 'Encomenda' }).closest('li')!).getByText('Sob encomenda')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Disponível' }))
    expect(searchParamsOf(router.state.location.search).get('section')).toBe('available')
  })

  it('offers every variant in Disponível and only representable variants in Sob encomenda', () => {
    mockProductsRef.current = [
      catalogProduct({
        slug: 'cores',
        title: 'Cores',
        axes: [
          {
            id: 'cor',
            label: 'Cor',
            values: [
              { id: 'preto', value: 'Preto' },
              { id: 'verde', value: 'Verde' },
            ],
          },
        ],
        listings: [
          listing('cores', {
            variants: [
              variant({ axes: [{ axisId: 'cor', valueId: 'preto' }] }),
              variant({
                orderable: false,
                price: 20,
                axes: [{ axisId: 'cor', valueId: 'verde' }],
              }),
            ],
          }),
        ],
      }),
      catalogProduct({
        slug: 'encomenda',
        title: 'Encomenda',
        axes: [
          {
            id: 'cor',
            label: 'Cor',
            values: [
              { id: 'preto', value: 'Preto' },
              { id: 'azul', value: 'Azul' },
              { id: 'verde', value: 'Verde' },
            ],
          },
        ],
        listings: [
          listing('encomenda', {
            availabilityStatus: 'on_order',
            state: 'used',
            variants: [
              variant({ axes: [{ axisId: 'cor', valueId: 'preto' }] }),
              variant({ price: 30, axes: [{ axisId: 'cor', valueId: 'azul' }] }),
              variant({
                orderable: false,
                price: 20,
                axes: [{ axisId: 'cor', valueId: 'verde' }],
              }),
            ],
          }),
        ],
      }),
      catalogProduct({
        slug: 'fora',
        title: 'Fora',
        listings: [
          listing('fora', {
            state: 'defective',
            availabilityStatus: 'on_order',
            variants: [variant({ orderable: false })],
          }),
        ],
      }),
    ]
    renderHome('/?section=available')
    expect(
      within(screen.getByRole('group', { name: 'Cor' }))
        .getAllByRole('checkbox')
        .map((node) => node.parentElement?.textContent?.trim()),
    ).toEqual(['Preto', 'Verde'])
    expect(screen.queryByRole('checkbox', { name: 'Com defeito' })).toBeNull()
    cleanup()

    renderHome('/?section=on-order')
    expect(
      within(screen.getByRole('group', { name: 'Cor' }))
        .getAllByRole('checkbox')
        .map((node) => node.parentElement?.textContent?.trim()),
    ).toEqual(['Azul', 'Preto'])
    expect(screen.queryByRole('checkbox', { name: 'Verde' })).toBeNull()
    expect(screen.queryByRole('checkbox', { name: 'Com defeito' })).toBeNull()
    expect(screen.getByRole('heading', { name: 'Encomenda' })).toBeDefined()
    expect(screen.queryByRole('heading', { name: 'Fora' })).toBeNull()
  })
})
