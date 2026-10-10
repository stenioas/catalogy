import { discountPercent, formatBrl } from '@catalogo/shared'

import { Badge } from '@/components/ui/badge'

export type PriceBlockProps = {
  price: number
  listPrice?: number
}

const currentPriceClassName = 'text-xl font-semibold'

export function PriceBlock({ price, listPrice }: PriceBlockProps) {
  const currentLabel = formatBrl(price)

  if (listPrice === undefined) {
    return (
      <div data-testid="price-block">
        <span data-testid="price-current" className={currentPriceClassName}>
          {currentLabel}
        </span>
      </div>
    )
  }

  const percent = discountPercent(price, listPrice)
  const showBadge = percent >= 1

  return (
    <div data-testid="price-block" className="flex flex-col items-start gap-0.5">
      <span
        data-testid="price-list"
        className="text-base text-ink-muted-48 line-through"
      >
        De {formatBrl(listPrice)}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <span data-testid="price-current" className={currentPriceClassName}>
          {currentLabel}
        </span>
        {showBadge ? (
          <Badge
            data-testid="price-badge"
            className="rounded-full bg-primary-tint-background text-sm font-medium text-primary-tint-foreground"
          >
            −{percent}%
          </Badge>
        ) : null}
      </div>
    </div>
  )
}
