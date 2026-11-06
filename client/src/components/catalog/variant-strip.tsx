import { resolveVariant, variantQueue, type Listing, type Product, type Variant } from '@catalogo/shared'

import { cn } from '@/lib/utils'

import { productImageSrc } from './watch-card'

export type VariantStripItem = {
  v: string | null
  imageFile: string
  orderable: boolean
  active: boolean
}

function vForVariant(product: Product, variant: Variant): string | null {
  if (product.axes.length === 0) return null
  return product.axes
    .map((axis) => variant.axes.find((selection) => selection.axisId === axis.id)?.valueId ?? '')
    .join(',')
}

export function buildVariantStripItems(
  product: Product,
  listing: Listing,
  activeV: string | null,
): VariantStripItem[] {
  const queue = variantQueue(listing)
  const active = resolveVariant(listing, activeV)
  const activeIndex = queue.findIndex((candidate) => candidate === active)

  return queue.map((variant, index) => ({
    v: vForVariant(product, variant),
    imageFile: variant.mainImage,
    orderable: variant.orderable !== false,
    active: index === activeIndex,
  }))
}

export type VariantStripProps = {
  slug: string
  items: VariantStripItem[]
  onSelect: (v: string | null) => void
}

export function VariantStrip({ slug, items, onSelect }: VariantStripProps) {
  if (items.length <= 1) return null

  return (
    <div
      data-testid="variant-strip"
      className="flex w-full gap-2 overflow-x-auto py-2"
      role="toolbar"
      aria-label="Variantes"
    >
      {items.map((item, index) => (
        <button
          key={`${item.imageFile}-${index}`}
          type="button"
          data-testid="variant-strip-item"
          aria-pressed={item.active}
          onClick={() => onSelect(item.v)}
          className={cn(
            'size-16 shrink-0 overflow-hidden rounded-md border-2 p-0',
            item.orderable
              ? item.active
                ? 'border-primary ring-2 ring-primary ring-offset-1'
                : 'border-transparent opacity-100'
              : cn(
                  'border-dashed opacity-60',
                  item.active ? 'border-primary ring-2 ring-primary ring-offset-1' : 'border-muted-foreground',
                ),
          )}
        >
          <img
            src={productImageSrc(slug, item.imageFile)}
            alt=""
            className="h-full w-full object-contain"
          />
        </button>
      ))}
    </div>
  )
}
