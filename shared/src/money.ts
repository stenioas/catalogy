const titleCollator = new Intl.Collator('pt-BR')

export function truncateReais(value: number): number {
  const text = String(value)
  const dot = text.indexOf('.')
  if (dot === -1) {
    return value
  }
  const trimmed = text.slice(0, dot + 3)
  return Number(trimmed)
}

export function formatBrl(value: number): string {
  const text = String(truncateReais(value))
  const negative = text.startsWith('-')
  const unsigned = negative ? text.slice(1) : text
  const [integerPart, fractionPart = ''] = unsigned.split('.')
  const cents = `${fractionPart}00`.slice(0, 2)
  const grouped = Number.parseInt(integerPart, 10).toLocaleString('pt-BR')
  const prefix = negative ? '-R$ ' : 'R$ '
  return `${prefix}${grouped},${cents}`
}

export function discountPercent(price: number, listPrice: number): number {
  const current = truncateReais(price)
  const reference = truncateReais(listPrice)
  return Math.floor(((reference - current) / reference) * 100)
}

export function compareTitles(a: string, b: string): number {
  return titleCollator.compare(a, b)
}
