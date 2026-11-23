import type { Listing, Product, Variant } from '../schemas/product.ts'
import {
  effectiveAvailability,
  effectiveState,
  variantKey,
} from './variant-condition.ts'

type SourceListing = Listing & {
  state?: NonNullable<Variant['state']>
  availabilityStatus?: NonNullable<Variant['availabilityStatus']>
}

const availabilityPriority = {
  available: 0,
  coming_soon: 1,
  on_order: 2,
} as const

function sourceAvailability(listing: SourceListing): NonNullable<Variant['availabilityStatus']> {
  return listing.availabilityStatus ?? 'on_order'
}

function mergedVariant(listing: SourceListing, variant: Variant): Variant {
  const { offers: _legacyOffers, ...variantWithoutOffers } = variant as Variant & {
    offers?: unknown
  }
  return {
    ...variantWithoutOffers,
    state: variant.state ?? listing.state ?? effectiveState(variant),
    availabilityStatus:
      variant.availabilityStatus ?? listing.availabilityStatus ?? effectiveAvailability(variant),
  }
}

export function mergeListings(product: Product): Product {
  const sourceListings = product.listings as SourceListing[]
  const hasEnabledListing = sourceListings.some((listing) => listing.enabled !== false)
  const prioritizedListings = sourceListings
    .filter((listing) => !hasEnabledListing || listing.enabled !== false)
    .map((listing, sourceIndex) => ({ listing, sourceIndex }))
    .sort((left, right) => {
      const priority =
        availabilityPriority[sourceAvailability(left.listing)] -
        availabilityPriority[sourceAvailability(right.listing)]
      return priority || left.sourceIndex - right.sourceIndex
    })
    .map(({ listing }) => listing)

  const images = [...new Set(prioritizedListings.flatMap((listing) => listing.images))]
  const variants: Variant[] = []
  const seen = new Set<string>()

  for (const listing of prioritizedListings) {
    for (const sourceVariant of listing.variants) {
      const variant = mergedVariant(listing, sourceVariant)
      const key = variantKey(product, variant)
      if (!seen.has(key)) {
        seen.add(key)
        variants.push(variant)
      }
    }
  }

  const specifications = prioritizedListings.find(
    (listing) => listing.specifications !== undefined,
  )?.specifications

  return {
    ...product,
    listings: [
      {
        id: 'main-listing',
        ...(hasEnabledListing ? {} : { enabled: false }),
        images,
        ...(specifications === undefined ? {} : { specifications }),
        variants,
      },
    ],
  }
}
