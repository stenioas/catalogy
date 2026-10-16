import type { Product } from '@catalogo/shared'

import { Badge } from '@/components/ui/badge'

export function ProductStateBadge({
  state,
  compact = false,
  className = '',
}: {
  state: Product['state']
  compact?: boolean
  className?: string
}) {
  const sizeClassName = compact
    ? 'px-1.5 py-0 text-[11px] leading-none md:px-2.5 md:py-0.5 md:text-sm'
    : 'px-2.5 py-0.5 text-sm'

  return (
    <Badge
      data-testid="state-badge"
      className={`h-auto rounded-full font-semibold ${sizeClassName} ${
        state === 'Novo'
          ? 'bg-product-state-new text-product-state-new-foreground'
          : 'bg-product-state-neutral text-product-state-neutral-foreground'
      } ${className}`}
    >
      {state}
    </Badge>
  )
}

const availabilityPresentation = {
  available: {
    label: 'Em estoque',
    className: 'border-availability-available-border bg-availability-available text-availability-available-foreground',
  },
  on_order: {
    label: 'Sob encomenda',
    className: 'border-availability-on-order-border bg-availability-on-order text-availability-on-order-foreground',
  },
  unavailable: {
    label: 'Indisponível',
    className: 'border-availability-unavailable-border bg-availability-unavailable text-availability-unavailable-foreground',
  },
  sold_out: {
    label: 'Esgotado',
    className: 'border-availability-sold-out-border bg-availability-sold-out text-availability-sold-out-foreground',
  },
} satisfies Record<Product['availabilityStatus'], { label: string; className: string }>

export function ProductAvailabilityBadge({ availabilityStatus, className = '' }: { availabilityStatus: Product['availabilityStatus']; className?: string }) {
  const presentation = availabilityPresentation[availabilityStatus]

  return (
    <Badge
      data-testid="availability-badge"
      variant="outline"
      className={`h-auto rounded-full px-2.5 py-0.5 text-sm font-medium ${presentation.className} ${className}`}
    >
      {presentation.label}
    </Badge>
  )
}
