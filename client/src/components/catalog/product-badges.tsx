import { AVAILABILITY_LABEL, STATE_LABEL, type Listing } from '@catalogo/shared'
import { cn } from 'cn'
import dynamicIconImports from 'lucide-react/dynamicIconImports'
import { lazy, Suspense, type ComponentType, type SVGProps } from 'react'

import { Badge } from '@/components/ui/badge'

const compactBadgeClassName = 'h-5 px-1.5 py-0 text-xs leading-none font-medium'
const badgeRadiusClassName = 'rounded-[4px]'

export type OfferBadge = {
  text: string
  background: string
  color: string
  icon: string
}

function lucideExportNameToKebab(exportName: string): string {
  return exportName
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

function OfferIcon({ name }: { name: string }) {
  const kebab = lucideExportNameToKebab(name)
  const importer = dynamicIconImports[kebab as keyof typeof dynamicIconImports]
  if (!importer) {
    return null
  }
  const LucideIcon = lazy(
    importer as () => Promise<{ default: ComponentType<SVGProps<SVGSVGElement>> }>,
  )
  return (
    <Suspense fallback={null}>
      <LucideIcon aria-hidden="true" className="size-3" />
    </Suspense>
  )
}

export function OfferRow({ offers }: { offers: OfferBadge[] }) {
  if (offers.length === 0) {
    return null
  }

  return (
    <div data-testid="offer-row" className="flex flex-wrap items-center gap-1.5">
      {offers.map((offer) => (
        <Badge
          key={`${offer.text}-${offer.background}-${offer.color}-${offer.icon}`}
          data-testid="offer-badge"
          className={cn(
            badgeRadiusClassName,
            compactBadgeClassName,
            'border-0 font-medium',
          )}
          style={{ backgroundColor: offer.background, color: offer.color }}
        >
          <OfferIcon name={offer.icon} />
          {offer.text}
        </Badge>
      ))}
    </div>
  )
}

export function ProductStateBadge({
  state,
  compact = false,
  className = '',
}: {
  state: Listing['state']
  compact?: boolean
  className?: string
}) {
  const tone =
    state === 'new'
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
      {STATE_LABEL[state]}
    </Badge>
  )
}

const availabilityPresentation = {
  available: {
    label: AVAILABILITY_LABEL.available,
    className: 'bg-availability-available text-availability-available-foreground',
  },
  coming_soon: {
    label: AVAILABILITY_LABEL.coming_soon,
    className: 'bg-availability-coming-soon text-availability-coming-soon-foreground',
  },
  on_order: {
    label: AVAILABILITY_LABEL.on_order,
    className: 'bg-availability-on-order text-availability-on-order-foreground',
  },
} satisfies Record<Listing['availabilityStatus'], { label: string; className: string }>

export function ProductAvailabilityBadge({
  availabilityStatus,
  compact = false,
  className = '',
}: {
  availabilityStatus: Listing['availabilityStatus']
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
  state: Listing['state']
  availabilityStatus: Listing['availabilityStatus']
}) {
  return (
    <p data-testid="product-condition" className="m-0 flex flex-wrap items-center gap-1.5 text-xs leading-none text-muted-foreground">
      <span data-testid="state-label">{STATE_LABEL[state]}</span>
      <ProductAvailabilityBadge availabilityStatus={availabilityStatus} compact />
    </p>
  )
}
