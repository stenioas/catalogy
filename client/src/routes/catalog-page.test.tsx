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
import { CatalogPage, eagerHomeCardCount, homeColumnCount, vitrineContentWidth } from './catalog-page'

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

vi.mock('../catalog/products.generated', async () => {
  const actual = await vi.importActual<typeof import('../catalog/products.generated')>(
    '../catalog/products.generated',
  )
  return {
    ...actual,
    get products() {
      return mockProductsRef.current
    },
    get labels() {
      return actual.labels
    },
  }
})

vi.mock('../components/catalog/watch-card', () => ({
  WatchCard: ({
    card,
    imageLoading = 'eager',
  }: {
    card: { slug: string; title: string; image: string; statusLabel: string }
    imageLoading?: 'eager' | 'lazy'
  }) => (
    <div data-slot="card" className="h-full">
      <img
        alt={card.title}
        loading={imageLoading}
        src={`/catalog/products/${card.slug}/img/thumbs/${card.image}`}
      />
      <p>{card.statusLabel}</p>
      <h2>{card.title}</h2>
    </div>
  ),
}))

function productsFromModule(source: string): Product[] {
  const prefix = 'export const products: Product[] = '
  const start = source.indexOf(prefix)
  if (start === -1) throw new Error('products export not found')
  const jsonStart = start + prefix.length
  const labelsMarker = '\n\nexport const labels:'
  const end = source.indexOf(labelsMarker, jsonStart)
  const json = end === -1 ? source.slice(jsonStart) : source.slice(jsonStart, end)
  return JSON.parse(json) as Product[]
}

function titlesInDealOrder(): string[] {
  const columns = screen.getAllByTestId('catalog-column-stack')
  const perColumn = columns.map((column) =>
    within(column).queryAllByRole('heading', { level: 2 }).map((node) => node.textContent ?? ''),
  )
  const longest = Math.max(0, ...perColumn.map((column) => column.length))
  const titles: string[] = []
  for (let row = 0; row < longest; row += 1) {
    for (const column of perColumn) {
      const title = column[row]
      if (title !== undefined) titles.push(title)
    }
  }
  return titles
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
    expect(titlesInDealOrder()).toEqual(['Addiesdive', 'CURREN', 'Seculus'])
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
    expect(titlesInDealOrder()).toEqual(['addiesdive', 'Épico', 'Zeta'])
  })

  it('uses two columns at 360px and six across the 1120px vitrine', () => {
    expect(homeColumnCount(vitrineContentWidth(360))).toBe(2)
    expect(homeColumnCount(311)).toBe(1)
    expect(vitrineContentWidth(360)).toBe(336)
    expect(vitrineContentWidth(1280)).toBe(1096)
    expect(homeColumnCount(vitrineContentWidth(1120))).toBe(6)
    expect(homeColumnCount(vitrineContentWidth(767))).toBe(4)

    const previousWidth = window.innerWidth
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 360 })
    mockProductsRef.current = [1, 2, 3, 4, 5, 6].map((n) => makeProduct(`p-${n}`, `P ${n}`))
    try {
      renderCatalogPage()
      const columns = screen.getAllByTestId('catalog-column-stack')
      expect(columns).toHaveLength(2)
      expect(within(columns[0]!).getAllByRole('heading', { level: 2 }).map((node) => node.textContent)).toEqual([
        'P 1',
        'P 3',
        'P 5',
      ])
      expect(within(columns[1]!).getAllByRole('heading', { level: 2 }).map((node) => node.textContent)).toEqual([
        'P 2',
        'P 4',
        'P 6',
      ])
      const grid = screen.getByTestId('catalog-grid')
      expect(grid.className).toMatch(/\bflex\b/)
      expect(grid.className).toMatch(/\bitems-start\b/)
      expect(grid.classList.contains('catalog-grid')).toBe(true)
    } finally {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: previousWidth })
    }
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

  it('does not draw a hairline between mobile rows', () => {
    const css = readFileSync(join(clientRoot, 'src/index.css'), 'utf8')
    expect(css).not.toMatch(/catalog-grid > li:not\(:last-child\)::after/)
  })

  it('pads only the catalog results by 12px and keeps the filter inset', () => {
    mockProductsRef.current = [makeProduct('one', 'One')]
    renderCatalogPage()
    const column = screen.getByTestId('catalog-page-column')
    expect(column.classList.contains('catalog-vitrine')).toBe(true)

    const css = readFileSync(join(clientRoot, 'src/index.css'), 'utf8')
    const vitrine = css.match(/\.catalog-vitrine\s*\{([^}]*)\}/)?.[1]
    const results = css.match(/\.catalog-results\s*\{([^}]*)\}/)?.[1]
    expect(vitrine).toMatch(/padding-inline:\s*0/)
    expect(results).toMatch(/padding-inline:\s*12px/)
    expect(screen.getByRole('group', { name: 'Filtros' }).classList.contains('px-1')).toBe(true)
  })

  it('keeps the first screen eager and lazy-loads the card covers below it', () => {
    expect(eagerHomeCardCount(390, 700)).toBe(4)
    expect(eagerHomeCardCount(1280, 800)).toBe(18)
    const previousWidth = window.innerWidth
    const previousHeight = window.innerHeight
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 700 })
    mockProductsRef.current = Array.from({ length: 8 }, (_, index) =>
      makeProduct(`watch-${index}`, `Watch ${index}`),
    )
    try {
      renderCatalogPage()
      const images = within(screen.getByTestId('catalog-grid')).getAllByRole('img')
      const eager = eagerHomeCardCount(390, 700)
      const loadingBySlug = new Map(
        images.map((img) => {
          const slug = img.getAttribute('src')?.split('/')[3]
          return [slug, img.getAttribute('loading')] as const
        }),
      )
      for (let index = 0; index < 8; index += 1) {
        expect(loadingBySlug.get(`watch-${index}`)).toBe(index < eager ? 'eager' : 'lazy')
      }
    } finally {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: previousWidth })
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: previousHeight })
    }
  })

  it('lists each watch in the product grid (SV-01, AC1)', () => {
    mockProductsRef.current = [
      makeProduct('alpha', 'Alpha'),
      makeProduct('beta', 'Beta'),
    ]
    renderCatalogPage()
    const grid = screen.getByTestId('catalog-grid')
    expect(within(grid).getAllByRole('heading', { level: 2 })).toHaveLength(2)
    expect(screen.getByAltText('Achavio')).toBeDefined()
  })

  it('shows the empty vitrine copy and keeps Catálogo in the top bar (SV-06, CAT-121, CAT-122, AC6–7)', () => {
    mockProductsRef.current = []
    renderCatalogPage()
    expect(screen.getByAltText('Achavio')).toBeDefined()
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
    const firstPass = titlesInDealOrder()
    cleanup()
    mockProductsRef.current = [
      makeProduct('a', 'Addiesdive'),
      makeProduct('b', 'CURREN'),
      makeProduct('c', 'Seculus'),
    ]
    renderCatalogPage()
    const secondPass = titlesInDealOrder()
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
      writeProductsModule(shuffled, [], firstFile)
      writeProductsModule([...shuffled].reverse(), [], secondFile)

      mockProductsRef.current = productsFromModule(readFileSync(firstFile, 'utf8'))
      renderCatalogPage()
      const firstBuild = titlesInDealOrder()
      cleanup()

      mockProductsRef.current = productsFromModule(readFileSync(secondFile, 'utf8'))
      renderCatalogPage()
      const secondBuild = titlesInDealOrder()

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
    state: 'new',
    availabilityStatus: 'available',
    price: 100,
    mainImage: 'foto.webp',
    ...overrides,
  }
}

function listing(id: string, variantOverrides: Partial<Variant> = {}): Listing {
  const variantEntry = variant(variantOverrides)
  return {
    id,
    state: variantEntry.state ?? 'new',
    images: ['foto.webp'],
    variants: [variantEntry],
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

describe('CatalogPage filters', () => {
  afterEach(() => {
    cleanup()
    mockProductsRef.current = []
  })

  beforeEach(() => {
    mockProductsRef.current = []
  })

  it('LBL-35 LBL-36 LBL-37: lists Todos, filterable labels, then fixed filters with shortText and text', () => {
    mockProductsRef.current = [
      catalogProduct({
        slug: 'encomenda',
        title: 'Encomenda',
        listings: [listing('encomenda', { availabilityStatus: 'on_order', price: undefined })],
      }),
      catalogProduct({
        slug: 'disponivel',
        title: 'Disponível',
        listings: [listing('disponivel', { availabilityStatus: 'available' })],
      }),
    ]
    const router = renderHome('/')
    const group = screen.getByRole('group', { name: 'Filtros' })
    expect(within(group).getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Todos',
      'Black Friday',
      'acima 20%',
      'Feminino',
      'Masculino',
      'Novos',
      'Openbox',
      'Usados',
    ])
    expect(within(group).getAllByRole('button', { pressed: true })).toHaveLength(1)
    expect(group.classList.contains('flex-nowrap')).toBe(true)
    expect(group.classList.contains('overflow-x-auto')).toBe(true)
    expect(group.classList.contains('px-1')).toBe(true)
    expect(group.classList.contains('catalog-filters')).toBe(true)
    expect(group.classList.contains('pb-4')).toBe(false)
    const pressed = screen.getByRole('button', { name: 'Todos', pressed: true })
    expect(pressed.classList.contains('rounded-full')).toBe(true)
    expect(pressed.classList.contains('cursor-pointer')).toBe(true)
    expect(pressed.classList.contains('bg-primary')).toBe(true)
    expect(pressed).toHaveProperty('disabled', false)
    expect(screen.getByRole('heading', { name: 'Disponível' })).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Encomenda' })).toBeDefined()
    expect(router.state.location.search).toBe('')
  })

  it('writes the filter token and preserves the query when the active button is pressed', () => {
    mockProductsRef.current = [
      catalogProduct({
        slug: 'female-watch',
        title: 'Female',
        audience: 'female',
        listings: [listing('female-watch')],
      }),
    ]
    const router = renderHome('/?filter=female')
    fireEvent.click(screen.getByRole('button', { name: 'Feminino', pressed: true }))
    expect(router.state.location.search).toBe('?filter=female')
    fireEvent.click(screen.getByRole('button', { name: 'Todos' }))
    expect(router.state.location.search).toBe('')
    fireEvent.click(screen.getByRole('button', { name: 'Feminino' }))
    expect(router.state.location.search).toBe('?filter=female')
  })

  it('LBL-38: omits the legacy fixed discount pill label', () => {
    mockProductsRef.current = [catalogProduct({ slug: 'one', title: 'One', listings: [listing('one')] })]
    renderHome('/')
    expect(screen.queryByRole('button', { name: '20%+ de desconto' })).toBeNull()
  })

  it('LBL-39: ?filter=black-friday lists only cards whose resolved campaign is black-friday', () => {
    mockProductsRef.current = [
      catalogProduct({
        slug: 'with-campaign',
        title: 'Com BF',
        listings: [listing('with-campaign', { availabilityStatus: 'available' })],
      }),
      catalogProduct({
        slug: 'without-campaign',
        title: 'Sem BF',
        listings: [
          {
            ...listing('without-campaign', { availabilityStatus: 'available' }),
            disabledLabels: ['black-friday'],
          },
        ],
      }),
    ]
    const router = renderHome('/?filter=black-friday')
    expect(screen.getByRole('heading', { name: 'Com BF' })).toBeDefined()
    expect(screen.queryByRole('heading', { name: 'Sem BF' })).toBeNull()
    expect(router.state.location.search).toBe('?filter=black-friday')
    expect(screen.getByRole('button', { name: 'Black Friday', pressed: true })).toBeDefined()
  })

  it('LBL-40 LBL-42: filters discount at twenty percent and disables a filter without cards', () => {
    mockProductsRef.current = [
      catalogProduct({
        slug: 'discount',
        title: 'Desconto',
        listings: [listing('discount', { price: 80, listPrice: 100, availabilityStatus: 'available' })],
      }),
      catalogProduct({
        slug: 'not-discount',
        title: 'Sem desconto',
        listings: [listing('not-discount', { price: 80.1, listPrice: 100, availabilityStatus: 'available' })],
      }),
    ]
    const router = renderHome('/?filter=discount-20')
    expect(screen.getByRole('heading', { name: 'Desconto' })).toBeDefined()
    expect(screen.queryByRole('heading', { name: 'Sem desconto' })).toBeNull()
    expect(router.state.location.search).toBe('?filter=discount-20')
    expect(screen.getByRole('button', { name: 'Feminino' })).toHaveProperty('disabled', true)
  })

  it('falls back to Todos for invalid or empty filters without rewriting the query', () => {
    mockProductsRef.current = [
      catalogProduct({
        slug: 'watch',
        title: 'Watch',
        audience: 'female',
        listings: [listing('watch', { state: 'openbox' })],
      }),
    ]
    const router = renderHome('/?filter=invalid')
    expect(screen.getByRole('button', { name: 'Todos', pressed: true })).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Watch' })).toBeDefined()
    expect(router.state.location.search).toBe('?filter=invalid')
    cleanup()
    const section = renderHome('/?section=on-order')
    expect(screen.getByRole('button', { name: 'Todos', pressed: true })).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Watch' })).toBeDefined()
    expect(section.state.location.search).toBe('?section=on-order')
    cleanup()
    const emptyFilter = renderHome('/?filter=male')
    expect(screen.getByRole('button', { name: 'Todos', pressed: true })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Todos' })).toHaveProperty('disabled', false)
    expect(screen.getByRole('heading', { name: 'Watch' })).toBeDefined()
    expect(emptyFilter.state.location.search).toBe('?filter=male')
    cleanup()
    const emptyUsed = renderHome('/?filter=used')
    expect(screen.getByRole('button', { name: 'Usados' })).toHaveProperty('disabled', true)
    expect(screen.getByRole('button', { name: 'Todos', pressed: true })).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Watch' })).toBeDefined()
    expect(emptyUsed.state.location.search).toBe('?filter=used')
  })

  it('writes discount, male, new, and openbox when those pills are pressed', () => {
    mockProductsRef.current = [
      catalogProduct({
        slug: 'discount',
        title: 'Desconto',
        audience: 'male',
        listings: [
          listing('discount', {
            state: 'new',
            availabilityStatus: 'available',
            price: 80,
            listPrice: 100,
          }),
        ],
      }),
      catalogProduct({
        slug: 'openbox',
        title: 'Caixa',
        audience: 'male',
        listings: [listing('openbox', { state: 'openbox', availabilityStatus: 'available', price: 50 })],
      }),
    ]
    const router = renderHome('/')
    fireEvent.click(screen.getByRole('button', { name: 'acima 20%' }))
    expect(router.state.location.search).toBe('?filter=discount-20')
    fireEvent.click(screen.getByRole('button', { name: 'Masculino' }))
    expect(router.state.location.search).toBe('?filter=male')
    fireEvent.click(screen.getByRole('button', { name: 'Novos' }))
    expect(router.state.location.search).toBe('?filter=new')
    fireEvent.click(screen.getByRole('button', { name: 'Openbox' }))
    expect(router.state.location.search).toBe('?filter=openbox')
  })

  it('disables Todos and shows the empty text when there are no cards', () => {
    mockProductsRef.current = []
    renderHome('/')
    expect(screen.getByRole('button', { name: 'Todos' })).toHaveProperty('disabled', true)
    expect(screen.getByText(NO_ACTIVE_LISTING_TEXT)).toBeDefined()
    expect(screen.queryByTestId('catalog-grid')).toBeNull()
  })

  it('filters by audience and effective state', () => {
    mockProductsRef.current = [
      catalogProduct({
        slug: 'female',
        title: 'Female',
        audience: 'female',
        listings: [listing('female')],
      }),
      catalogProduct({
        slug: 'child',
        title: 'Child',
        audience: 'child',
        listings: [listing('child')],
      }),
      catalogProduct({
        slug: 'used',
        title: 'Used',
        listings: [listing('used', { state: 'used' })],
      }),
    ]
    const router = renderHome('/')
    fireEvent.click(screen.getByRole('button', { name: 'Feminino' }))
    expect(router.state.location.search).toBe('?filter=female')
    expect(screen.getByRole('heading', { name: 'Female' })).toBeDefined()
    expect(screen.queryByRole('heading', { name: 'Child' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Usados' }))
    expect(router.state.location.search).toBe('?filter=used')
    expect(screen.getByRole('heading', { name: 'Used' })).toBeDefined()
    expect(screen.queryByRole('heading', { name: 'Female' })).toBeNull()
  })

})
