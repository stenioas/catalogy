import { discountPercent, formatBrl } from '@catalogo/shared'

import { Badge } from '@/components/ui/badge'

export type PriceBlockProps = {
  price: number
  listPrice?: number
}

const currentPriceClassName = 'text-xl font-semibold'

export function PriceBlock({ price, listPrice }: PriceBlockProps) {
  const currentLabel = formatBrl(price)

  const percent = listPrice === undefined ? 0 : discountPercent(price, listPrice)
  const showBadge = percent >= 1

  return (
    <div data-testid="price-block" className="flex flex-col items-start gap-0.5">
      {listPrice !== undefined ? (
        <div className="flex flex-nowrap items-center gap-2 whitespace-nowrap">
          <span
            data-testid="price-list"
            className="text-base text-ink-muted-48 line-through"
          >
            De {formatBrl(listPrice)}
          </span>
          {showBadge ? (
            <Badge
              data-testid="price-badge"
              className="-rotate-[8deg] rounded-full bg-primary-tint-background text-sm font-medium text-primary-tint-foreground"
            >
              −{percent}%
            </Badge>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-wrap items-baseline gap-x-1.5">
        <span data-testid="price-current" className={currentPriceClassName}>
          {currentLabel}
        </span>
        <span data-testid="price-pix" className="text-sm text-muted-foreground">
          no pix
        </span>
      </div>
      <span data-testid="price-installments" className="text-sm text-muted-foreground">
        ou em até 12x com juros
      </span>
    </div>
  )
}
