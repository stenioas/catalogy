import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { Product } from '../schemas/product.ts'
import { ProductSchema } from '../schemas/product.ts'
import { mergeListings } from './merge-listings.ts'

type SourceListing = Product['listings'][number] & {
  state?: 'new' | 'openbox' | 'used' | 'defective'
  availabilityStatus?: 'available' | 'coming_soon' | 'on_order'
}

type SourceProduct = Omit<Product, 'listings'> & {
  listings: SourceListing[]
}

function catalogProduct(slug: string): SourceProduct {
  const url = new URL(`../../../client/public/catalog/products/${slug}/product.json`, import.meta.url)
  return JSON.parse(readFileSync(url, 'utf8')) as SourceProduct
}

function variantByValue(product: Product, valueId: string) {
  const variant = product.listings[0]?.variants.find((item) =>
    item.axes.some((axis) => axis.valueId === valueId),
  )
  expect(variant).toBeDefined()
  return variant!
}

function sourceProduct(listings: SourceListing[]): SourceProduct {
  return {
    slug: 'merge-fixture',
    title: 'Merge fixture',
    axes: [
      {
        id: 'color',
        label: 'Cor',
        values: [
          { id: 'black', value: 'Preto' },
          { id: 'blue', value: 'Azul' },
        ],
      },
    ],
    specifications: [{ label: 'Marca', value: 'Produto' }],
    listings,
  }
}

function sourceListing(
  id: string,
  availabilityStatus: SourceListing['availabilityStatus'],
  overrides: Partial<SourceListing> = {},
): SourceListing {
  return {
    id,
    availabilityStatus,
    state: 'new',
    images: [`${id}.webp`],
    variants: [
      {
        axes: [{ axisId: 'color', valueId: 'black' }],
        mainImage: `${id}.webp`,
        ...(availabilityStatus === 'on_order' ? {} : { price: 100 }),
      },
    ],
    ...overrides,
  }
}

describe('mergeListings', () => {
  it.each([
    ['addiesdive-ad2035', 'steel', 'used', 'available'],
    ['aimimo-design-air-king', 'b-no-logo', 'openbox', 'available'],
    ['addiesdive-my-h3-2qz', 'black-steel', 'used', 'available'],
  ] as const)(
    'merges the winning catalog variant for %s',
    (slug, valueId, state, availabilityStatus) => {
      const merged = mergeListings(catalogProduct(slug) as Product)
      const variant = variantByValue(merged, valueId)

      expect(merged.listings).toHaveLength(1)
      expect(merged.listings[0]?.id).toBe('main-listing')
      expect(variant.state).toBe(state)
      expect(variant.availabilityStatus).toBe(availabilityStatus)
      expect(ProductSchema.safeParse(merged).success).toBe(true)
    },
  )

  it('keeps the available SF741 variant and the variants exclusive to on-order', () => {
    const merged = mergeListings(catalogProduct('steelflier-sf741') as Product)
    const available = variantByValue(merged, 'sf741-zp')

    expect(merged.listings).toHaveLength(1)
    expect(merged.listings[0]?.id).toBe('main-listing')
    expect(available.state).toBe('openbox')
    expect(available.availabilityStatus).toBe('available')
    for (const valueId of ['sf741-kn', 'sf741-ss', 'sf741-hg', 'sf741-og', 'sf741-hr']) {
      const exclusive = variantByValue(merged, valueId)
      expect(exclusive.state).toBe('new')
      expect(exclusive.availabilityStatus).toBe('on_order')
    }
    expect(ProductSchema.safeParse(merged).success).toBe(true)
  })

  it('orders and deduplicates the gallery by source availability, not listing id', () => {
    const merged = mergeListings(
      sourceProduct([
        sourceListing('on-order', 'on_order', {
          images: ['shared.webp', 'order.webp'],
          variants: [
            {
              axes: [{ axisId: 'color', valueId: 'blue' }],
              mainImage: 'order.webp',
            },
          ],
        }),
        sourceListing('misleading-coming-soon-id', 'available', {
          state: 'openbox',
          images: ['available.webp', 'shared.webp'],
          variants: [
            {
              axes: [{ axisId: 'color', valueId: 'black' }],
              price: 100,
              mainImage: 'available.webp',
            },
          ],
        }),
        sourceListing('soon', 'coming_soon', {
          images: ['soon.webp', 'shared.webp'],
          variants: [
            {
              axes: [{ axisId: 'color', valueId: 'blue' }],
              price: 100,
              mainImage: 'soon.webp',
            },
          ],
        }),
      ]) as Product,
    )

    expect(merged.listings[0]?.images).toEqual([
      'available.webp',
      'shared.webp',
      'soon.webp',
      'order.webp',
    ])
    expect(variantByValue(merged, 'black').availabilityStatus).toBe('available')
  })

  it('keeps source order inside the same availabilityStatus', () => {
    const merged = mergeListings(
      sourceProduct([
        sourceListing('z-available', 'available'),
        sourceListing('soon', 'coming_soon'),
        sourceListing('a-available', 'available', {
          variants: [
            {
              axes: [{ axisId: 'color', valueId: 'blue' }],
              price: 110,
              mainImage: 'a-available.webp',
            },
          ],
        }),
        sourceListing('on-order', 'on_order'),
      ]) as Product,
    )

    expect(merged.listings[0]?.images).toEqual([
      'z-available.webp',
      'a-available.webp',
      'soon.webp',
      'on-order.webp',
    ])
  })

  it('drops disabled sources when any source is enabled', () => {
    const merged = mergeListings(
      sourceProduct([
        sourceListing('disabled', 'available', { enabled: false }),
        sourceListing('enabled', 'on_order', {
          variants: [
            {
              axes: [{ axisId: 'color', valueId: 'blue' }],
              mainImage: 'enabled.webp',
            },
          ],
        }),
      ]) as Product,
    )

    expect(merged.listings[0]?.enabled).toBeUndefined()
    expect(merged.listings[0]?.variants.map((variant) => variant.axes[0]?.valueId)).toEqual(['blue'])
    expect(merged.listings[0]?.images).toEqual(['enabled.webp'])
  })

  it('keeps priority variants and disables main-listing when every source is disabled', () => {
    const merged = mergeListings(
      sourceProduct([
        sourceListing('order', 'on_order', { enabled: false }),
        sourceListing('available', 'available', {
          enabled: false,
          state: 'used',
          images: ['available.webp'],
          variants: [
            {
              axes: [{ axisId: 'color', valueId: 'black' }],
              price: 90,
              mainImage: 'available.webp',
            },
          ],
        }),
      ]) as Product,
    )

    expect(merged.listings[0]?.enabled).toBe(false)
    expect(merged.listings[0]?.variants).toHaveLength(1)
    expect(merged.listings[0]?.variants[0]).toMatchObject({
      state: 'used',
      availabilityStatus: 'available',
      price: 90,
    })
  })

  it('keeps the first axes key and drops another condition on the same axes', () => {
    const firstOffers = [
      { text: 'Oferta', background: '#000000', color: '#FFFFFF', icon: 'Gift' },
    ]
    const merged = mergeListings(
      sourceProduct([
        sourceListing('first', 'available', {
          state: 'used',
          images: ['first.webp'],
          variants: [
            {
              axes: [{ axisId: 'color', valueId: 'black' }],
              state: 'used',
              availabilityStatus: 'available',
              price: 80,
              listPrice: 100,
              offers: firstOffers,
              mainImage: 'first.webp',
              observations: 'Primeira',
              orderable: true,
            },
            {
              axes: [{ axisId: 'color', valueId: 'black' }],
              state: 'openbox',
              availabilityStatus: 'available',
              price: 90,
              mainImage: 'first.webp',
            },
          ],
        }),
        sourceListing('duplicate', 'available', {
          state: 'used',
          images: ['duplicate.webp'],
          variants: [
            {
              axes: [{ axisId: 'color', valueId: 'black' }],
              price: 70,
              mainImage: 'duplicate.webp',
            },
          ],
        }),
      ]) as Product,
    )

    expect(merged.listings[0]?.variants).toHaveLength(1)
    expect(merged.listings[0]?.variants[0]).toEqual({
      axes: [{ axisId: 'color', valueId: 'black' }],
      state: 'used',
      availabilityStatus: 'available',
      price: 80,
      listPrice: 100,
      offers: firstOffers,
      mainImage: 'first.webp',
      observations: 'Primeira',
      orderable: true,
    })
  })

  it('uses listing specifications from the first prioritized source without changing the product', () => {
    const product = sourceProduct([
      sourceListing('order', 'on_order', {
        specifications: [{ label: 'Movimento', value: 'Order' }],
      }),
      sourceListing('available', 'available', {
        specifications: [{ label: 'Garantia', value: '90 dias' }],
      }),
      sourceListing('soon', 'coming_soon', {
        specifications: [{ label: 'Material do vidro', value: 'Safira' }],
      }),
    ])
    const originalProductSpecifications = structuredClone(product.specifications)
    const merged = mergeListings(product as Product)

    expect(merged.listings[0]?.specifications).toEqual([
      { label: 'Garantia', value: '90 dias' },
    ])
    expect(merged.specifications).toEqual(originalProductSpecifications)
  })
})
