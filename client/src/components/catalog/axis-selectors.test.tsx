import { listingByPath, type Listing, type Product } from '@catalogo/shared'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AxisSelectors } from './axis-selectors'

const img = 'watch.jpg'

function variant(price: number, extras: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    axes: [],
    mainImage: img,
    price,
    ...extras,
  }
}

function listingFixture(overrides: Record<string, unknown> = {}): Listing {
  return {
    id: 'item',
    state: 'new',
    availabilityStatus: 'on_order',
    images: [img, 'b.jpg'],
    variants: [
      variant(20, {
        mainImage: 'b.jpg',
        axes: [
          { axisId: 'color', valueId: 'preto' },
          { axisId: 'size', valueId: 'm' },
        ],
      }),
      variant(30, {
        orderable: false,
        mainImage: 'b.jpg',
        axes: [
          { axisId: 'color', valueId: 'azul' },
          { axisId: 'size', valueId: 'm' },
        ],
      }),
    ],
    ...overrides,
  } as Listing
}

function axisProduct(): Product {
  return {
    slug: 'axis-ui',
    title: 'Eixos',
    axes: [
      {
        id: 'color',
        label: 'Cor',
        values: [
          { id: 'preto', value: 'Preto' },
          { id: 'azul', value: 'Azul' },
        ],
      },
      {
        id: 'size',
        label: 'Tamanho',
        values: [
          { id: 'p', value: 'P' },
          { id: 'm', value: 'M' },
        ],
      },
    ],
    listings: [listingFixture()],
  }
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('AxisSelectors (VAR-68, VAR-75, VAR-76)', () => {
  it('shows each option label as the axis value text (VAR-68)', () => {
    const product = axisProduct()
    const view = listingByPath([product], product.slug, 'item', 'preto,m')
    if (view.missing) throw new Error('expected open listing')

    render(
      <AxisSelectors selectors={view.selectors} activeV="preto,m" onSelect={() => {}} />,
    )

    const root = screen.getByTestId('axis-selectors')
    const groups = within(root).getAllByTestId('axis-selector-group')
    const color = groups.find((node) => node.getAttribute('data-axis-id') === 'color')
    expect(color).toBeDefined()
    expect(within(color!).getByRole('button', { name: 'Preto' })).toBeTruthy()
    expect(within(color!).getByRole('button', { name: 'Azul' })).toBeTruthy()

    const sizeGroup = groups.find((node) => node.getAttribute('data-axis-id') === 'size')
    expect(sizeGroup).toBeDefined()
    expect(within(sizeGroup!).getByRole('button', { name: 'P' })).toBeTruthy()
    expect(within(sizeGroup!).getByRole('button', { name: 'M' })).toBeTruthy()
  })

  it('keeps an impossible combination visible and disabled (VAR-75)', () => {
    const product = axisProduct()
    const view = listingByPath([product], product.slug, 'item', 'preto,m')
    if (view.missing) throw new Error('expected open listing')

    render(
      <AxisSelectors selectors={view.selectors} activeV="preto,m" onSelect={() => {}} />,
    )

    const p = screen.getByRole('button', { name: 'P' })
    expect(p.hasAttribute('disabled')).toBe(true)
    expect(p.getAttribute('data-disabled')).toBe('true')
  })

  it('keeps an unavailable combination clickable, dimmed, with dashed border (VAR-76)', () => {
    const product = axisProduct()
    const view = listingByPath([product], product.slug, 'item', 'preto,m')
    if (view.missing) throw new Error('expected open listing')

    const onSelect = vi.fn()
    render(<AxisSelectors selectors={view.selectors} activeV="preto,m" onSelect={onSelect} />)

    const azul = screen.getByRole('button', { name: 'Azul' })
    expect(azul.hasAttribute('disabled')).toBe(false)
    expect(azul.getAttribute('data-unavailable')).toBe('true')
    expect(azul.className).toMatch(/border-dashed/)
    expect(azul.className).toMatch(/opacity-60/)

    fireEvent.click(azul)
    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect).toHaveBeenCalledWith('azul,m')
  })
})
