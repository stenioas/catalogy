import type { Product } from '@catalogo/shared'

import { Badge } from '@/components/ui/badge'

export function ProductStateBadge({ state, className = '' }: { state: Product['state']; className?: string }) {
  return (
    <Badge
      data-testid="state-badge"
      className={`h-auto rounded-full px-2.5 py-0.5 text-sm font-semibold ${
        state === 'Novo'
          ? 'bg-product-state-new text-product-state-new-foreground'
          : 'bg-product-state-neutral text-product-state-neutral-foreground'
      } ${className}`}
    >
      {state}
    </Badge>
  )
}

export function ProductAvailabilityBadge({ availability }: { availability: Product['availability'] }) {
  return (
    <Badge
      data-testid="availability-badge"
      variant="outline"
      className="h-auto rounded-full px-2.5 py-0.5 text-sm font-medium"
    >
      {availability}
    </Badge>
  )
}

export function ProductBadges({ product }: { product: Pick<Product, 'state' | 'availability'> }) {
  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <ProductStateBadge state={product.state} />
      <ProductAvailabilityBadge availability={product.availability} />
    </div>
  )
}
