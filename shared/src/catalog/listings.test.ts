import { describe, expect, it } from 'vitest'
import type { Listing } from '../schemas/product'
import {
  canVariantRepresentCard,
  resolveVariant,
  variantQueue,
} from './listings'

const img = 'watch.jpg'

function listingWithVariants(
  variants: Listing['variants'],
  overrides: Partial<Pick<Listing, 'availabilityStatus'>> = {},
): Listing {
  return {
    id: 'listing',
    state: 'new',
    availabilityStatus: overrides.availabilityStatus ?? 'available',
    images: [img],
    variants,
  }
}

describe('variantQueue', () => {
  it('moves orderable: false variants to the end while keeping relative order in each group', () => {
    const listing = listingWithVariants(
      [
        {
          axes: [],
          price: 1,
          mainImage: img,
          orderable: false,
        },
        {
          axes: [],
          price: 2,
          mainImage: img,
        },
        {
          axes: [],
          price: 3,
          mainImage: img,
          orderable: false,
        },
        {
          axes: [],
          price: 4,
          mainImage: img,
        },
      ],
      { availabilityStatus: 'on_order' },
    )

    const queue = variantQueue(listing)
    expect(queue.map((v) => v.price)).toEqual([2, 4, 1, 3])
  })
})

describe('resolveVariant', () => {
  it('opens the first variant in queue order when v is missing', () => {
    const listing = listingWithVariants([
      {
        axes: [{ axisId: 'color', valueId: 'a' }],
        price: 10,
        mainImage: img,
      },
      {
        axes: [{ axisId: 'color', valueId: 'b' }],
        price: 20,
        mainImage: img,
      },
    ])
    expect(resolveVariant(listing, null).price).toBe(10)
    expect(resolveVariant(listing, '').price).toBe(10)
    expect(resolveVariant(listing, '   ').price).toBe(10)
  })

  it('opens the first variant in queue order when v does not match any variant of the listing', () => {
    const listing = listingWithVariants([
      {
        axes: [{ axisId: 'color', valueId: 'a' }],
        price: 10,
        mainImage: img,
      },
      {
        axes: [{ axisId: 'color', valueId: 'b' }],
        price: 20,
        mainImage: img,
      },
    ])
    expect(resolveVariant(listing, 'x').price).toBe(10)
    expect(resolveVariant(listing, 'a,b').price).toBe(10)
  })

  it('when every variant is orderable false and v is invalid, opens the first variant of the original array', () => {
    const listing = listingWithVariants(
      [
        {
          axes: [],
          price: 1,
          mainImage: img,
          orderable: false,
        },
        {
          axes: [],
          price: 2,
          mainImage: img,
          orderable: false,
        },
      ],
      { availabilityStatus: 'on_order' },
    )
    expect(resolveVariant(listing, null).price).toBe(1)
    expect(resolveVariant(listing, 'bad').price).toBe(1)
  })

  it('when v names a valid combination, opens that variant even if orderable is false', () => {
    const listing = listingWithVariants(
      [
        {
          axes: [{ axisId: 'color', valueId: 'a' }],
          price: 10,
          mainImage: img,
        },
        {
          axes: [{ axisId: 'color', valueId: 'b' }],
          price: 20,
          mainImage: img,
          orderable: false,
        },
      ],
      { availabilityStatus: 'on_order' },
    )
    expect(resolveVariant(listing, 'b').price).toBe(20)
  })
})

describe('canVariantRepresentCard', () => {
  it('returns false only when orderable is false', () => {
    expect(
      canVariantRepresentCard({
        axes: [],
        price: 1,
        mainImage: img,
      }),
    ).toBe(true)
    expect(
      canVariantRepresentCard({
        axes: [],
        price: 1,
        mainImage: img,
        orderable: true,
      }),
    ).toBe(true)
    expect(
      canVariantRepresentCard({
        axes: [],
        price: 1,
        mainImage: img,
        orderable: false,
      }),
    ).toBe(false)
  })
})
