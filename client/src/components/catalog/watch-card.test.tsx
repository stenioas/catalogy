import type { Product } from '@catalogo/shared'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { WatchCard } from './watch-card'

const sampleProduct: Product = {
  slug: 'seculus-kit-com-cantil',
  title: 'Seculus',
  price: 369.9,
  listPrice: 450,
  images: ['foto-principal.webp', 'foto-extra.jpg'],
}

function renderWatchCard(
  product: Product = sampleProduct,
  sellerSlug = 'alexandre',
  phone = '5585997689165',
) {
  return render(
    <MemoryRouter initialEntries={[`/?seller=${sellerSlug}`]}>
      <WatchCard product={product} phone={phone} sellerSlug={sellerSlug} />
    </MemoryRouter>,
  )
}

describe('WatchCard (CAT-28, CAT-52–CAT-56)', () => {
  afterEach(() => {
    cleanup()
  })

  it('requests the first image at /catalog/products/<slug>/img/<file> (CAT-28)', () => {
    renderWatchCard()
    const img = screen.getByRole('img', { name: 'Seculus' })
    expect(img.getAttribute('src')).toBe(
      '/catalog/products/seculus-kit-com-cantil/img/foto-principal.webp',
    )
  })

  it('uses object-contain in a square frame and the first images entry (CAT-52, CAT-53)', () => {
    renderWatchCard()
    const img = screen.getByRole('img', { name: 'Seculus' })
    expect(img.className).toMatch(/\bobject-contain\b/)
    const frame = img.parentElement
    expect(frame).not.toBeNull()
    expect(frame?.className).toMatch(/\baspect-square\b/)
    const backgroundTokens = frame?.className.match(/\bbg-\S+/g) ?? []
    expect(backgroundTokens.filter((token) => token !== 'bg-transparent')).toEqual([])
    expect(frame?.getAttribute('style') ?? '').not.toMatch(/background/i)
    expect(img.getAttribute('src')).toContain('foto-principal.webp')
    expect(img.getAttribute('src')).not.toContain('foto-extra.jpg')
  })

  it('aligns card text to the left (CAT-54)', () => {
    renderWatchCard()
    const textBlock = screen.getByTestId('watch-card-body')
    expect(textBlock.className).toMatch(/\btext-left\b/)
  })

  it('links the card body to /relogio/<slug> preserving seller=alexandre (CAT-55, CAT-56)', () => {
    renderWatchCard()
    const cardLink = screen.getByTestId('watch-card-link')
    expect(cardLink.getAttribute('href')).toBe(
      '/relogio/seculus-kit-com-cantil?seller=alexandre',
    )
  })

  it('shows title, price block, and Eu quero! outside the card navigation link (CAT-52)', () => {
    renderWatchCard()
    expect(screen.getByRole('heading', { name: 'Seculus' })).toBeTruthy()
    expect(screen.getByTestId('price-current').textContent).toBe('R$ 369,90')
    const wantLink = screen.getByRole('link', { name: 'Enviar no WhatsApp' })
    expect(wantLink.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/\?text=/)
    expect(screen.getByTestId('watch-card-link').contains(wantLink)).toBe(false)
  })
})
