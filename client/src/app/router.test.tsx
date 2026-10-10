import { cleanup, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { createMemoryRouter, matchRoutes, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ThemeProvider } from '../components/theme-provider'
import { SELLER_GATE_ERROR_MESSAGE } from '../routes/seller-gate'
import { appRoutes, catalogLoader, watchLoader } from './router'

const sellers = [
  { slug: 'alexandre', name: 'Alexandre', phone: '5585997689165' },
  { slug: 'manuela', name: 'Manuela', phone: '5585996043447' },
  { slug: 'priscila', name: 'Priscila', phone: '5585999999999' },
]

function mockSellersFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      if (String(input) === '/catalog/sellers.json') {
        return new Response(JSON.stringify(sellers))
      }
      return new Response('not found', { status: 404 })
    }),
  )
}

function renderWithTheme(ui: ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('app routes (CAT-57)', () => {
  it('matches / for the catalog grade', () => {
    const matches = matchRoutes(appRoutes, '/')
    expect(matches).toHaveLength(1)
    expect(matches![0].route.path).toBe('/')
  })

  it('matches /relogio/:slug for a watch page', () => {
    const matches = matchRoutes(appRoutes, '/relogio/seculus-kit')
    expect(matches).toHaveLength(1)
    expect(matches![0].route.path).toBe('/relogio/:slug')
    expect(matches![0].params.slug).toBe('seculus-kit')
  })

  it('passes the seller query string to the catalog loader', async () => {
    const request = new Request('https://catalogo.test/?seller=alexandre')
    await expect(catalogLoader({ request, params: {} })).resolves.toEqual({
      seller: 'alexandre',
    })
  })

  it('passes the seller query string to the watch loader', async () => {
    const request = new Request(
      'https://catalogo.test/relogio/seculus?seller=manuela',
    )
    await expect(
      watchLoader({ request, params: { slug: 'seculus' } }),
    ).resolves.toEqual({
      seller: 'manuela',
      slug: 'seculus',
    })
  })

  it('shows Catálogo Alexandre at /?seller=alexandre (CAT-30)', async () => {
    mockSellersFetch()
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/?seller=alexandre'],
    })
    renderWithTheme(<RouterProvider router={router} />)
    expect(await screen.findByText('Catálogo')).toBeDefined()
  })

  it('shows the incomplete-link sentence at / without a seller (CAT-36)', async () => {
    mockSellersFetch()
    const router = createMemoryRouter(appRoutes, { initialEntries: ['/'] })
    renderWithTheme(<RouterProvider router={router} />)
    expect(await screen.findByText(SELLER_GATE_ERROR_MESSAGE)).toBeDefined()
    expect(screen.queryByText(/^Catálogo /)).toBeNull()
  })

  it('shows the incomplete-link sentence for an unknown seller', async () => {
    mockSellersFetch()
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/?seller=ninguem'],
    })
    renderWithTheme(<RouterProvider router={router} />)
    expect(await screen.findByText(SELLER_GATE_ERROR_MESSAGE)).toBeDefined()
  })

  it('shows the seller top bar with a back link at /relogio/:slug (CAT-57)', async () => {
    mockSellersFetch()
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/relogio/seculus?seller=alexandre'],
    })
    renderWithTheme(<RouterProvider router={router} />)
    expect(await screen.findByText('Catálogo')).toBeDefined()
    const back = screen.getByRole('link', { name: 'Voltar' })
    expect(back.getAttribute('href')).toBe('/?seller=alexandre')
  })

  it('shows the incomplete-link sentence at /relogio/:slug without a seller', async () => {
    mockSellersFetch()
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/relogio/seculus'],
    })
    renderWithTheme(<RouterProvider router={router} />)
    expect(await screen.findByText(SELLER_GATE_ERROR_MESSAGE)).toBeDefined()
  })
})
