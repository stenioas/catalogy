import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const clientRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

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

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('app entry (CAT-20)', () => {
  it('loads main.tsx from index.html as the Vite module entry', () => {
    const html = readFileSync(join(clientRoot, 'index.html'), 'utf-8')
    expect(html).toMatch(
      /<script[^>]+type="module"[^>]+src="\/src\/main\.tsx"/,
    )
  })

  it('shows Catálogo Alexandre through StrictMode and RouterProvider at /?seller=alexandre', async () => {
    mockSellersFetch()
    window.history.replaceState({}, '', '/?seller=alexandre')
    vi.resetModules()
    const { AppRoot } = await import('./main')
    render(<AppRoot />)
    expect(await screen.findByText('Catálogo Alexandre')).toBeDefined()
  })

  it('shows the incomplete-link sentence at / without a seller', async () => {
    mockSellersFetch()
    window.history.replaceState({}, '', '/')
    vi.resetModules()
    const { AppRoot } = await import('./main')
    render(<AppRoot />)
    expect(
      await screen.findByText('Este link está incompleto ou o vendedor não existe.'),
    ).toBeDefined()
  })

  it('renders the watch page top bar at /relogio/:slug', async () => {
    mockSellersFetch()
    window.history.replaceState({}, '', '/relogio/seculus-kit?seller=alexandre')
    vi.resetModules()
    const { AppRoot } = await import('./main')
    render(<AppRoot />)
    expect(await screen.findByText('Catálogo Alexandre')).toBeDefined()
    expect(screen.getByRole('link', { name: 'Voltar' })).toBeDefined()
  })

  it('switches the theme from the page top bar using the single ThemeProvider in AppRoot', async () => {
    mockSellersFetch()
    window.history.replaceState({}, '', '/?seller=alexandre')
    vi.resetModules()
    const { AppRoot } = await import('./main')
    render(<AppRoot />)
    expect(await screen.findByText('Catálogo Alexandre')).toBeDefined()
    expect(screen.getAllByRole('button', { name: /Usar tema/ })).toHaveLength(1)
  })
})
