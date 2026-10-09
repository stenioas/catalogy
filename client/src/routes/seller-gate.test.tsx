import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Seller } from '@catalogo/shared'

import { loadSellers } from '../catalog/sellers'
import { SellerGate } from './seller-gate'

const SELLER_ERROR = 'Este link está incompleto ou o vendedor não existe.'

vi.mock('../catalog/sellers', () => ({
  loadSellers: vi.fn(),
}))

const sellersFixture: Seller[] = [
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

function renderGate(sellerQuery: string | null) {
  return render(
    <SellerGate sellerQuery={sellerQuery}>
      {(seller) => (
        <>
          <ul data-testid="watch-grid">
            <li>{seller.name}</li>
          </ul>
          <a href="https://wa.me/">Eu quero!</a>
        </>
      )}
    </SellerGate>,
  )
}

describe('SellerGate (CAT-30–CAT-35, CAT-149)', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.mocked(loadSellers).mockResolvedValue(sellersFixture)
  })

  it('shows the seller error when the URL has no seller query (CAT-30)', async () => {
    renderGate(null)
    const message = await screen.findByText(SELLER_ERROR)
    expect(message.textContent).toBe(SELLER_ERROR)
    expect(message.closest('.catalog-column')).not.toBeNull()
  })

  it('shows the seller error when seller is Alexandre with wrong slug casing (CAT-149, CAT-33, CAT-34, CAT-35)', async () => {
    renderGate('Alexandre')
    const message = await screen.findByText(SELLER_ERROR)
    expect(message.textContent).toBe(SELLER_ERROR)
    expect(message.closest('.catalog-column')).not.toBeNull()
    expect(screen.queryByTestId('watch-grid')).toBeNull()
    expect(screen.queryByRole('link', { name: 'Eu quero!' })).toBeNull()
  })

  it('does not list watches or show Eu quero! in the error state (CAT-31, CAT-32, CAT-34, CAT-35)', async () => {
    renderGate(null)
    await screen.findByText(SELLER_ERROR)
    expect(screen.queryByTestId('watch-grid')).toBeNull()
    expect(screen.queryByRole('link', { name: 'Eu quero!' })).toBeNull()
  })

  it('shows the seller error when sellers.json cannot be loaded (design: fetch failure)', async () => {
    vi.mocked(loadSellers).mockRejectedValue(new Error('network'))
    renderGate('alexandre')
    expect(await screen.findByText(SELLER_ERROR)).toBeDefined()
    expect(screen.queryByTestId('watch-grid')).toBeNull()
  })
})
