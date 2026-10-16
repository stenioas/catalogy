import type { Product } from '@catalogo/shared'
import { cn } from 'cn'

import { Badge } from '@/components/ui/badge'

const compactBadgeClassName = 'h-5 px-1.5 py-0 text-xs leading-none font-medium'

export function ProductStateBadge({
  state,
  compact = false,
  className = '',
}: {
  state: Product['state']
  compact?: boolean
  className?: string
}) {
  return (
    <Badge
      data-testid="state-badge"
      className={cn(
        'h-auto rounded-full font-semibold',
        compact ? compactBadgeClassName : 'px-2.5 py-0.5 text-sm',
        state === 'Novo'
          ? 'bg-product-state-new text-product-state-new-foreground'
          : 'bg-product-state-neutral text-product-state-neutral-foreground',
        className,
      )}
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

export function ProductAvailabilityBadge({
  availabilityStatus,
  compact = false,
  className = '',
}: {
  availabilityStatus: Product['availabilityStatus']
  compact?: boolean
  className?: string
}) {
  const presentation = availabilityPresentation[availabilityStatus]

  return (
    <Badge
      data-testid="availability-badge"
      variant="outline"
      className={cn(
        'h-auto rounded-full font-medium',
        compact ? compactBadgeClassName : 'px-2.5 py-0.5 text-sm',
        presentation.className,
        className,
      )}
    >
      {presentation.label}
    </Badge>
  )
}
