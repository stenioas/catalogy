import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const clientRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

describe('app entry (CAT-20)', () => {
  it('loads main.tsx from index.html as the Vite module entry', () => {
    const html = readFileSync(join(clientRoot, 'index.html'), 'utf-8')
    expect(html).toMatch(
      /<script[^>]+type="module"[^>]+src="\/src\/main\.tsx"/,
    )
  })

  it('renders the catalog route through StrictMode and RouterProvider', async () => {
    window.history.replaceState({}, '', '/?seller=alexandre')
    vi.resetModules()
    const { AppRoot } = await import('./main')
    render(<AppRoot />)
    expect(await screen.findByTestId('catalog-route')).toBeDefined()
  })

  it('renders the watch route at /relogio/:slug', async () => {
    window.history.replaceState({}, '', '/relogio/seculus-kit?seller=alexandre')
    vi.resetModules()
    const { AppRoot } = await import('./main')
    render(<AppRoot />)
    expect(await screen.findByTestId('watch-route')).toBeDefined()
  })
})
