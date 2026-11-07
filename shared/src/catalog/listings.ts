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

export const AUDIENCE_LABEL = {
  male: 'Masculino',
  female: 'Feminino',
  unisex: 'Unissex',
  child: 'Infantil',
} as const

export const NO_ACTIVE_LISTING_TEXT = 'Não temos nenhum anúncio ativo.'
export const NO_FILTER_MATCH_TEXT = 'Nenhum anúncio corresponde aos filtros.'

const SECTION_IDS = ['available', 'coming-soon', 'on-order'] as const
const STATE_TOKENS = ['new', 'openbox', 'used', 'defective'] as const
const AUDIENCE_TOKENS = ['male', 'female', 'unisex', 'child'] as const

export type SectionId = (typeof SECTION_IDS)[number]
type StateToken = (typeof STATE_TOKENS)[number]
type AudienceToken = (typeof AUDIENCE_TOKENS)[number]

export type FilterMarks = {
  state: string[]
  audience: string[]
  axes: Record<string, string[]>
}

export type FilterOption = {
  id: string
  label: string
}

export type FilterGroup = {
  id: string
  label: string
  options: FilterOption[]
}

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
  return value === 'available' || value === 'coming-soon' || value === 'on-order'
}

function isStateToken(value: string): value is StateToken {
  return (STATE_TOKENS as readonly string[]).includes(value)
}

function isAudienceToken(value: string): value is AudienceToken {
  return (AUDIENCE_TOKENS as readonly string[]).includes(value)
}

function availabilityForSection(section: SectionId): Listing['availabilityStatus'] {
  if (section === 'coming-soon') return 'coming_soon'
  if (section === 'on-order') return 'on_order'
  return 'available'
}

/** Visible listing with at least one variant that can represent a card. */
export function canGenerateCard(listing: Listing): boolean {
  return listing.enabled !== false && listing.variants.some(canVariantRepresentCard)
}

function listingsInSection(products: Product[], section: SectionId): Listing[] {
  const status = availabilityForSection(section)
  const found: Listing[] = []
  for (const product of products) {
    for (const listing of product.listings) {
      if (listing.availabilityStatus === status && canGenerateCard(listing)) {
        found.push(listing)
      }
    }
  }
  return found
}

export function activeSection(products: Product[], section: string | null): SectionId {
  if (isSectionId(section)) return section
  for (const candidate of SECTION_IDS) {
    if (listingsInSection(products, candidate).length > 0) return candidate
  }
  return 'available'
}

function knownAxisValueIds(products: Product[]): Map<string, Set<string>> {
  const known = new Map<string, Set<string>>()
  for (const product of products) {
    for (const axis of product.axes) {
      let ids = known.get(axis.id)
      if (ids === undefined) {
        ids = new Set()
        known.set(axis.id, ids)
      }
      for (const value of axis.values) ids.add(value.id)
    }
  }
  return known
}

function effectiveMarks(products: Product[], marks: FilterMarks): FilterMarks {
  const knownAxes = knownAxisValueIds(products)
  const axes: Record<string, string[]> = {}
  for (const [axisId, valueIds] of Object.entries(marks.axes)) {
    const known = knownAxes.get(axisId)
    if (known === undefined) continue
    const kept = valueIds.filter((id) => known.has(id))
    if (kept.length > 0) axes[axisId] = kept
  }
  return {
    state: marks.state.filter(isStateToken),
    audience: marks.audience.filter(isAudienceToken),
    axes,
  }
}

function passesVariantMarks(listing: Listing, variant: Variant, marks: FilterMarks): boolean {
  if (marks.state.length > 0 && !marks.state.includes(listing.state)) return false
  for (const [axisId, valueIds] of Object.entries(marks.axes)) {
    if (valueIds.length === 0) continue
    const selected = variant.axes.find((item) => item.axisId === axisId)?.valueId
    if (selected === undefined || !valueIds.includes(selected)) return false
  }
  return true
}

export function representativeVariant(listing: Listing, marks: FilterMarks): Variant | null {
  const candidates = variantQueue(listing).filter(
    (variant) => canVariantRepresentCard(variant) && passesVariantMarks(listing, variant, marks),
  )
  return candidates.find((variant) => variant.unmissableOffer === true) ?? candidates[0] ?? null
}

function audienceAllows(product: Product, marks: FilterMarks): boolean {
  if (marks.audience.length === 0) return true
  return product.audience !== undefined && marks.audience.includes(product.audience)
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

export function homeCards(
  products: Product[],
  section: string | null,
  marks: FilterMarks,
): CatalogCard[] {
  const resolved = activeSection(products, section)
  const marksToApply = effectiveMarks(products, marks)
  const status = availabilityForSection(resolved)
  const cards: SortableCard[] = []
  for (const product of products) {
    if (!audienceAllows(product, marksToApply)) continue
    product.listings.forEach((listing, listingIndex) => {
      if (listing.availabilityStatus !== status || !canGenerateCard(listing)) return
      const variant = representativeVariant(listing, marksToApply)
      if (variant === null) return
      cards.push(toCard(product, listing, variant, listingIndex))
    })
  }
  cards.sort(compareCards)
  return cards.map(({ listingIndex: _listingIndex, ...card }) => card)
}

type Contribution = { product: Product; listing: Listing; variants: Variant[] }

function contributions(products: Product[], section: SectionId): Contribution[] {
  const status = availabilityForSection(section)
  const rows: Contribution[] = []
  for (const product of products) {
    for (const listing of product.listings) {
      if (listing.availabilityStatus !== status || !canGenerateCard(listing)) continue
      const variants =
        section === 'on-order'
          ? listing.variants.filter((variant) => variant.orderable !== false)
          : listing.variants
      rows.push({ product, listing, variants })
    }
  }
  return rows
}

function pushGroup(groups: FilterGroup[], id: string, label: string, options: FilterOption[]): void {
  if (options.length > 1) groups.push({ id, label, options })
}

function axisValueLabel(product: Product, axisId: string, valueId: string): string | null {
  const axis = product.axes.find((item) => item.id === axisId)
  const value = axis?.values.find((item) => item.id === valueId)
  return value?.value ?? null
}

export function filterGroups(products: Product[], section: string | null): FilterGroup[] {
  const resolved = activeSection(products, section)
  const rows = contributions(products, resolved)
  const groups: FilterGroup[] = []

  const states = new Set<StateToken>()
  const audiences = new Set<AudienceToken>()
  for (const row of rows) {
    states.add(row.listing.state)
    if (row.product.audience !== undefined) audiences.add(row.product.audience)
  }
  pushGroup(
    groups,
    'state',
    'Estado',
    STATE_TOKENS.filter((token) => states.has(token)).map((id) => ({
      id,
      label: STATE_LABEL[id],
    })),
  )
  pushGroup(
    groups,
    'audience',
    'Público-alvo',
    AUDIENCE_TOKENS.filter((token) => audiences.has(token)).map((id) => ({
      id,
      label: AUDIENCE_LABEL[id],
    })),
  )

  const axisOptions = new Map<string, Map<string, string>>()
  for (const row of rows) {
    for (const variant of row.variants) {
      for (const selection of variant.axes) {
        const label = axisValueLabel(row.product, selection.axisId, selection.valueId)
        if (label === null) continue
        let values = axisOptions.get(selection.axisId)
        if (values === undefined) {
          values = new Map()
          axisOptions.set(selection.axisId, values)
        }
        if (!values.has(selection.valueId)) values.set(selection.valueId, label)
      }
    }
  }

  const axisGroups: FilterGroup[] = []
  for (const [axisId, values] of axisOptions) {
    let label = axisId
    for (const row of rows) {
      const axis = row.product.axes.find((item) => item.id === axisId)
      if (axis !== undefined) {
        label = axis.label
        break
      }
    }
    const options = [...values.entries()]
      .sort((left, right) => compareTitles(left[1], right[1]))
      .map(([id, value]) => ({ id, label: value }))
    pushGroup(axisGroups, axisId, label, options)
  }
  axisGroups.sort((left, right) => compareTitles(left.label, right.label))
  groups.push(...axisGroups)
  return groups
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
  for (const section of SECTION_IDS) {
    const status = availabilityForSection(section)
    for (const listing of product.listings) {
      if (listing.availabilityStatus === status && canGenerateCard(listing)) return listing
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

function selectorsFor(product: Product, listing: Listing, active: Variant): ListingSelector[] {
  const queue = variantQueue(listing)
  return product.axes.map((axis) => ({
    axisId: axis.id,
    label: axis.label,
    options: axis.values.map((axisValue) => {
      const possible = listing.variants.some(
        (variant) =>
          variantContains(variant, axis.id, axisValue.id) &&
          compatibleWithOtherAxes(variant, active, axis.id),
      )
      const landing = queue.find((variant) => variantContains(variant, axis.id, axisValue.id))
      const unavailable =
        possible && landing !== undefined && landing.orderable === false
      return {
        valueId: axisValue.id,
        value: axisValue.value,
        disabled: !possible,
        unavailable,
        v: possible && landing !== undefined ? variantQuery(product, landing) : null,
      }
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
  const variant = resolveVariant(listing, v)
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
    images: listing.images,
    imageIndex: listing.images.indexOf(variant.mainImage),
    selectors: selectorsFor(product, listing, variant),
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
  return openListing(product, listing, v)
}

export function homeEmptyText(
  products: Product[],
  section: string | null,
  marks: FilterMarks,
): string | null {
  const resolved = activeSection(products, section)
  if (listingsInSection(products, resolved).length === 0) {
    const anyCard = SECTION_IDS.some((candidate) => listingsInSection(products, candidate).length > 0)
    if (!anyCard && resolved === 'available') return NO_ACTIVE_LISTING_TEXT
    return null
  }
  if (homeCards(products, resolved, marks).length === 0) return NO_FILTER_MATCH_TEXT
  return null
}
