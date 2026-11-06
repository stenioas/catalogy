import type { Listing, Variant } from '../schemas/product'

/**
 * Puts every variant with orderable: false at the end, preserving relative order
 * within the orderable and non-orderable groups (VAR-69).
 */
export function variantQueue(listing: Listing): Variant[] {
  const orderable: Variant[] = []
  const notOrderable: Variant[] = []
  for (const item of listing.variants) {
    if (item.orderable === false) {
      notOrderable.push(item)
    } else {
      orderable.push(item)
    }
  }
  return [...orderable, ...notOrderable]
}

/** A variant with orderable: false cannot represent a catalog card (VAR-39). */
export function canVariantRepresentCard(variant: Variant): boolean {
  return variant.orderable !== false
}

function axisOrder(listing: Listing): string[] {
  const first = listing.variants[0]
  if (first === undefined || first.axes.length === 0) {
    return []
  }
  return first.axes.map((selection) => selection.axisId)
}

function variantMatchesValueIds(
  variant: Variant,
  valueIds: string[],
  orderedAxisIds: string[],
): boolean {
  const byAxis = new Map(variant.axes.map((a) => [a.axisId, a.valueId]))
  return orderedAxisIds.every((axisId, i) => byAxis.get(axisId) === valueIds[i])
}

function parseValueIdsFromV(v: string, axisCount: number): string[] | null {
  const parts = v.split(',').map((part) => part.trim())
  if (parts.length !== axisCount || parts.some((p) => p.length === 0)) {
    return null
  }
  return parts
}

function findVariantForV(queue: Variant[], v: string, orderedAxisIds: string[]): Variant | null {
  if (orderedAxisIds.length === 0) {
    return null
  }
  const valueIds = parseValueIdsFromV(v, orderedAxisIds.length)
  if (valueIds === null) {
    return null
  }
  return queue.find((variant) => variantMatchesValueIds(variant, valueIds, orderedAxisIds)) ?? null
}

/**
 * Resolves the active variant from the listing and the `v` query (VAR-69–VAR-72).
 * Invalid or absent `v` opens the first variant in queue order, except when every
 * variant is non-orderable: then the first variant of the original array is used.
 */
export function resolveVariant(listing: Listing, v: string | null): Variant {
  const queue = variantQueue(listing)
  const original = listing.variants
  const orderedAxisIds = axisOrder(listing)

  const vIsEmpty = v === null || v === undefined || v.trim() === ''

  const hasAxes = orderedAxisIds.length > 0
  let resolved: Variant | null = null
  if (hasAxes && !vIsEmpty) {
    resolved = findVariantForV(queue, v!, orderedAxisIds)
  }

  if (resolved !== null) {
    return resolved
  }

  const everyNonOrderable = original.every((item) => item.orderable === false)
  if (everyNonOrderable && original[0] !== undefined) {
    return original[0]
  }

  return queue[0]!
}
