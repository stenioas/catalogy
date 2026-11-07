import type { Product } from '@catalogo/shared'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { createMemoryRouter, matchRoutes, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ThemeProvider } from '../components/theme-provider'
import { products as catalogProducts } from '../catalog/products.generated'
import { AppShell, appRoutes } from './router'

const INCOMPLETE_LINK_MESSAGE =
  'Este link está incompleto ou o vendedor não existe.'
const EMPTY_VITRINE_MESSAGE = 'Não temos nenhum anúncio ativo.'
const MISSING_WATCH_MESSAGE = 'Este relógio não está no catálogo.'
const SELLERS_URL = '/catalog/sellers.json'
const TOP_BAR_TITLE = 'Catálogo de Produtos'

const { mockProductsRef } = vi.hoisted(() => ({
  mockProductsRef: { current: null as Product[] | null },
}))

vi.mock('../catalog/products.generated', async () => {
  const actual = await vi.importActual<typeof import('../catalog/products.generated')>(
    '../catalog/products.generated',
  )
  return {
    get products() {
      return mockProductsRef.current ?? actual.products
    },
  }
})

function installFetchSpy() {
  const fetchMock = vi.fn(async () => new Response('not found', { status: 404 }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function didRequestSellers(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls.some((call) => String(call[0]).includes(SELLERS_URL))
}

function renderWithTheme(ui: ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

function renderAt(path: string) {
  const fetchMock = installFetchSpy()
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] })
  renderWithTheme(<RouterProvider router={router} />)
  return fetchMock
}

function watchSlug(): string {
  const product = catalogProducts[0]
  if (!product) throw new Error('catalog fixture has no watch')
  return product.slug
}

function watchTitle(): string {
  const product = catalogProducts[0]
  if (!product) throw new Error('catalog fixture has no watch')
  return product.title
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })))
  mockProductsRef.current = null
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

const ROUTE_ENTER_CLASSES = [
  'motion-safe:animate-in',
  'motion-safe:fade-in',
  'motion-safe:slide-in-from-bottom-2',
  'motion-safe:duration-200',
]

describe('troca entre vitrine e produto', () => {
  function setup(path = '/') {
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(0)
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    const router = createMemoryRouter(
      [{ element: <AppShell />, children: appRoutes }],
      { initialEntries: [path] },
    )
    renderWithTheme(<RouterProvider router={router} />)
    return router
  }

  function setupPendingLoader() {
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(0)
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    let release: (value: null) => void = () => {}
    const pending = new Promise<null>((resolve) => {
      release = resolve
    })
    const router = createMemoryRouter(
      [{
        element: <AppShell />,
        children: [
          ...appRoutes,
          {
            path: '/lento',
            loader: () => pending,
            element: <div data-testid="slow-page" />,
          },
        ],
      }],
      { initialEntries: ['/'] },
    )
    renderWithTheme(<RouterProvider router={router} />)
    return { router, release: () => release(null) }
  }

  function expectRouteEnter() {
    const stage = screen.getByTestId('route-stage')
    for (const className of ROUTE_ENTER_CLASSES) {
      expect(stage.classList.contains(className)).toBe(true)
    }
    expect(screen.queryByTestId('route-loading')).toBeNull()
  }

  function expectLoading(currentPage: 'catalog' | 'watch' = 'catalog') {
    const spinner = screen.getByRole('status', { name: 'Carregando' })
    expect(spinner.getAttribute('data-slot')).toBe('spinner')
    expect(spinner.classList.contains('text-primary')).toBe(true)
    const overlay = screen.getByTestId('route-loading')
    for (const className of ['fixed', 'inset-x-0', 'top-16', 'bottom-0', 'items-center', 'justify-center', 'bg-background/30', 'backdrop-blur-sm']) {
      expect(overlay.classList.contains(className)).toBe(true)
    }
    expect(overlay.classList.contains('bg-background')).toBe(false)
    expect(overlay.contains(screen.getByTestId('top-bar'))).toBe(false)
    expect(screen.getByTestId('top-bar').classList.contains('z-20')).toBe(true)
    expect(overlay.classList.contains('z-10')).toBe(true)
    expect(screen.getByTestId(`${currentPage}-page-column`)).toBeDefined()
    expect(screen.queryByTestId(`${currentPage === 'catalog' ? 'watch' : 'catalog'}-page-column`)).toBeNull()
  }

  it('troca o card e a volta na hora, com animação e sem loading', () => {
    setup()
    expectRouteEnter()
    expect(screen.getByTestId('catalog-page-column')).toBeDefined()
    const card = screen.getAllByTestId('watch-card-link')[0]
    const title = card.querySelector('h2')!.textContent!
    fireEvent.click(card)
    expect(screen.getByRole('heading', { name: title })).toBeDefined()
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
    expect(screen.queryByRole('status', { name: 'Carregando' })).toBeNull()
    expectRouteEnter()

    fireEvent.click(screen.getByRole('link', { name: 'Voltar' }))
    expect(screen.getByTestId('catalog-page-column')).toBeDefined()
    expect(screen.queryByTestId('watch-page-column')).toBeNull()
    expect(screen.queryByRole('status', { name: 'Carregando' })).toBeNull()
    expectRouteEnter()
  })

  it('mantém a seção escolhida ao voltar do produto', () => {
    setup()
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Chega em breve' }))
    fireEvent.click(screen.getAllByTestId('watch-card-link')[0])
    expect(screen.getByRole('link', { name: 'Voltar' }).getAttribute('href')).toBe('/?section=coming-soon')
    fireEvent.click(screen.getByRole('link', { name: 'Voltar' }))
    expect(screen.getByRole('tab', { name: 'Chega em breve', selected: true })).toBeDefined()
    expect(screen.getByTestId('catalog-page-column')).toBeDefined()
  })

  it('troca a seção na hora, sem loading artificial', () => {
    setup()
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Chega em breve' }))
    const results = screen.getByTestId('catalog-results')
    for (const className of ROUTE_ENTER_CLASSES) {
      expect(results.classList.contains(className)).toBe(true)
    }
    expect(screen.queryByTestId('route-loading')).toBeNull()
  })

  it('troca na hora no voltar e avançar do navegador, sem loading', async () => {
    const router = setup()
    await act(async () => { await router.navigate(`/product/${watchSlug()}`) })
    expect(screen.getByRole('heading', { name: watchTitle() })).toBeDefined()
    expect(screen.queryByTestId('route-loading')).toBeNull()

    await act(async () => { await router.navigate(-1) })
    expect(screen.getByTestId('catalog-page-column')).toBeDefined()
    expect(screen.queryByTestId('route-loading')).toBeNull()

    await act(async () => { await router.navigate(1) })
    expect(screen.getByRole('heading', { name: watchTitle() })).toBeDefined()
    expect(screen.queryByRole('status', { name: 'Carregando' })).toBeNull()
    expectRouteEnter()
  })

  it('abre a URL do produto na hora, sem o loading artificial', () => {
    setup(`/product/${watchSlug()}`)
    expect(screen.getByRole('heading', { name: watchTitle() })).toBeDefined()
    expect(screen.queryByRole('status', { name: 'Carregando' })).toBeNull()
    expectRouteEnter()
  })

  it('mostra na hora o destino mais recente, sem segurar a tela anterior', async () => {
    const router = setup()
    await act(async () => { await router.navigate(`/product/${watchSlug()}`) })
    await act(async () => { await router.navigate('/') })
    expect(screen.getByTestId('catalog-page-column')).toBeDefined()
    expect(screen.queryByTestId('watch-page-column')).toBeNull()
    expect(screen.queryByTestId('route-loading')).toBeNull()
  })

  it('mantém o loading e cobre a faixa superior enquanto um loader real está pendente', async () => {
    const { router, release } = setupPendingLoader()
    const scrollY = vi.spyOn(window, 'scrollY', 'get')
    scrollY.mockReturnValue(160)
    fireEvent.scroll(window)
    const bar = screen.getByTestId('top-bar')
    expect(bar.hasAttribute('inert')).toBe(true)

    let pendingNavigation: Promise<unknown> = Promise.resolve()
    await act(async () => {
      pendingNavigation = router.navigate('/lento')
    })
    expectLoading()
    const overlay = screen.getByTestId('route-loading')
    expect(overlay.closest('.group\\/route')?.contains(bar)).toBe(true)
    expect(overlay.classList.contains('group-has-[header[inert]]/route:top-0')).toBe(true)
    expect(bar.hasAttribute('inert')).toBe(true)

    scrollY.mockReturnValue(80)
    fireEvent.scroll(window)
    expect(bar.hasAttribute('inert')).toBe(false)
    expect(overlay.classList.contains('top-16')).toBe(true)
    expect(screen.getByRole('status', { name: 'Carregando' })).toBeDefined()

    await act(async () => {
      release()
      await pendingNavigation
    })
    expect(screen.queryByTestId('route-loading')).toBeNull()
    expect(screen.getByTestId('slow-page')).toBeDefined()
  })
})

describe('rotas sem vendedor (SV-02, SV-03, SV-04, SV-05, SV-11)', () => {
  it('abre / com a vitrine, a barra Catálogo e sem buscar sellers.json (SV-05)', async () => {
    const matches = matchRoutes(appRoutes, '/')
    expect(matches).toHaveLength(1)
    expect(matches![0].route.path).toBe('/')
    expect(matches![0].route.loader).toBeUndefined()

    const fetchMock = renderAt('/')
    expect(await screen.findByText(watchTitle())).toBeDefined()
    expect(screen.getByTestId('top-bar').textContent).toContain(TOP_BAR_TITLE)
    expect(screen.getByTestId('top-bar').textContent).not.toContain('Alexandre')
    expect(screen.queryByText(INCOMPLETE_LINK_MESSAGE)).toBeNull()
    expect(didRequestSellers(fetchMock)).toBe(false)
  })

  it('mostra em /?seller=alexandre o mesmo catálogo de / (SV-02, SV-04)', async () => {
    renderAt('/')
    expect(await screen.findByText(watchTitle())).toBeDefined()
    const catalogAtRoot = document.body.textContent

    cleanup()
    const fetchMock = renderAt('/?seller=alexandre')
    expect(await screen.findByText(watchTitle())).toBeDefined()
    expect(document.body.textContent).toBe(catalogAtRoot)
    expect(screen.queryByText(INCOMPLETE_LINK_MESSAGE)).toBeNull()
    expect(screen.getByTestId('top-bar').textContent).not.toContain('Alexandre')
    expect(didRequestSellers(fetchMock)).toBe(false)
  })

  it('trata /?seller=ninguem como a vitrine normal (SV-03, SV-04)', async () => {
    renderAt('/')
    expect(await screen.findByText(watchTitle())).toBeDefined()
    const catalogAtRoot = document.body.textContent

    cleanup()
    const fetchMock = renderAt('/?seller=ninguem')
    expect(await screen.findByText(watchTitle())).toBeDefined()
    expect(document.body.textContent).toBe(catalogAtRoot)
    expect(screen.queryByText(INCOMPLETE_LINK_MESSAGE)).toBeNull()
    expect(didRequestSellers(fetchMock)).toBe(false)
  })

  it('abre /product/:slug pelo slug da URL, sem loader', async () => {
    const slug = watchSlug()
    const matches = matchRoutes(appRoutes, `/product/${slug}`)
    expect(matches).toHaveLength(1)
    expect(matches![0].route.path).toBe('/product/:slug')
    expect(matches![0].params.slug).toBe(slug)
    expect(matches![0].route.loader).toBeUndefined()

    const fetchMock = renderAt(`/product/${slug}`)
    expect(await screen.findByRole('heading', { name: watchTitle() })).toBeDefined()
    expect(screen.queryByText(INCOMPLETE_LINK_MESSAGE)).toBeNull()
    expect(didRequestSellers(fetchMock)).toBe(false)
  })

  it('associa /product/:slug/:listingId à rota com listingId e abre o anúncio (VAR-82, VAR-83)', async () => {
    const slug = watchSlug()
    const matches = matchRoutes(appRoutes, `/product/${slug}/listing`)
    expect(matches).toHaveLength(1)
    expect(matches![0].route.path).toBe('/product/:slug/:listingId')
    expect(matches![0].params.slug).toBe(slug)
    expect(matches![0].params.listingId).toBe('listing')

    const fetchMock = renderAt(`/product/${slug}/listing`)
    expect(await screen.findByRole('heading', { name: watchTitle() })).toBeDefined()
    expect(screen.getByTestId('watch-page-column')).toBeDefined()
    expect(screen.queryByText(MISSING_WATCH_MESSAGE)).toBeNull()
    expect(didRequestSellers(fetchMock)).toBe(false)
  })

  it('mostra a frase de ausente quando o id do anúncio não existe (VAR-85)', async () => {
    const slug = watchSlug()
    const fetchMock = renderAt(`/product/${slug}/id-inexistente`)
    expect(await screen.findByText(MISSING_WATCH_MESSAGE)).toBeDefined()
    expect(screen.queryByRole('link', { name: 'Compartilhar' })).toBeNull()
    expect(didRequestSellers(fetchMock)).toBe(false)
  })

  it('mostra a frase de ausente quando o anúncio está oculto (VAR-85)', async () => {
    const fetchMock = renderAt('/product/addiesdive-my-h3-2qz-green-black/listing')
    expect(await screen.findByText(MISSING_WATCH_MESSAGE)).toBeDefined()
    expect(screen.queryByRole('link', { name: 'Compartilhar' })).toBeNull()
    expect(didRequestSellers(fetchMock)).toBe(false)
  })

  it('mostra o mesmo relógio em /product/{slug}?seller=alexandre (SV-11, SV-04)', async () => {
    const slug = watchSlug()
    renderAt(`/product/${slug}`)
    expect(await screen.findByRole('heading', { name: watchTitle() })).toBeDefined()
    const watchAtPath = document.body.textContent

    cleanup()
    const fetchMock = renderAt(`/product/${slug}?seller=alexandre`)
    expect(await screen.findByRole('heading', { name: watchTitle() })).toBeDefined()
    expect(document.body.textContent).toBe(watchAtPath)
    expect(screen.queryByText(INCOMPLETE_LINK_MESSAGE)).toBeNull()
    expect(didRequestSellers(fetchMock)).toBe(false)
  })

  it('mostra a frase de relógio ausente e omite o WhatsApp quando o slug não existe', async () => {
    const fetchMock = renderAt('/product/slug-ausente')
    expect(await screen.findByText(MISSING_WATCH_MESSAGE)).toBeDefined()
    expect(screen.queryByRole('link', { name: 'Compartilhar' })).toBeNull()
    expect(screen.queryByText(INCOMPLETE_LINK_MESSAGE)).toBeNull()
    expect(didRequestSellers(fetchMock)).toBe(false)
  })

  it('mostra a frase de vitrine vazia quando não há produtos', async () => {
    const title = watchTitle()
    mockProductsRef.current = []
    const fetchMock = renderAt('/')
    expect(await screen.findByText(EMPTY_VITRINE_MESSAGE)).toBeDefined()
    expect(screen.queryByText(title)).toBeNull()
    expect(screen.queryByText(INCOMPLETE_LINK_MESSAGE)).toBeNull()
    expect(didRequestSellers(fetchMock)).toBe(false)
  })
})
