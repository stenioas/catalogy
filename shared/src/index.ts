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
} from './catalog/listings.ts'
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
