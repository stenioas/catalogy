import type { Product, Variant } from '../schemas/product.ts'

type VariantCondition = Variant & {
  state?: 'new' | 'openbox' | 'used' | 'defective'
  availabilityStatus?: 'available' | 'coming_soon' | 'on_order'
}

export function effectiveState(variant: VariantCondition): NonNullable<VariantCondition['state']> {
  return variant.state ?? 'new'
}

export function effectiveAvailability(
  variant: VariantCondition,
): NonNullable<VariantCondition['availabilityStatus']> {
  return variant.availabilityStatus ?? 'on_order'
}

export function variantKey(product: Product, variant: VariantCondition): string {
  const axes = product.axes
    .map((axis) => {
      const selected = variant.axes.find((item) => item.axisId === axis.id)
      return `${axis.id}:${selected?.valueId}`
    })
    .join('|')

  return axes
}
