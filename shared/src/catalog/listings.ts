import { compareTitles } from '../money.ts'
import type { Listing, Product, Variant } from '../schemas/product.ts'

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

export const AVAILABILITY_LABEL = {
  available: 'Disponível',
  coming_soon: 'Chega em breve',
  on_order: 'Sob encomenda',
} as const

export const STATE_LABEL = {
  new: 'Novo',
  openbox: 'Openbox',
  used: 'Usado',
  defective: 'Com defeito',
} as const

export const NO_ACTIVE_LISTING_TEXT = 'Não temos nenhum anúncio ativo.'

const STATUS_SECTION_IDS = ['available', 'coming-soon', 'on-order'] as const

type StatusSectionId = (typeof STATUS_SECTION_IDS)[number]

const SECTION_IDS = ['all', ...STATUS_SECTION_IDS] as const

export type SectionId = (typeof SECTION_IDS)[number]

export type CatalogCard = {
  slug: string
  listingId: string
  title: string
  image: string
  price: number
  listPrice?: number
  unmissableOffer: boolean
  statusLabel: string
  path: string
}

type SortableCard = CatalogCard & { listingIndex: number }

function isSectionId(value: string | null): value is SectionId {
  return SECTION_IDS.some((id) => id === value)
}

function availabilityForSection(section: StatusSectionId): Listing['availabilityStatus'] {
  if (section === 'coming-soon') return 'coming_soon'
  if (section === 'on-order') return 'on_order'
  return 'available'
}

function listingInSection(listing: Listing, section: SectionId): boolean {
  if (!canGenerateCard(listing)) return false
  if (section === 'all') return true
  return listing.availabilityStatus === availabilityForSection(section)
}

function variantKey(product: Product, variant: Variant): string {
  return valueIdsInAxisOrder(product, variant).join(',')
}

function coveredVariantKeys(product: Product): Set<string> {
  const keys = new Set<string>()
  for (const listing of product.listings) {
    if (listing.enabled === false) continue
    if (listing.availabilityStatus !== 'available' && listing.availabilityStatus !== 'coming_soon') continue
    for (const variant of listing.variants) {
      if (!canVariantRepresentCard(variant)) continue
      keys.add(variantKey(product, variant))
    }
  }
  return keys
}

/**
 * On-order rendering hides a variant that the same product already sells
 * as available or coming soon. The catalog file is left unchanged.
 */
export function listingForDisplay(product: Product, listing: Listing): Listing {
  if (listing.availabilityStatus !== 'on_order') return listing
  const covered = coveredVariantKeys(product)
  if (covered.size === 0) return listing
  const variants = listing.variants.filter((variant) => !covered.has(variantKey(product, variant)))
  if (variants.length === listing.variants.length) return listing
  return { ...listing, variants }
}

/** Visible listing with at least one variant that can represent a card. */
export function canGenerateCard(listing: Listing): boolean {
  return listing.enabled !== false && listing.variants.some(canVariantRepresentCard)
}

function listingsInSection(products: Product[], section: SectionId): Listing[] {
  const found: Listing[] = []
  for (const product of products) {
    for (const listing of product.listings) {
      const shown = listingForDisplay(product, listing)
      if (listingInSection(shown, section)) found.push(shown)
    }
  }
  return found
}

export function sectionHasCards(products: Product[], section: SectionId): boolean {
  return listingsInSection(products, section).length > 0
}

export function activeSection(products: Product[], section: string | null): SectionId {
  void products
  if (isSectionId(section)) return section
  return 'all'
}

function representativeVariant(listing: Listing): Variant | null {
  const candidates = variantQueue(listing).filter((variant) => canVariantRepresentCard(variant))
  return candidates.find((variant) => variant.unmissableOffer === true) ?? candidates[0] ?? null
}

export function listingPath(slug: string, listingId: string, valueIds: string[]): string {
  const base = `/product/${slug}/${listingId}`
  if (valueIds.length === 0) return base
  return `${base}?v=${valueIds.join(',')}`
}

function valueIdsInAxisOrder(product: Product, variant: Variant): string[] {
  if (product.axes.length === 0) return []
  return product.axes.map((axis) => {
    const selected = variant.axes.find((item) => item.axisId === axis.id)
    return selected?.valueId ?? ''
  })
}

function toCard(
  product: Product,
  listing: Listing,
  variant: Variant,
  listingIndex: number,
): SortableCard {
  const card: SortableCard = {
    slug: product.slug,
    listingId: listing.id,
    title: product.title,
    image: variant.mainImage,
    price: variant.price,
    unmissableOffer: variant.unmissableOffer === true,
    statusLabel: AVAILABILITY_LABEL[listing.availabilityStatus],
    path: listingPath(product.slug, listing.id, valueIdsInAxisOrder(product, variant)),
    listingIndex,
  }
  if (variant.listPrice !== undefined) card.listPrice = variant.listPrice
  return card
}

function compareCards(a: SortableCard, b: SortableCard): number {
  const byTitle = compareTitles(a.title, b.title)
  if (byTitle !== 0) return byTitle
  if (a.slug !== b.slug) return a.slug < b.slug ? -1 : 1
  return a.listingIndex - b.listingIndex
}

export function homeCards(products: Product[], section: string | null): CatalogCard[] {
  const resolved = activeSection(products, section)
  const cards: SortableCard[] = []
  for (const product of products) {
    product.listings.forEach((listing, listingIndex) => {
      const shown = listingForDisplay(product, listing)
      if (!listingInSection(shown, resolved)) return
      const variant = representativeVariant(shown)
      if (variant === null) return
      cards.push(toCard(product, shown, variant, listingIndex))
    })
  }
  cards.sort(compareCards)
  return cards.map(({ listingIndex: _listingIndex, ...card }) => card)
}

export const MISSING_LISTING_TEXT = 'Este relógio não está no catálogo.'

export type ListingSelectorOption = {
  valueId: string
  value: string
  disabled: boolean
  /** true when a valid combination exists but the target variant is not orderable (Indisponível) */
  unavailable: boolean
  v: string | null
}

export type ListingSelector = {
  axisId: string
  label: string
  options: ListingSelectorOption[]
}

export type OpenListingView = {
  missing: false
  listingId: string
  title: string
  stateLabel: string
  availabilityLabel: string
  price: number
  listPrice?: number
  observations?: string
  unmissableOffer: boolean
  description?: string
  productSpecifications: NonNullable<Product['specifications']>
  listingSpecifications: NonNullable<Listing['specifications']>
  images: string[]
  imageIndex: number
  selectors: ListingSelector[]
}

export type ListingView = { missing: true } | OpenListingView

function firstListingForSlug(product: Product): Listing | null {
  for (const section of STATUS_SECTION_IDS) {
    const status = availabilityForSection(section)
    for (const listing of product.listings) {
      const shown = listingForDisplay(product, listing)
      if (listing.availabilityStatus === status && canGenerateCard(shown)) return shown
    }
  }
  return null
}

function variantQuery(product: Product, variant: Variant): string | null {
  const ids = valueIdsInAxisOrder(product, variant)
  if (ids.length === 0) return null
  return ids.join(',')
}

function variantContains(variant: Variant, axisId: string, valueId: string): boolean {
  return variant.axes.some((item) => item.axisId === axisId && item.valueId === valueId)
}

function compatibleWithOtherAxes(variant: Variant, active: Variant, axisId: string): boolean {
  return active.axes.every((selection) => {
    if (selection.axisId === axisId) return true
    return variantContains(variant, selection.axisId, selection.valueId)
  })
}

function selectorsFor(
  product: Product,
  source: Listing,
  listing: Listing,
  active: Variant,
): ListingSelector[] {
  const queue = variantQueue(listing)
  return product.axes.map((axis) => ({
    axisId: axis.id,
    label: axis.label,
    options: axis.values.flatMap((axisValue) => {
      const onSource = source.variants.some((variant) =>
        variantContains(variant, axis.id, axisValue.id),
      )
      const onShown = listing.variants.some((variant) =>
        variantContains(variant, axis.id, axisValue.id),
      )
      if (onSource && !onShown) return []
      const possible = listing.variants.some(
        (variant) =>
          variantContains(variant, axis.id, axisValue.id) &&
          compatibleWithOtherAxes(variant, active, axis.id),
      )
      const landing = queue.find((variant) => variantContains(variant, axis.id, axisValue.id))
      const unavailable =
        possible && landing !== undefined && landing.orderable === false
      return [{
        valueId: axisValue.id,
        value: axisValue.value,
        disabled: !possible,
        unavailable,
        v: possible && landing !== undefined ? variantQuery(product, landing) : null,
      }]
    }),
  }))
}

function pageTitle(product: Product, variant: Variant): string {
  const parts = [product.title]
  for (const axis of product.axes) {
    const selectedId = variant.axes.find((item) => item.axisId === axis.id)?.valueId
    const axisValue = axis.values.find((item) => item.id === selectedId)
    if (axisValue !== undefined) parts.push(axisValue.alias ?? axisValue.value)
  }
  return parts.join(' ')
}

/**
 * WhatsApp share sentence and absolute URL for a listing variant (VAR-74, VAR-80, VAR-81).
 * Uses the same page title, state label and availability line as the listing page (VAR-50).
 */
export function shareMessage(
  product: Product,
  listing: Listing,
  variant: Variant,
  origin: string,
): string {
  const title = pageTitle(product, variant)
  const stateLabel = STATE_LABEL[listing.state]
  const availabilityLabel =
    variant.orderable === false ? 'Indisponível' : AVAILABILITY_LABEL[listing.availabilityStatus]
  const path = listingPath(product.slug, listing.id, valueIdsInAxisOrder(product, variant))
  const base = origin.replace(/\/$/, '')
  return `Olá, tenho interesse no ${title}. ${stateLabel}, ${availabilityLabel}. ${base}${path}`
}

function openListing(product: Product, listing: Listing, v: string | null): OpenListingView {
  const source = product.listings.find((item) => item.id === listing.id) ?? listing
  const shown = listingForDisplay(product, source)
  const variant = resolveVariant(shown, v)
  const view: OpenListingView = {
    missing: false,
    listingId: listing.id,
    title: pageTitle(product, variant),
    stateLabel: STATE_LABEL[listing.state],
    availabilityLabel:
      variant.orderable === false ? 'Indisponível' : AVAILABILITY_LABEL[listing.availabilityStatus],
    price: variant.price,
    unmissableOffer: variant.unmissableOffer === true,
    productSpecifications: product.specifications ?? [],
    listingSpecifications: listing.specifications ?? [],
    images: shown.images,
    imageIndex: shown.images.indexOf(variant.mainImage),
    selectors: selectorsFor(product, source, shown, variant),
  }
  if (product.description !== undefined) view.description = product.description
  if (variant.listPrice !== undefined) view.listPrice = variant.listPrice
  if (variant.observations !== undefined) view.observations = variant.observations
  return view
}

export function listingByPath(
  products: Product[],
  slug: string,
  listingId: string | null,
  v: string | null,
): ListingView {
  const product = products.find((item) => item.slug === slug)
  if (product === undefined) return { missing: true }

  if (listingId === null) {
    const listing = firstListingForSlug(product)
    if (listing === null) return { missing: true }
    return openListing(product, listing, v)
  }

  const listing = product.listings.find((item) => item.id === listingId)
  if (listing === undefined || listing.enabled === false) return { missing: true }
  const shown = listingForDisplay(product, listing)
  if (shown.variants.length === 0) return { missing: true }
  return openListing(product, shown, v)
}

export function homeEmptyText(products: Product[], section: string | null): string | null {
  const resolved = activeSection(products, section)
  if (listingsInSection(products, resolved).length > 0) return null
  const anyCard = STATUS_SECTION_IDS.some(
    (candidate) => listingsInSection(products, candidate).length > 0,
  )
  if (!anyCard) return NO_ACTIVE_LISTING_TEXT
  return null
}
