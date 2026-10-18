import { describe, expect, it } from 'vitest'
import {
  compareTitles,
  creditCardInstallment,
  creditInstallmentLabel,
  discountPercent,
  formatBrl,
  truncateReais,
} from './money'

describe('truncateReais (CAT-08, CAT-09)', () => {
  it('discards digits past the second decimal without rounding', () => {
    expect(truncateReais(369.999)).toBe(369.99)
  })

  it('keeps values that already fit two decimal places', () => {
    expect(truncateReais(369.9)).toBe(369.9)
  })

  it('truncates extra fractional digits on other amounts', () => {
    expect(truncateReais(1.239)).toBe(1.23)
  })
})

describe('formatBrl (CAT-95, CAT-96)', () => {
  it('formats 369.9 as R$ 369,90', () => {
    expect(formatBrl(369.9)).toBe('R$ 369,90')
  })

  it('formats 1234.5 with thousands separator as R$ 1.234,50', () => {
    expect(formatBrl(1234.5)).toBe('R$ 1.234,50')
  })

  it('formats a whole reais amount with ,00', () => {
    expect(formatBrl(450)).toBe('R$ 450,00')
  })
})

describe('creditCardInstallment', () => {
  it('splits the price grossed up by the 12.08% card fee into 10 installments', () => {
    expect(creditCardInstallment(369.9)).toBe(42.07)
    expect(creditInstallmentLabel(369.9)).toBe('10x R$ 42,07 no cartão')
  })

  it('keeps an exact ten-cent result when the fee divides evenly', () => {
    expect(creditCardInstallment(109.9)).toBe(12.5)
  })
})

describe('discountPercent (CAT-97, CAT-98)', () => {
  it('returns the integer percent rounded down for 369.90 over 450', () => {
    expect(discountPercent(369.9, 450)).toBe(17)
  })

  it('floors fractional percents instead of rounding up', () => {
    expect(discountPercent(445.5, 450)).toBe(1)
  })
})

describe('compareTitles (CAT-46, CAT-47, CAT-48)', () => {
  it('orders Addiesdive, CURREN, Seculus with Portuguese collation', () => {
    const titles = ['Seculus', 'Addiesdive', 'CURREN']
    expect(titles.toSorted(compareTitles)).toEqual([
      'Addiesdive',
      'CURREN',
      'Seculus',
    ])
  })

  it('orders Zeta, addiesdive and Épico by Portuguese collation, not code point (CAT-46)', () => {
    const titles = ['Zeta', 'addiesdive', 'Épico']
    expect(titles.toSorted(compareTitles)).toEqual([
      'addiesdive',
      'Épico',
      'Zeta',
    ])
  })

  it('sorts stably when titles compare equal', () => {
    const first = { id: 'a', title: 'Omega' }
    const second = { id: 'b', title: 'Omega' }
    const sorted = [second, first].sort((x, y) =>
      compareTitles(x.title, y.title),
    )
    expect(sorted.map((row) => row.id)).toEqual(['b', 'a'])
  })
})
