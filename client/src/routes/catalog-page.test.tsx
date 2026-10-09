import type { Product, Seller } from '@catalogo/shared'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { CatalogPage } from './catalog-page'

const alexandre: Seller = {
  slug: 'alexandre',
  name: 'Alexandre',
  phone: '5585997689165',
}

const manuela: Seller = {
  slug: 'manuela',
  name: 'Manuela',
  phone: '5585996043447',
}

function makeProduct(slug: string, title: string): Product {
  return {
    slug,
    title,
    price: 100,
    images: ['foto.webp'],
  }
}

const { mockProductsRef } = vi.hoisted(() => ({
  mockProductsRef: { current: [] as Product[] },
}))

vi.mock('../catalog/products.generated', () => ({
  get products() {
    return mockProductsRef.current
  },
}))

function renderCatalogPage(seller: Seller = alexandre) {
  return render(
    <MemoryRouter initialEntries={[`/?seller=${seller.slug}`]}>
      <CatalogPage seller={seller} />
    </MemoryRouter>,
  )
}

describe('CatalogPage (CAT-43, CAT-48, CAT-49–CAT-51, CAT-121, CAT-122)', () => {
  afterEach(() => {
    cleanup()
    mockProductsRef.current = []
  })

  beforeEach(() => {
    mockProductsRef.current = []
  })

  it('lists Addiesdive, then CURREN, then Seculus by Portuguese title order (CAT-48, AC19)', () => {
    mockProductsRef.current = [
      makeProduct('seculus-watch', 'Seculus'),
      makeProduct('addiesdive-watch', 'Addiesdive'),
      makeProduct('curren-watch', 'CURREN'),
    ]
    renderCatalogPage()
    const headings = screen.getAllByRole('heading', { level: 2 })
    expect(headings.map((node) => node.textContent)).toEqual([
      'Addiesdive',
      'CURREN',
      'Seculus',
    ])
  })

  it('uses one, two, and three grid columns at the md and lg breakpoints (CAT-49–CAT-51, AC20–22)', () => {
    mockProductsRef.current = [makeProduct('only-one', 'Only')]
    renderCatalogPage()
    const grid = screen.getByTestId('catalog-grid')
    expect(grid.className).toMatch(/\bgrid-cols-1\b/)
    expect(grid.className).toMatch(/\bmd:grid-cols-2\b/)
    expect(grid.className).toMatch(/\blg:grid-cols-3\b/)
  })

  it('shows the empty vitrine copy and keeps Catálogo {name} in the top bar (CAT-121, CAT-122, AC6–7)', () => {
    mockProductsRef.current = []
    renderCatalogPage(manuela)
    expect(screen.getByText('Catálogo Manuela')).toBeDefined()
    expect(screen.getByText('A vitrine ainda não tem relógios.')).toBeDefined()
    expect(screen.queryByTestId('catalog-grid')).toBeNull()
  })

  it('places the empty state inside the shared catalog column (CAT-43, AC14)', () => {
    mockProductsRef.current = []
    renderCatalogPage()
    const column = screen.getByTestId('catalog-page-column')
    expect(column.classList.contains('catalog-column')).toBe(true)
    expect(within(column).getByText('A vitrine ainda não tem relógios.')).toBeDefined()
  })

  it('places the product grid inside the shared catalog column (CAT-43, AC14)', () => {
    mockProductsRef.current = [makeProduct('one', 'One')]
    renderCatalogPage()
    const column = screen.getByTestId('catalog-page-column')
    expect(column.classList.contains('catalog-column')).toBe(true)
    expect(within(column).getByTestId('catalog-grid')).toBeDefined()
  })

  it('preserves stable title order when the source list is already sorted (CAT-47, AC18)', () => {
    mockProductsRef.current = [
      makeProduct('a', 'Addiesdive'),
      makeProduct('b', 'CURREN'),
      makeProduct('c', 'Seculus'),
    ]
    renderCatalogPage()
    const firstPass = screen.getAllByRole('heading', { level: 2 }).map((n) => n.textContent)
    cleanup()
    mockProductsRef.current = [
      makeProduct('a', 'Addiesdive'),
      makeProduct('b', 'CURREN'),
      makeProduct('c', 'Seculus'),
    ]
    renderCatalogPage()
    const secondPass = screen.getAllByRole('heading', { level: 2 }).map((n) => n.textContent)
    expect(secondPass).toEqual(firstPass)
    expect(secondPass).toEqual(['Addiesdive', 'CURREN', 'Seculus'])
  })
})
