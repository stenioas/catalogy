import type { Product } from '@catalogo/shared'

import { Badge } from '@/components/ui/badge'

export function ProductBadges({ product }: { product: Pick<Product, 'state' | 'availability'> }) {
  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <Badge
        data-testid="state-badge"
        className={`h-auto rounded-full px-2.5 py-0.5 text-sm font-semibold ${
          product.state === 'Novo'
            ? 'bg-product-state-new text-product-state-new-foreground'
            : 'bg-product-state-neutral text-product-state-neutral-foreground'
        }`}
      >
        {product.state}
      </Badge>
      <Badge
        data-testid="availability-badge"
        variant="outline"
        className="h-auto rounded-full px-2.5 py-0.5 text-sm font-medium"
      >
        {product.availability}
      </Badge>
    </div>
  )
}
