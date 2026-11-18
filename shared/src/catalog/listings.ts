import { compareTitles, truncateReais } from '../money.ts'
import type { Listing, Product, Variant } from '../schemas/product.ts'
import {
  effectiveAvailability,
  effectiveState,
} from './variant-condition.ts'

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

export type VariantResolutionQuery = {
  v: string | null
  state: string | null
  availability: string | null
}

const STATE_IDS = ['new', 'openbox', 'used', 'defective'] as const
const AVAILABILITY_IDS = ['available', 'coming_soon', 'on_order'] as const

function isState(value: string | null): value is (typeof STATE_IDS)[number] {
  return STATE_IDS.some((candidate) => candidate === value)
}

function isAvailability(value: string | null): value is (typeof AVAILABILITY_IDS)[number] {
  return AVAILABILITY_IDS.some((candidate) => candidate === value)
}

/**
 * Resolves the active variant from axes, state, and availability.
 */
export function resolveVariant(
  listing: Listing,
  input: string | null | VariantResolutionQuery,
): Variant {
  const queue = variantQueue(listing)
  const original = listing.variants
  const orderedAxisIds = axisOrder(listing)
  const query = typeof input === 'object' && input !== null
    ? input
    : { v: input, state: null, availability: null }
  const v = query.v

  const vIsEmpty = v === null || v === undefined || v.trim() === ''
  const valueIds = vIsEmpty ? null : parseValueIdsFromV(v, orderedAxisIds.length)
  if (orderedAxisIds.length > 0 && valueIds !== null) {
    let candidates = original.filter((variant) =>
      variantMatchesValueIds(variant, valueIds, orderedAxisIds),
    )
    if (candidates.length > 0) {
      if (isState(query.state)) {
        const stateMatches = candidates.filter(
          (variant) => effectiveState(variant) === query.state,
        )
        if (stateMatches.length > 0) candidates = stateMatches
      }
      if (isAvailability(query.availability)) {
        const availabilityMatches = candidates.filter(
          (variant) => effectiveAvailability(variant) === query.availability,
        )
        if (availabilityMatches.length > 0) candidates = availabilityMatches
      }
      for (const availability of AVAILABILITY_IDS) {
        const winner = candidates.find(
          (variant) => effectiveAvailability(variant) === availability,
        )
        if (winner !== undefined) return winner
      }
    }
  }

  return original.every((item) => item.orderable === false) ? original[0]! : queue[0]!
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

function stateForView(listing: Listing, variant: Variant): ReturnType<typeof effectiveState> {
  const legacy = listing as Listing & { state?: ReturnType<typeof effectiveState> }
  return variant.state ?? legacy.state ?? effectiveState(variant)
}

function availabilityForView(
  listing: Listing,
  variant: Variant,
): ReturnType<typeof effectiveAvailability> {
  const legacy = listing as Listing & {
    availabilityStatus?: ReturnType<typeof effectiveAvailability>
  }
  return variant.availabilityStatus ?? legacy.availabilityStatus ?? effectiveAvailability(variant)
}

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
  price?: number
  listPrice?: number
  offers: NonNullable<Variant['offers']>
  availabilityStatus: ReturnType<typeof effectiveAvailability>
  statusLabel: string
  path: string
}

type SortableCard = CatalogCard & { listingIndex: number }

function isSectionId(value: string | null): value is SectionId {
  return SECTION_IDS.some((id) => id === value)
}

type AvailabilityStatus = ReturnType<typeof effectiveAvailability>

function availabilityForSection(section: StatusSectionId): AvailabilityStatus {
  if (section === 'coming-soon') return 'coming_soon'
  if (section === 'on-order') return 'on_order'
  return 'available'
}

function legacyListingAvailability(listing: Listing): AvailabilityStatus | undefined {
  if (!Object.hasOwn(listing, 'availabilityStatus')) return undefined
  const status = (listing as { availabilityStatus?: AvailabilityStatus }).availabilityStatus
  if (status === 'available' || status === 'coming_soon' || status === 'on_order') return status
  return undefined
}

function listingMatchesAvailability(listing: Listing, status: AvailabilityStatus): boolean {
  const legacy = legacyListingAvailability(listing)
  if (legacy !== undefined) return legacy === status
  return listing.variants.some(
    (variant) => canVariantRepresentCard(variant) && effectiveAvailability(variant) === status,
  )
}

function listingInSection(listing: Listing, section: SectionId): boolean {
  if (!canGenerateCard(listing)) return false
  if (section === 'all') {
    return listingMatchesAvailability(listing, 'available')
      || listingMatchesAvailability(listing, 'coming_soon')
  }
  return listingMatchesAvailability(listing, availabilityForSection(section))
}

/** Visible listing with at least one variant that can represent a card. */
export function canGenerateCard(listing: Listing): boolean {
  return listing.enabled !== false && listing.variants.some(canVariantRepresentCard)
}

function listingsInSection(products: Product[], section: SectionId): Listing[] {
  const found: Listing[] = []
  for (const product of products) {
    for (const listing of product.listings) {
      if (listingInSection(listing, section)) found.push(listing)
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

function orderablePricedVariants(listing: Listing): Variant[] {
  return listing.variants.filter(
    (variant) => variant.orderable !== false && variant.price !== undefined,
  )
}

function lowestPricedOrderableVariant(listing: Listing): Variant | null {
  let chosen: Variant | null = null
  for (const variant of orderablePricedVariants(listing)) {
    if (chosen === null || chosen.price === undefined || variant.price! < chosen.price) chosen = variant
  }
  return chosen
}

function pricesAreUniform(variants: Variant[]): boolean {
  const first = variants[0]?.price
  return first !== undefined && variants.every((variant) => variant.price === first)
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

function toPricedCard(
  product: Product,
  listing: Listing,
  variant: Variant,
  listingIndex: number,
  useCover: boolean,
): SortableCard {
  const card: SortableCard = {
    slug: product.slug,
    listingId: listing.id,
    title: product.title,
    image: useCover ? (listing.images[0] ?? '') : variant.mainImage,
    price: variant.price,
    offers: variant.offers ?? [],
    availabilityStatus: effectiveAvailability(variant),
    statusLabel: AVAILABILITY_LABEL[effectiveAvailability(variant)],
    path: listingPath(
      product.slug,
      listing.id,
      useCover ? [] : valueIdsInAxisOrder(product, variant),
    ),
    listingIndex,
  }
  if (variant.listPrice !== undefined) card.listPrice = variant.listPrice
  return card
}

function toUnpricedCard(
  product: Product,
  listing: Listing,
  variant: Variant,
  listingIndex: number,
): SortableCard {
  const availabilityStatus = effectiveAvailability(variant)
  return {
    slug: product.slug,
    listingId: listing.id,
    title: product.title,
    image: listing.images[0] ?? '',
    offers: [],
    availabilityStatus,
    statusLabel: AVAILABILITY_LABEL[availabilityStatus],
    path: listingPath(product.slug, listing.id, []),
    listingIndex,
  }
}

function compareCards(a: SortableCard, b: SortableCard): number {
  const byTitle = compareTitles(a.title, b.title)
  if (byTitle !== 0) return byTitle
  if (a.slug !== b.slug) return a.slug < b.slug ? -1 : 1
  return a.listingIndex - b.listingIndex
}

function hasLegacyListingCondition(products: Product[]): boolean {
  return products.some((product) =>
    product.listings.some((listing) => 'availabilityStatus' in listing),
  )
}

function legacyPricedCard(
  product: Product,
  listing: Listing,
  variant: Variant,
  listingIndex: number,
  useCover: boolean,
): SortableCard {
  const legacy = listing as Listing & {
    availabilityStatus: ReturnType<typeof effectiveAvailability>
  }
  return {
    ...toPricedCard(product, listing, variant, listingIndex, useCover),
    availabilityStatus: legacy.availabilityStatus,
    statusLabel: AVAILABILITY_LABEL[legacy.availabilityStatus],
  }
}

function legacyOnOrderCard(
  product: Product,
  listing: Listing,
  listingIndex: number,
): SortableCard {
  const legacy = listing as Listing & {
    availabilityStatus: ReturnType<typeof effectiveAvailability>
  }
  return {
    slug: product.slug,
    listingId: listing.id,
    title: product.title,
    image: listing.images[0] ?? '',
    offers: [],
    availabilityStatus: legacy.availabilityStatus,
    statusLabel: AVAILABILITY_LABEL[legacy.availabilityStatus],
    path: listingPath(product.slug, listing.id, []),
    listingIndex,
  }
}

function legacyHomeCards(products: Product[], section: string | null): CatalogCard[] {
  const resolved = activeSection(products, section)
  const cards: SortableCard[] = []
  for (const product of products) {
    product.listings.forEach((listing, listingIndex) => {
      if (!listingInSection(listing, resolved)) return
      const legacy = listing as Listing & {
        availabilityStatus: ReturnType<typeof effectiveAvailability>
      }
      if (legacy.availabilityStatus === 'on_order') {
        cards.push(legacyOnOrderCard(product, listing, listingIndex))
        return
      }
      const variant = lowestPricedOrderableVariant(listing)
      if (variant === null) return
      cards.push(
        legacyPricedCard(
          product,
          listing,
          variant,
          listingIndex,
          pricesAreUniform(orderablePricedVariants(listing)),
        ),
      )
    })
  }
  cards.sort(compareCards)
  return cards.map(({ listingIndex: _listingIndex, ...card }) => card)
}

const FILTER_IDS = ['all', 'discount', 'female', 'male', 'new', 'openbox', 'used'] as const

export type FilterId = (typeof FILTER_IDS)[number]

export function activeFilter(filter: string | null): FilterId {
  return FILTER_IDS.some((candidate) => candidate === filter) ? (filter as FilterId) : 'all'
}

function matchesDiscount(variant: Variant): boolean {
  if (
    variant.price === undefined ||
    variant.listPrice === undefined ||
    effectiveAvailability(variant) === 'on_order'
  ) {
    return false
  }
  const price = truncateReais(variant.price)
  const listPrice = truncateReais(variant.listPrice)
  return (listPrice - price) / listPrice >= 0.2
}

function variantMatchesFilter(variant: Variant, filter: FilterId): boolean {
  if (!canVariantRepresentCard(variant)) return false
  if (filter === 'discount') return matchesDiscount(variant)
  if (filter === 'new' || filter === 'openbox' || filter === 'used') {
    return effectiveState(variant) === filter
  }
  return true
}

function productMatchesFilter(product: Product, filter: FilterId): boolean {
  if (filter === 'female') {
    return product.audience === 'female' || product.audience === 'unisex'
  }
  if (filter === 'male') {
    return product.audience === 'male' || product.audience === 'unisex'
  }
  return true
}

export function homeCards(products: Product[], filter: string | null): CatalogCard[] {
  if (
    hasLegacyListingCondition(products) &&
    (filter === null || filter === 'all' || isSectionId(filter))
  ) {
    return legacyHomeCards(products, filter)
  }
  const resolved = activeFilter(filter)
  const cards: SortableCard[] = []
  for (const product of products) {
    if (!productMatchesFilter(product, resolved)) continue
    product.listings.forEach((listing, listingIndex) => {
      if (!canGenerateCard(listing)) return
      const pool = listing.variants.filter((variant) => variantMatchesFilter(variant, resolved))
      if (pool.length === 0) return
      const priced = pool.filter((variant) => variant.price !== undefined)
      if (priced.length === 0) {
        const variant = pool[0]!
        const card = toUnpricedCard(product, listing, variant, listingIndex)
        card.path = variantPath(product, listing, variant)
        cards.push(card)
        return
      }
      let variant = priced[0]!
      for (const candidate of priced.slice(1)) {
        if (candidate.price! < variant.price!) variant = candidate
      }
      const card = toPricedCard(
        product,
        listing,
        variant,
        listingIndex,
        pricesAreUniform(priced),
      )
      if (card.availabilityStatus === 'on_order') card.offers = []
      card.path = variantPath(product, listing, variant)
      cards.push(card)
    })
  }
  cards.sort(compareCards)
  return cards.map(({ listingIndex: _listingIndex, ...card }) => card)
}

export function filterHasCards(products: Product[], filter: FilterId): boolean {
  return homeCards(products, filter).length > 0
}

export const MISSING_LISTING_TEXT = 'Este relógio não está no catálogo.'

export type ListingSelectorOption = {
  valueId: string
  value: string
  disabled: boolean
  /** true when a valid combination exists but the target variant is not orderable (Indisponível) */
  unavailable: boolean
  v: string | null
  state?: ReturnType<typeof effectiveState>
  availability?: ReturnType<typeof effectiveAvailability>
  imageFile?: string
}

export type ListingSelector = {
  axisId: string
  label: string
  presentation: 'image' | 'text'
  options: ListingSelectorOption[]
}

export type OpenListingView = {
  missing: false
  listingId: string
  title: string
  state: ReturnType<typeof effectiveState>
  availability: ReturnType<typeof effectiveAvailability>
  stateLabel: string
  availabilityLabel: string
  price?: number
  listPrice?: number
  observations?: string
  offers: NonNullable<Variant['offers']>
  availabilityStatus: ReturnType<typeof effectiveAvailability>
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
      if (listingMatchesAvailability(listing, status) && canGenerateCard(listing)) return listing
    }
  }
  return null
}

function axisQuery(product: Product, variant: Variant): string | null {
  const ids = valueIdsInAxisOrder(product, variant)
  if (ids.length === 0) return null
  return ids.join(',')
}

export type VariantQuery = {
  v: string | null
  state?: ReturnType<typeof effectiveState>
  availability?: ReturnType<typeof effectiveAvailability>
}

function variantPath(product: Product, listing: Listing, variant: Variant): string {
  const query = variantQuery(product, variant)
  const params = new URLSearchParams()
  if (query.v !== null) params.set('v', query.v)
  if (query.state !== undefined) params.set('state', query.state)
  if (query.availability !== undefined) params.set('availability', query.availability)
  const queryString = params.toString().replace(/%2C/gi, ',')
  return `/product/${product.slug}/${listing.id}${queryString === '' ? '' : `?${queryString}`}`
}

export function variantQuery(product: Product, variant: Variant): VariantQuery {
  const v = axisQuery(product, variant)
  const query: VariantQuery = { v }
  const listing = product.listings.find((candidate) => candidate.variants.includes(variant))
  if (listing === undefined || v === null) return query

  const orderedAxisIds = product.axes.map((axis) => axis.id)
  const valueIds = valueIdsInAxisOrder(product, variant)
  const matches = listing.variants.filter((candidate) =>
    variantMatchesValueIds(candidate, valueIds, orderedAxisIds),
  )
  if (new Set(matches.map(effectiveState)).size > 1) {
    query.state = effectiveState(variant)
  }
  if (new Set(matches.map(effectiveAvailability)).size > 1) {
    query.availability = effectiveAvailability(variant)
  }
  return query
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

function sameAxes(left: Variant, right: Variant): boolean {
  return left.axes.every((selection) =>
    variantContains(right, selection.axisId, selection.valueId),
  )
}

function conditionSelectors(
  product: Product,
  listing: Listing,
  active: Variant,
): ListingSelector[] {
  const axisMatches = listing.variants.filter((variant) => sameAxes(variant, active))
  const selectors: ListingSelector[] = []

  if (new Set(axisMatches.map(effectiveState)).size > 1) {
    const values = STATE_IDS.filter((state) =>
      listing.variants.some((variant) => effectiveState(variant) === state),
    )
    selectors.push({
      axisId: 'variant-state',
      label: 'Estado',
      presentation: 'text',
      options: values.map((state) => {
        const landing = listing.variants.find(
          (variant) =>
            sameAxes(variant, active) &&
            effectiveState(variant) === state &&
            effectiveAvailability(variant) === effectiveAvailability(active),
        )
        return {
          valueId: state,
          value: STATE_LABEL[state],
          disabled: landing === undefined,
          unavailable: landing?.orderable === false,
          v: landing === undefined ? null : axisQuery(product, active),
          state,
        }
      }),
    })
  }

  if (new Set(axisMatches.map(effectiveAvailability)).size > 1) {
    const values = AVAILABILITY_IDS.filter((availability) =>
      listing.variants.some((variant) => effectiveAvailability(variant) === availability),
    )
    selectors.push({
      axisId: 'variant-availability',
      label: 'Disponibilidade',
      presentation: 'text',
      options: values.map((availability) => {
        const landing = listing.variants.find(
          (variant) =>
            sameAxes(variant, active) &&
            effectiveAvailability(variant) === availability &&
            effectiveState(variant) === effectiveState(active),
        )
        return {
          valueId: availability,
          value: AVAILABILITY_LABEL[availability],
          disabled: landing === undefined,
          unavailable: landing?.orderable === false,
          v: landing === undefined ? null : axisQuery(product, active),
          availability,
        }
      }),
    })
  }

  return selectors
}

function selectorsFor(
  product: Product,
  listing: Listing,
  active: Variant,
): ListingSelector[] {
  const queue = variantQueue(listing)
  const axes = product.axes.flatMap((axis) => {
    const presentation = axis.presentation ?? 'text'
    const options = axis.values.flatMap((axisValue) => {
      const landing = queue.find((variant) => variantContains(variant, axis.id, axisValue.id))
      if (landing === undefined) return []
      const possible = listing.variants.some(
        (variant) =>
          variantContains(variant, axis.id, axisValue.id) &&
          compatibleWithOtherAxes(variant, active, axis.id),
      )
      const unavailable = possible && landing.orderable === false
      const option: ListingSelectorOption = {
        valueId: axisValue.id,
        value: axisValue.value,
        disabled: !possible,
        unavailable,
        v: possible ? axisQuery(product, landing) : null,
      }
      if (presentation === 'image') option.imageFile = landing.mainImage
      return [option]
    })
    if (options.length === 0) return []
    return [
      {
        axisId: axis.id,
        label: axis.label,
        presentation,
        options,
      },
    ]
  })
  return [...axes, ...conditionSelectors(product, listing, active)]
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
  const stateLabel = STATE_LABEL[stateForView(listing, variant)]
  const availability = availabilityForView(listing, variant)
  const availabilityLabel =
    variant.orderable === false ? 'Indisponível' : AVAILABILITY_LABEL[availability]
  const query = variantQuery(product, variant)
  const params = new URLSearchParams()
  if (query.v !== null) params.set('v', query.v)
  if (query.state !== undefined) params.set('state', query.state)
  if (query.availability !== undefined) params.set('availability', query.availability)
  const queryString = params.toString().replace(/%2C/gi, ',')
  const path = `/product/${product.slug}/${listing.id}${queryString === '' ? '' : `?${queryString}`}`
  const base = origin.replace(/\/$/, '')
  return `Olá, tenho interesse no ${title}. ${stateLabel}, ${availabilityLabel}. ${base}${path}`
}

function openListing(
  product: Product,
  listing: Listing,
  query: string | null | VariantResolutionQuery,
): OpenListingView {
  const variant = resolveVariant(listing, query)
  const availability = availabilityForView(listing, variant)
  const isLegacyListing = 'availabilityStatus' in listing && variant.availabilityStatus === undefined
  const requestedV = typeof query === 'string' ? query : query?.v
  const view: OpenListingView = {
    missing: false,
    listingId: listing.id,
    title: pageTitle(product, variant),
    state: stateForView(listing, variant),
    availability,
    stateLabel: STATE_LABEL[stateForView(listing, variant)],
    availabilityLabel:
      variant.orderable === false ? 'Indisponível' : AVAILABILITY_LABEL[availability],
    offers: availability === 'on_order' && !isLegacyListing ? [] : (variant.offers ?? []),
    availabilityStatus: availability,
    productSpecifications: product.specifications ?? [],
    listingSpecifications: listing.specifications ?? [],
    images: listing.images,
    imageIndex:
      requestedV === null || requestedV === undefined || requestedV.trim() === ''
        ? 0
        : listing.images.indexOf(variant.mainImage),
    selectors: selectorsFor(product, listing, variant),
  }
  if (product.description !== undefined) view.description = product.description
  if (variant.price !== undefined) view.price = variant.price
  if (variant.listPrice !== undefined) view.listPrice = variant.listPrice
  if (variant.observations !== undefined) view.observations = variant.observations
  return view
}

export function listingByPath(
  products: Product[],
  slug: string,
  listingId: string | null,
  query: string | null | VariantResolutionQuery,
): ListingView {
  const product = products.find((item) => item.slug === slug)
  if (product === undefined) return { missing: true }

  if (listingId === null) {
    const listing = firstListingForSlug(product)
    if (listing === null) return { missing: true }
    return openListing(product, listing, query)
  }

  const listing = product.listings.find((item) => item.id === listingId)
  if (listing === undefined || listing.enabled === false) return { missing: true }
  if (listing.variants.length === 0) return { missing: true }
  return openListing(product, listing, query)
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
