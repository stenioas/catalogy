import { afterEach, describe, expect, it, vi } from 'vitest'

import { loadSellers } from './sellers'

const validPayload = [
  {
    slug: 'alexandre',
    name: 'Alexandre',
    phone: '5585997689165',
  },
  {
    slug: 'manuela',
    name: 'Manuela',
    phone: '5585996043447',
  },
]

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('loadSellers (CAT-29)', () => {
  it('requests exactly /catalog/sellers.json and returns validated sellers', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => validPayload,
    }))
    vi.stubGlobal('fetch', fetchMock)

    const sellers = await loadSellers()

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledWith('/catalog/sellers.json')
    expect(sellers).toEqual(validPayload)
  })

  it('rejects when the response body fails SellerSchema', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => [{ slug: 'Alexandre', name: 'X', phone: '5585997689165' }],
      })),
    )

    await expect(loadSellers()).rejects.toThrow(
      'sellers.json failed the shared contract',
    )
  })
})
