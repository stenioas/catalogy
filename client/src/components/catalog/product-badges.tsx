import { AVAILABILITY_LABEL, STATE_LABEL, type Listing, type ResolvedCampaign } from '@catalogo/shared'
import { cn } from 'cn'
import { CircleCheck, PackageCheck, PackageOpen, Recycle, ShoppingBag, Van, type LucideIcon } from 'lucide-react'
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

const offerIcons = new Map<string, ComponentType<SVGProps<SVGSVGElement>>>()

function offerIcon(name: string): ComponentType<SVGProps<SVGSVGElement>> | null {
  const kebab = lucideExportNameToKebab(name)
  const cached = offerIcons.get(kebab)
  if (cached !== undefined) return cached
  const importer = dynamicIconImports[kebab as keyof typeof dynamicIconImports]
  if (!importer) return null
  const LucideIcon = lazy(
    importer as () => Promise<{ default: ComponentType<SVGProps<SVGSVGElement>> }>,
  )
  offerIcons.set(kebab, LucideIcon)
  return LucideIcon
}

function OfferIcon({ name, className = 'size-3' }: { name: string; className?: string }) {
  const LucideIcon = offerIcon(name)
  if (LucideIcon === null) return null
  return (
    <Suspense fallback={null}>
      <LucideIcon aria-hidden="true" className={className} />
    </Suspense>
  )
}

export function CampaignBadge({ campaign }: { campaign: ResolvedCampaign }) {
  return (
    <Badge
      data-testid="campaign-badge"
      className={cn(
        'rounded-tl-none! rounded-tr-[4px]! rounded-br-none! rounded-bl-none!',
        compactBadgeClassName,
        'border-0 font-medium',
      )}
      style={{ backgroundColor: campaign.background, color: campaign.color }}
    >
      <OfferIcon name={campaign.icon} />
      {campaign.shortText}
    </Badge>
  )
}

export function CampaignStripe({ campaign }: { campaign: ResolvedCampaign }) {
  return (
    <div
      data-testid="campaign-stripe"
      className={cn(
        'rounded-none',
        compactBadgeClassName,
        'sticky top-16 z-[15] flex w-full items-center justify-center gap-1 border-0 font-medium motion-safe:transition-[top] motion-safe:duration-300 motion-safe:ease-out group-has-[header[inert]]/route:top-0 md:h-6 md:text-sm',
      )}
      style={{ backgroundColor: campaign.background, color: campaign.color }}
    >
      <OfferIcon name={campaign.icon} className="size-3 md:size-3.5" />
      {campaign.text}
    </div>
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

const conditionPillClassName = 'inline-flex h-5 items-center gap-1 rounded-full px-1.5 text-xs font-medium leading-none'

const stateIcons: Partial<Record<Listing['state'], LucideIcon>> = {
  new: PackageCheck,
  used: Recycle,
  openbox: PackageOpen,
}

const availabilityIcons: Record<Listing['availabilityStatus'], LucideIcon> = {
  available: CircleCheck,
  coming_soon: Van,
  on_order: ShoppingBag,
}

function ConditionIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon aria-hidden="true" className="size-3 shrink-0" />
}

/** Usado, Openbox, Com defeito e Sob encomenda na ficha. O card da home não usa esta cor. */
export const attentionPillClassName = 'bg-orange-600 text-white'

export function statePillClassName(state: Listing['state']): string {
  return state === 'new' ? availabilityToneClassName.available : attentionPillClassName
}

export function availabilityPillClassName(
  availabilityStatus: Listing['availabilityStatus'],
  unavailable = false,
): string {
  if (unavailable) return 'bg-availability-unavailable text-availability-unavailable-foreground'
  if (availabilityStatus === 'on_order') return attentionPillClassName
  return availabilityToneClassName[availabilityStatus]
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
  return (
    <Badge
      data-testid="state-badge"
      className={cn(
        'h-auto rounded-full border-0 font-medium',
        compact ? compactBadgeClassName : 'px-2.5 py-0.5 text-sm',
        statePillClassName(state),
        className,
      )}
    >
      {STATE_LABEL[state]}
    </Badge>
  )
}

export const availabilityToneClassName = {
  available: 'bg-availability-available text-availability-available-foreground',
  coming_soon: 'bg-availability-coming-soon text-availability-coming-soon-foreground',
  on_order: 'bg-availability-on-order text-availability-on-order-foreground',
} satisfies Record<Listing['availabilityStatus'], string>

const availabilityPresentation = {
  available: {
    label: AVAILABILITY_LABEL.available,
    className: availabilityToneClassName.available,
  },
  coming_soon: {
    label: AVAILABILITY_LABEL.coming_soon,
    className: availabilityToneClassName.coming_soon,
  },
  on_order: {
    label: AVAILABILITY_LABEL.on_order,
    className: attentionPillClassName,
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
  unavailable = false,
}: {
  state: Listing['state']
  availabilityStatus: Listing['availabilityStatus']
  unavailable?: boolean
}) {
  return (
    <p data-testid="product-condition" className="m-0 flex flex-wrap items-center gap-1.5 leading-none">
      <span data-testid="state-label" className={cn(conditionPillClassName, statePillClassName(state))}>
        {stateIcons[state] ? <ConditionIcon icon={stateIcons[state]} /> : null}
        {STATE_LABEL[state]}
      </span>
      <span
        data-testid="availability-badge"
        className={cn(conditionPillClassName, availabilityPillClassName(availabilityStatus, unavailable))}
      >
        {unavailable ? null : <ConditionIcon icon={availabilityIcons[availabilityStatus]} />}
        {unavailable ? 'Indisponível' : AVAILABILITY_LABEL[availabilityStatus]}
      </span>
    </p>
  )
}
