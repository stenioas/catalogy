import type { Product } from '@catalogo/shared'
import { cleanup, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { createMemoryRouter, matchRoutes, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ThemeProvider } from '../components/theme-provider'
import { products as catalogProducts } from '../catalog/products.generated'
import { appRoutes } from './router'

const INCOMPLETE_LINK_MESSAGE =
  'Este link está incompleto ou o vendedor não existe.'
const EMPTY_VITRINE_MESSAGE = 'A vitrine ainda não tem relógios.'
const MISSING_WATCH_MESSAGE = 'Este relógio não está no catálogo.'
const SELLERS_URL = '/catalog/sellers.json'
const TOP_BAR_TITLE = 'Catálogo'

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
