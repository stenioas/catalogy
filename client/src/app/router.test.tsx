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
const EMPTY_VITRINE_MESSAGE = 'A vitrine ainda não tem relógios.'
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
  mockProductsRef.current = null
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('loading ao navegar entre vitrine e produto', () => {
  function setup(path = '/') {
    vi.useFakeTimers()
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    const router = createMemoryRouter(
      [{ element: <AppShell />, children: appRoutes }],
      { initialEntries: [path] },
    )
    renderWithTheme(<RouterProvider router={router} />)
    return router
  }

  async function advance(ms: number) {
    await act(async () => { await vi.advanceTimersByTimeAsync(ms) })
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

  it('exibe o spinner por 1 segundo ao abrir o produto e ao voltar pelo botão', async () => {
    setup()
    expect(screen.getByTestId('catalog-page-column')).toBeDefined()
    const card = screen.getAllByTestId('watch-card-link')[0]
    const title = card.querySelector('h2')!.textContent!
    fireEvent.click(card)
    expectLoading()
    expect(window.scrollTo).not.toHaveBeenCalled()
    await advance(999)
    expectLoading()
    expect(window.scrollTo).not.toHaveBeenCalled()
    await advance(1)
    expect(screen.getByRole('heading', { name: title })).toBeDefined()
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
    expect(screen.queryByRole('status', { name: 'Carregando' })).toBeNull()

    fireEvent.click(screen.getByRole('link', { name: 'Voltar' }))
    expectLoading('watch')
    await advance(999)
    expectLoading('watch')
    await advance(1)
    expect(screen.getByTestId('catalog-page-column')).toBeDefined()
  })

  it('mantém o mínimo de 1 segundo também no voltar e avançar do navegador', async () => {
    const router = setup()
    await act(async () => { await router.navigate(`/product/${watchSlug()}`) })
    await advance(1000)
    await act(async () => { await router.navigate(-1) })
    expectLoading('watch')
    await advance(999)
    expectLoading('watch')
    await advance(1)
    expect(screen.getByTestId('catalog-page-column')).toBeDefined()

    await act(async () => { await router.navigate(1) })
    expectLoading()
    await advance(1000)
    expect(screen.getByRole('heading', { name: watchTitle() })).toBeDefined()
  })

  it('exibe o loading ao abrir diretamente a URL do produto', async () => {
    setup(`/product/${watchSlug()}`)
    expectLoading('watch')
    await advance(999)
    expectLoading('watch')
    await advance(1)
    expect(screen.getByRole('heading', { name: watchTitle() })).toBeDefined()
  })

  it('reinicia o segundo mínimo quando o destino muda durante o loading', async () => {
    const router = setup()
    await act(async () => { await router.navigate(`/product/${watchSlug()}`) })
    await advance(500)
    await act(async () => { await router.navigate('/') })
    await advance(999)
    expectLoading()
    await advance(1)
    expect(screen.getByTestId('catalog-page-column')).toBeDefined()
    expect(screen.queryByTestId('watch-page-column')).toBeNull()
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
    expect(screen.queryByRole('link', { name: 'Enviar no WhatsApp' })).toBeNull()
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
