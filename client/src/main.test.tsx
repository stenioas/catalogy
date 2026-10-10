import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { products } from './catalog/products.generated'

const clientRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

const INCOMPLETE_LINK_MESSAGE =
  'Este link está incompleto ou o vendedor não existe.'
const SELLERS_URL = '/catalog/sellers.json'
const TOP_BAR_TITLE = 'Catálogo'

function watchTitle(): string {
  const product = products[0]
  if (!product) throw new Error('catalog fixture has no watch')
  return product.title
}

function watchSlug(): string {
  const product = products[0]
  if (!product) throw new Error('catalog fixture has no watch')
  return product.slug
}

function installFetchSpy() {
  const fetchMock = vi.fn(async () => new Response('not found', { status: 404 }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function didRequestSellers(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls.some((call) => String(call[0]).includes(SELLERS_URL))
}

async function renderApp(path: string) {
  window.history.replaceState({}, '', path)
  vi.resetModules()
  const fetchMock = installFetchSpy()
  const { AppRoot } = await import('./main')
  render(<AppRoot />)
  return fetchMock
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('entrada da aplicação sem vendedor (SV-02, SV-03, SV-04, SV-05, SV-11)', () => {
  it('carrega main.tsx a partir do index.html como módulo do Vite', () => {
    const html = readFileSync(join(clientRoot, 'index.html'), 'utf-8')
    expect(html).toMatch(
      /<script[^>]+type="module"[^>]+src="\/src\/main\.tsx"/,
    )
  })

  it('abre / com a vitrine e sem buscar sellers.json (SV-05)', async () => {
    const fetchMock = await renderApp('/')
    expect(await screen.findByText(watchTitle())).toBeDefined()
    expect(screen.getByTestId('top-bar').textContent).toContain(TOP_BAR_TITLE)
    expect(screen.getByTestId('top-bar').textContent).not.toContain('Alexandre')
    expect(screen.queryByText(INCOMPLETE_LINK_MESSAGE)).toBeNull()
    expect(didRequestSellers(fetchMock)).toBe(false)
  })

  it('mostra em /?seller=alexandre o mesmo catálogo de / (SV-02, SV-04)', async () => {
    await renderApp('/')
    expect(await screen.findByText(watchTitle())).toBeDefined()
    const catalogAtRoot = document.body.textContent

    cleanup()
    const fetchMock = await renderApp('/?seller=alexandre')
    expect(await screen.findByText(watchTitle())).toBeDefined()
    expect(document.body.textContent).toBe(catalogAtRoot)
    expect(screen.queryByText(INCOMPLETE_LINK_MESSAGE)).toBeNull()
    expect(didRequestSellers(fetchMock)).toBe(false)
  })

  it('trata /?seller=ninguem como a vitrine normal (SV-03, SV-04)', async () => {
    await renderApp('/')
    expect(await screen.findByText(watchTitle())).toBeDefined()
    const catalogAtRoot = document.body.textContent

    cleanup()
    const fetchMock = await renderApp('/?seller=ninguem')
    expect(await screen.findByText(watchTitle())).toBeDefined()
    expect(document.body.textContent).toBe(catalogAtRoot)
    expect(screen.queryByText(INCOMPLETE_LINK_MESSAGE)).toBeNull()
    expect(didRequestSellers(fetchMock)).toBe(false)
  })

  it('mostra o mesmo relógio em /product/{slug}?seller=alexandre (SV-11)', async () => {
    const slug = watchSlug()
    await renderApp(`/product/${slug}`)
    expect(await screen.findByRole('heading', { name: watchTitle() })).toBeDefined()
    const watchAtPath = document.body.textContent

    cleanup()
    const fetchMock = await renderApp(`/product/${slug}?seller=alexandre`)
    expect(await screen.findByRole('heading', { name: watchTitle() })).toBeDefined()
    expect(document.body.textContent).toBe(watchAtPath)
    expect(screen.queryByText(INCOMPLETE_LINK_MESSAGE)).toBeNull()
    expect(screen.getByRole('link', { name: 'Voltar' }).getAttribute('href')).toBe('/')
    expect(didRequestSellers(fetchMock)).toBe(false)
  })

  it('não mostra o botão de tema e permanece no claro em /?seller=alexandre', async () => {
    localStorage.setItem('theme:v1', 'dark')
    await renderApp('/?seller=alexandre')
    expect(await screen.findByText(watchTitle())).toBeDefined()
    expect(screen.queryByRole('button', { name: /Usar tema/ })).toBeNull()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
