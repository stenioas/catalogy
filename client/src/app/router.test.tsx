import { render, screen } from '@testing-library/react'
import { createMemoryRouter, matchRoutes, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { appRoutes, catalogLoader, watchLoader } from './router'

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

  it('renders the catalog route at /', async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/?seller=alexandre'],
    })
    render(<RouterProvider router={router} />)
    expect(await screen.findByTestId('catalog-route')).toBeDefined()
  })

  it('renders the watch route at /relogio/:slug', async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/relogio/seculus?seller=alexandre'],
    })
    render(<RouterProvider router={router} />)
    expect(await screen.findByTestId('watch-route')).toBeDefined()
  })
})
