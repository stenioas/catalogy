import { creditInstallmentLabel, discountPercent, formatBrl } from '@catalogo/shared'

import { Badge } from '@/components/ui/badge'

export type PriceBlockProps = {
  price: number
  listPrice?: number
  wrapListPriceOnMobile?: boolean
  showcase?: boolean
}

const currentPriceClassName = 'text-2xl font-semibold leading-none'
const discountBadgeClassName =
  'h-auto rounded-[4px] bg-[#00A650] p-0.5 font-bold text-white'
const pixClassName = 'font-bold text-[#00A650]'

// Temporário até a fórmula de precificação: o preço atual fica vermelho quando o desconto exibido é de 20% ou mais.
const HIGH_DISCOUNT_THRESHOLD = 20

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

function CurrentPrice({ label, className }: { label: string; className: string }) {
  const comma = label.lastIndexOf(',')
  const reais = label.slice(0, comma)
  const cents = label.slice(comma)

  return (
    <span data-testid="price-current" className={`inline-flex items-start ${className}`}>
      <span data-testid="price-reais">{reais}</span>
      <span data-testid="price-cents" className="text-[16px] leading-none">
        {cents}
      </span>
    </span>
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
  const discountLabel = `${percent}% OFF`
  const currentPriceTone = percent >= HIGH_DISCOUNT_THRESHOLD ? 'text-destructive' : ''
  const priceRow = listPrice === undefined ? 'row-start-1' : 'row-start-2'
  const installmentRow = listPrice === undefined ? 'row-start-2' : 'row-start-3'
  const pixColumn = showBadge ? 'col-start-3' : 'col-start-2'

  if (showcase) {
    return (
      <div
        data-testid="price-block"
        className="grid w-full min-w-0 grid-cols-[auto_auto_auto] items-center justify-start gap-x-1.5 gap-y-0.5"
      >
        {listPrice !== undefined ? (
          <span
            data-testid="price-list"
            className="row-start-1 text-xs text-ink-muted-48 line-through"
          >
            De {formatBrl(listPrice)}
          </span>
        ) : null}
        <CurrentPrice
          label={currentLabel}
          className={`col-start-1 text-base font-semibold leading-none md:text-xl ${priceRow} ${currentPriceTone}`}
        />
        {showBadge ? (
          <Badge
            data-testid="price-badge"
            className={`col-start-2 text-[11px] ${discountBadgeClassName} ${priceRow}`}
          >
            {discountLabel}
          </Badge>
        ) : null}
        <span
          data-testid="price-pix"
          className={`${pixColumn} text-xs md:text-sm ${pixClassName} ${priceRow}`}
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
            className="text-xs text-ink-muted-48 line-through"
          >
            De {formatBrl(listPrice)}
          </span>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-x-1.5">
        <CurrentPrice label={currentLabel} className={`${currentPriceClassName} ${currentPriceTone}`} />
        {showBadge ? (
          <Badge
            data-testid="price-badge"
            className={`text-xs ${discountBadgeClassName}`}
          >
            {discountLabel}
          </Badge>
        ) : null}
        <span data-testid="price-pix" className={`text-sm ${pixClassName}`}>
          no pix
        </span>
      </div>
      <span data-testid="price-installments" className="min-w-0 whitespace-normal text-sm text-muted-foreground">
        {installmentLabel}
      </span>
    </div>
  )
}
