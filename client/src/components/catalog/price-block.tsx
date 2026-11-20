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
  'h-auto rounded-[4px] bg-[#00A650] px-0.5 py-0 font-bold text-white'
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
          ? 'm-0 text-xs font-medium leading-snug text-destructive'
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
  const listRowClassName = showcase
    ? 'flex flex-wrap items-center gap-1.5 whitespace-normal'
    : wrapListPriceOnMobile
      ? 'flex flex-wrap items-center gap-2 whitespace-normal md:flex-nowrap md:whitespace-nowrap'
      : 'flex flex-nowrap items-center gap-2 whitespace-nowrap'

  return (
    <div data-testid="price-block" className="flex w-full min-w-0 flex-col items-start gap-0.5">
      {listPrice !== undefined ? (
        <div className={listRowClassName}>
          <span
            data-testid="price-list"
            className={
              showcase
                ? 'text-xs text-ink-muted-48 line-through'
                : 'text-sm text-ink-muted-48 line-through'
            }
          >
            {formatBrl(listPrice)}
          </span>
          {showBadge ? (
            <Badge
              data-testid="price-badge"
              className={`${showcase ? 'text-[11px]' : 'text-xs'} ${discountBadgeClassName}`}
            >
              {discountLabel}
            </Badge>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-x-1.5">
        <CurrentPrice
          label={currentLabel}
          className={
            showcase
              ? `text-[18px] font-semibold leading-none ${currentPriceTone}`
              : `${currentPriceClassName} ${currentPriceTone}`
          }
          currencyClassName={showcase ? 'text-[12px]' : 'text-[14px] mt-[2px]'}
          centsClassName={showcase ? 'text-[12px] leading-none' : 'text-[12px] leading-none mt-px'}
        />
        <span
          data-testid="price-pix"
          className={showcase ? `text-xs ${pixClassName}` : `text-sm ${pixClassName}`}
        >
          no pix
        </span>
      </div>
      <span
        data-testid="price-installments"
        className={
          showcase
            ? 'min-w-0 whitespace-normal text-xs text-muted-foreground'
            : 'min-w-0 whitespace-normal text-sm text-muted-foreground'
        }
      >
        {installmentLabel}
      </span>
    </div>
  )
}
