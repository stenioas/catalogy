import type { Product } from '@catalogo/shared'
import { cn } from 'cn'
import { Gift } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

const compactBadgeClassName = 'h-5 px-1.5 py-0 text-xs leading-none font-medium'
const badgeRadiusClassName = 'rounded-[4px]'

export function UnmissableOfferBadge({ className = '' }: { className?: string }) {
  return (
    <Badge
      data-testid="unmissable-offer"
      className={cn(
        badgeRadiusClassName,
        'tracking-wide uppercase',
        compactBadgeClassName,
        'bg-primary text-primary-foreground',
        className,
      )}
      >
      <Gift aria-hidden="true" className="size-3" />
      OFERTA IMPERDÍVEL
    </Badge>
  )
}

export function ProductStateBadge({
  state,
  compact = false,
  className = '',
}: {
  state: Product['state']
  compact?: boolean
  className?: string
}) {
  const tone = state === 'Novo'
    ? 'bg-product-state-new text-product-state-new-foreground'
    : 'bg-product-state-neutral text-product-state-neutral-foreground'

  return (
    <Badge
      data-testid="state-badge"
      className={cn(
        'h-auto rounded-full font-semibold',
        compact ? compactBadgeClassName : 'px-2.5 py-0.5 text-sm',
        tone,
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
    className: 'bg-availability-available text-availability-available-foreground',
  },
  on_order: {
    label: 'Sob encomenda',
    className: 'bg-availability-on-order text-availability-on-order-foreground',
  },
  unavailable: {
    label: 'Indisponível',
    className: 'bg-availability-unavailable text-availability-unavailable-foreground',
  },
  sold_out: {
    label: 'Esgotado',
    className: 'bg-availability-sold-out text-availability-sold-out-foreground',
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
      className={cn(
        'h-auto border-0 font-medium',
        badgeRadiusClassName,
        compact ? compactBadgeClassName : 'px-2.5 py-0.5 text-sm',
        presentation.className,
        className,
      )}
    >
      {presentation.label}
    </Badge>
  )
}

export function ProductConditionLine({
  state,
  availabilityStatus,
}: {
  state: Product['state']
  availabilityStatus: Product['availabilityStatus']
}) {
  return (
    <p data-testid="product-condition" className="m-0 flex flex-wrap items-center gap-1.5 text-xs leading-none text-muted-foreground">
      <span data-testid="state-label">{state}</span>
      <ProductAvailabilityBadge availabilityStatus={availabilityStatus} compact />
    </p>
  )
}
