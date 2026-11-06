import { ProductSchema, resolveVariant, variantQueue, type Listing, type Product } from '@catalogo/shared'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { buildVariantStripItems, VariantStrip } from './variant-strip'
import { productImageSrc } from './watch-card'

const colorSizeAxes: Product['axes'] = [
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
]

function variant(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    axes: [
      { axisId: 'color', valueId: 'preto' },
      { axisId: 'size', valueId: 'm' },
    ],
    price: 20,
    mainImage: 'preto-m.webp',
    ...overrides,
  }
}

function productFrom(
  axes: Product['axes'],
  listing: Record<string, unknown>,
  slug = 'strip-test',
): Product {
  return ProductSchema.parse({
    slug,
    title: 'Strip',
    axes,
    listings: [listing],
  })
}

function multiVariantProduct(): { product: Product; listing: Listing } {
  const product = productFrom(colorSizeAxes, {
    id: 'item',
    state: 'new',
    availabilityStatus: 'on_order',
    images: ['preto-m.webp', 'azul-m.webp', 'azul-p.webp'],
    variants: [
      variant({
        orderable: false,
        price: 99,
        mainImage: 'azul-p.webp',
        axes: [
          { axisId: 'color', valueId: 'azul' },
          { axisId: 'size', valueId: 'p' },
        ],
      }),
      variant({ price: 20, mainImage: 'preto-m.webp' }),
      variant({
        price: 30,
        mainImage: 'azul-m.webp',
        axes: [
          { axisId: 'color', valueId: 'azul' },
          { axisId: 'size', valueId: 'm' },
        ],
      }),
    ],
  })
  return { product, listing: product.listings[0]! }
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('VariantStrip (VAR-86, VAR-87, VAR-88, VAR-96)', () => {
  it('lists each variant mainImage in queue order (VAR-86)', () => {
    const { product, listing } = multiVariantProduct()
    const queueOrder = variantQueue(listing).map((item) => item.mainImage)
    const items = buildVariantStripItems(product, listing, 'preto,m')

    render(<VariantStrip slug={product.slug} items={items} onSelect={() => {}} />)

    const strip = screen.getByTestId('variant-strip')
    const buttons = within(strip).getAllByTestId('variant-strip-item')
    const srcs = buttons.map((button) => button.querySelector('img')?.getAttribute('src') ?? null)
    expect(srcs).toEqual(queueOrder.map((file) => productImageSrc(product.slug, file)))
  })

  it('marks the active variant (VAR-86)', () => {
    const { product, listing } = multiVariantProduct()
    const items = buildVariantStripItems(product, listing, 'azul,m')

    render(<VariantStrip slug={product.slug} items={items} onSelect={() => {}} />)

    const pressed = screen.getAllByTestId('variant-strip-item').filter(
      (node) => node.getAttribute('aria-pressed') === 'true',
    )
    expect(pressed).toHaveLength(1)
    expect(pressed[0]!.querySelector('img')?.getAttribute('src')).toBe(
      productImageSrc(product.slug, 'azul-m.webp'),
    )
  })

  it('selects the variant when its photo is activated (VAR-88)', () => {
    const { product, listing } = multiVariantProduct()
    const items = buildVariantStripItems(product, listing, 'preto,m')
    const onSelect = vi.fn()

    render(<VariantStrip slug={product.slug} items={items} onSelect={onSelect} />)

    const buttons = screen.getAllByTestId('variant-strip-item')
    fireEvent.click(buttons[1]!)
    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect).toHaveBeenCalledWith('azul,m')
  })

  it('omits the strip when the listing has one variant (VAR-87)', () => {
    const product = productFrom(colorSizeAxes, {
      id: 'solo',
      state: 'new',
      availabilityStatus: 'available',
      images: ['only.webp'],
      variants: [variant({ mainImage: 'only.webp' })],
    })
    const listing = product.listings[0]!
    const items = buildVariantStripItems(product, listing, 'preto,m')

    const { container } = render(
      <VariantStrip slug={product.slug} items={items} onSelect={() => {}} />,
    )
    expect(container.firstChild).toBeNull()
    expect(screen.queryByTestId('variant-strip')).toBeNull()
  })

  it('keeps a non-orderable strip image dimmed with a dashed border (VAR-96)', () => {
    const { product, listing } = multiVariantProduct()
    const items = buildVariantStripItems(product, listing, 'preto,m')

    render(<VariantStrip slug={product.slug} items={items} onSelect={() => {}} />)

    const unavailable = variantQueue(listing).find((item) => item.orderable === false)
    expect(unavailable).toBeDefined()
    const target = screen
      .getAllByTestId('variant-strip-item')
      .find(
        (node) =>
          node.querySelector('img')?.getAttribute('src') ===
          productImageSrc(product.slug, unavailable!.mainImage),
      )
    expect(target).toBeDefined()
    expect(target?.className).toMatch(/border-dashed/)
    expect(target?.className).toMatch(/opacity-60/)
  })

  it('buildVariantStripItems tracks resolveVariant for the active flag', () => {
    const { product, listing } = multiVariantProduct()
    const activeV = 'azul,p'
    const active = resolveVariant(listing, activeV)
    const items = buildVariantStripItems(product, listing, activeV)
    const activeItems = items.filter((item) => item.active)
    expect(activeItems).toHaveLength(1)
    expect(activeItems[0]!.imageFile).toBe(active.mainImage)
  })
})
