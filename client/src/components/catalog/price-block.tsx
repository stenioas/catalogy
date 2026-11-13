import { creditInstallmentLabel, discountPercent, formatBrl } from '@catalogo/shared'

import { Badge } from '@/components/ui/badge'

export type PriceBlockProps = {
  price: number
  listPrice?: number
  wrapListPriceOnMobile?: boolean
  showcase?: boolean
}

const currentPriceClassName = 'text-2xl font-semibold'

export const ON_ORDER_PRICE_NOTE = 'Preço sob consulta'

export function OnOrderPriceNote({ showcase = false }: { showcase?: boolean }) {
  return (
    <p
      data-testid="consult-label"
      className={
        showcase
          ? 'm-0 text-xs font-medium leading-snug text-destructive md:font-display md:text-sm md:font-semibold'
          : 'm-0 font-display text-[15px] font-semibold leading-snug text-destructive md:text-base'
      }
    >
      {ON_ORDER_PRICE_NOTE}
    </p>
  )
}

export function PriceBlock({
  price,
  listPrice,
  wrapListPriceOnMobile = false,
  showcase = false,
}: PriceBlockProps) {
  const currentLabel = formatBrl(price)
  const installmentLabel = creditInstallmentLabel(price)

  const percent = listPrice === undefined ? 0 : discountPercent(price, listPrice)
  const showBadge = percent >= 1
  const priceRow = listPrice === undefined ? 'row-start-1' : 'row-start-2'
  const installmentRow = listPrice === undefined ? 'row-start-2' : 'row-start-3'

  if (showcase) {
    return (
      <div
        data-testid="price-block"
        className="grid w-full min-w-0 grid-cols-[auto_auto_auto] items-center justify-start gap-x-1.5 gap-y-0.5"
      >
        {listPrice !== undefined ? (
          <span
            data-testid="price-list"
            className="row-start-1 text-xs text-ink-muted-48 line-through md:text-sm"
          >
            De {formatBrl(listPrice)}
          </span>
        ) : null}
        {showBadge ? (
          <Badge
            data-testid="price-badge"
            className="col-start-2 row-start-1 h-auto rounded-[4px] bg-primary-tint-background px-1.5 py-0 text-[11px] font-medium text-primary-tint-foreground"
          >
            −{percent}%
          </Badge>
        ) : null}
        <span
          data-testid="price-current"
          className={`col-start-1 text-base font-semibold md:text-xl ${priceRow}`}
        >
          {currentLabel}
        </span>
        <span
          data-testid="price-pix"
          className={`col-start-2 text-xs text-muted-foreground md:text-sm ${priceRow}`}
        >
          no pix
        </span>
        <span
          data-testid="price-installments"
          className={`col-span-3 min-w-0 whitespace-normal text-xs text-muted-foreground md:text-sm ${installmentRow}`}
        >
          {installmentLabel}
        </span>
      </div>
    )
  }

  return (
    <div data-testid="price-block" className="flex w-full min-w-0 flex-col items-start gap-0.5">
      {listPrice !== undefined ? (
        <div
          className={
            wrapListPriceOnMobile
              ? 'flex flex-wrap items-center gap-2 whitespace-normal md:flex-nowrap md:whitespace-nowrap'
              : 'flex flex-nowrap items-center gap-2 whitespace-nowrap'
          }
        >
          <span
            data-testid="price-list"
            className="text-sm text-ink-muted-48 line-through"
          >
            De {formatBrl(listPrice)}
          </span>
          {showBadge ? (
            <Badge
              data-testid="price-badge"
              className="rounded-[4px] bg-primary-tint-background text-xs font-medium text-primary-tint-foreground"
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
      <span data-testid="price-installments" className="min-w-0 whitespace-normal text-sm text-muted-foreground">
        {installmentLabel}
      </span>
    </div>
  )
}
