export {
  ProductSchema,
  SPECIFICATION_LABELS,
  isProductListed,
  type Product,
  type Listing,
  type Variant,
  type Specification,
} from './schemas/product.ts'
export {
  variantQueue,
  resolveVariant,
  canVariantRepresentCard,
  shareMessage,
  homeCards,
  filterHasCards,
  activeFilter,
  sectionHasCards,
  activeSection,
  homeEmptyText,
  listingByPath,
  listingPath,
  AVAILABILITY_LABEL,
  STATE_LABEL,
} from './catalog/listings.ts'
export type {
  CatalogCard,
  FilterId,
  ListingSelector,
  SectionId,
} from './catalog/listings.ts'
export {
  parseLabels,
  resolveLabels,
  type Label,
  type CampaignLabel,
  type OfferLabel,
  type ResolvedLabels,
  type ResolvedCampaign,
  type ResolvedOffer,
} from './catalog/labels.ts'
export { mergeListings } from './catalog/merge-listings.ts'
export { effectiveAvailability, effectiveState, variantKey } from './catalog/variant-condition.ts'
export {
  truncateReais,
  formatBrl,
  CARD_MACHINE_FEE_RATE,
  CREDIT_INSTALLMENT_COUNT,
  creditCardInstallment,
  creditInstallmentLabel,
  discountPercent,
  compareTitles,
} from './money.ts'
