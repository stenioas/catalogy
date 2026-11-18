import { creditInstallmentLabel, discountPercent, formatBrl } from '@catalogo/shared'

import { Badge } from '@/components/ui/badge'

export type PriceBlockProps = {
  price: number
  listPrice?: number
  wrapListPriceOnMobile?: boolean
  showcase?: boolean
}

const currentPriceClassName = 'text-[26px] font-semibold leading-none'
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

function CurrentPrice({
  label,
  className,
  currencyClassName,
  centsClassName,
}: {
  label: string
  className: string
  currencyClassName: string
  centsClassName: string
}) {
  const signed = label.startsWith('-')
  const currency = signed ? '-R$' : 'R$'
  const amount = label.slice(signed ? '-R$ '.length : 'R$ '.length)
  const comma = amount.indexOf(',')
  const reais = comma === -1 ? amount : amount.slice(0, comma)
  const cents = comma === -1 ? '' : amount.slice(comma + 1)

  return (
    <span
      data-testid="price-current"
      aria-label={label}
      className={`inline-flex items-start gap-x-[2px] ${className}`}
    >
      <span
        data-testid="price-currency"
        className={`leading-none text-ink-muted-80 ${currencyClassName}`}
      >
        {currency}
      </span>
      <span className="inline-flex items-start">
        <span data-testid="price-reais">{reais}</span>
        {cents !== '' ? (
          <span data-testid="price-cents" className={centsClassName}>
            {cents}
          </span>
        ) : null}
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
          className={`col-start-1 text-[18px] font-semibold leading-none ${priceRow} ${currentPriceTone}`}
          currencyClassName="text-[12px]"
          centsClassName="text-[12px] leading-none"
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
            className="text-sm text-ink-muted-48 line-through"
          >
            De {formatBrl(listPrice)}
          </span>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-x-1.5">
        <CurrentPrice
          label={currentLabel}
          className={`${currentPriceClassName} ${currentPriceTone}`}
          currencyClassName="text-[14px] mt-[2px]"
          centsClassName="text-[12px] leading-none mt-px"
        />
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
