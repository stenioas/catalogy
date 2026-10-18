import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { creditInstallmentLabel } from '@catalogo/shared'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  applyThemeClass,
  THEME_STORAGE_KEY,
  ThemeProvider,
} from '../theme-provider'
import { PriceBlock } from './price-block'

const clientRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..')

function themeInlineBlock(css: string): string {
  const start = css.indexOf('@theme inline')
  const open = css.indexOf('{', start)
  const close = css.indexOf('}', open)
  if (start < 0 || open < 0 || close < 0) {
    return ''
  }
  return css.slice(open + 1, close)
}

function rootBlock(css: string): string {
  const match = css.match(/:root\s*\{([\s\S]*?)\}\s*\n\s*\.dark/)
  return match?.[1] ?? ''
}

function darkBlock(css: string): string {
  const match = css.match(/\.dark\s*\{([\s\S]*?)\}\s*\n\s*@theme/)
  return match?.[1] ?? ''
}

function renderPriceBlock(
  props: { price: number; listPrice?: number; wrapListPriceOnMobile?: boolean; showcase?: boolean },
  theme: 'light' | 'dark' = 'light',
) {
  applyThemeClass(theme)
  return render(
    <ThemeProvider>
      <PriceBlock {...props} />
    </ThemeProvider>,
  )
}

describe('PriceBlock (CAT-99–CAT-109)', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('shows the current price without a reference price when listPrice is absent (CAT-99)', () => {
    renderPriceBlock({ price: 369.9 })
    expect(screen.getByTestId('price-current').textContent).toBe('R$ 369,90')
    expect(screen.queryByTestId('price-list')).toBeNull()
    expect(screen.queryByTestId('price-badge')).toBeNull()
  })

  it.each([undefined, 450, 370])('shows the shared installment message below the price with listPrice %s', (listPrice) => {
    renderPriceBlock({ price: 369.9, listPrice })
    const current = screen.getByTestId('price-current')
    const installments = screen.getByTestId('price-installments')
    expect(installments.textContent).toBe(creditInstallmentLabel(369.9))
    expect(screen.getByTestId('price-block').contains(installments)).toBe(true)
    expect(current.compareDocumentPosition(installments) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0)
  })

  it.each([undefined, 450])('labels the current price as no pix with listPrice %s', (listPrice) => {
    renderPriceBlock({ price: 369.9, listPrice })
    const current = screen.getByTestId('price-current')
    const pix = screen.getByTestId('price-pix')
    expect(pix.textContent).toBe('no pix')
    expect(pix.parentElement).toBe(current.parentElement)
    expect(current.compareDocumentPosition(pix) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0)
    expect(pix.compareDocumentPosition(screen.getByTestId('price-installments')) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0)
  })

  it('places the upright discount badge beside the reference price above the current price', () => {
    renderPriceBlock({ price: 369.9, listPrice: 450 })
    const badge = screen.getByTestId('price-badge')
    const reference = screen.getByTestId('price-list')
    const current = screen.getByTestId('price-current')
    expect(badge.parentElement).toBe(reference.parentElement)
    expect(badge.compareDocumentPosition(current) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0)
    expect(badge.className).not.toMatch(/rotate/)
  })

  it('shows De R$ 450,00 struck and −17% for list 450 and price 369.9 (CAT-100, CAT-101)', () => {
    renderPriceBlock({ price: 369.9, listPrice: 450 })
    expect(screen.getByTestId('price-list').textContent).toBe('De R$ 450,00')
    expect(screen.getByTestId('price-current').textContent).toBe('R$ 369,90')
    expect(screen.getByTestId('price-badge').textContent).toBe('−17%')
  })

  it('formats 1234.5 as R$ 1.234,50 in the block (CAT-96)', () => {
    renderPriceBlock({ price: 1234.5 })
    expect(screen.getByTestId('price-current').textContent).toBe('R$ 1.234,50')
  })

  it('keeps the struck reference but hides the badge when discount is below 1% (CAT-102, CAT-103)', () => {
    renderPriceBlock({ price: 446.01, listPrice: 450 })
    expect(screen.getByTestId('price-list').textContent).toBe('De R$ 450,00')
    expect(screen.queryByTestId('price-badge')).toBeNull()
  })

  it('styles the struck reference with ink-muted-48 (CAT-104)', () => {
    renderPriceBlock({ price: 369.9, listPrice: 450 })
    const struck = screen.getByTestId('price-list')
    expect(struck.className).toMatch(/\btext-ink-muted-48\b/)
    expect(struck.className).toMatch(/\bline-through\b/)
  })

  it('renders the discount seal as Badge with primary-tint when discount is at least 1% (SV-41, CAT-105, CAT-108, CAT-109)', () => {
    renderPriceBlock({ price: 369.9, listPrice: 450 })
    const badge = screen.getByTestId('price-badge')
    expect(badge.getAttribute('data-slot')).toBe('badge')
    expect(badge.className).toMatch(/\btext-primary-tint-foreground\b/)
    expect(badge.className).toMatch(/\bbg-primary-tint-background\b/)
    expect(badge.className).toMatch(/rounded-\[4px\]/)
    expect(badge.className).not.toMatch(/\brounded-full\b/)
    expect(badge.className).not.toMatch(/green|red|emerald|rose/i)
  })

  it('does not render a discount seal when listPrice is absent (SV-41)', () => {
    const { container } = renderPriceBlock({ price: 369.9 })
    expect(screen.queryByTestId('price-badge')).toBeNull()
    expect(container.querySelector('[data-slot="badge"]')).toBeNull()
  })

  it('allows the reference price and discount to wrap only when compact behavior is enabled', () => {
    renderPriceBlock({ price: 369.9, listPrice: 450, wrapListPriceOnMobile: true })
    const row = screen.getByTestId('price-list').parentElement

    expect(row?.className).toMatch(/\bflex-wrap\b/)
    expect(row?.className).toMatch(/\bwhitespace-normal\b/)
    expect(row?.className).toMatch(/\bmd:flex-nowrap\b/)
    expect(row?.className).toMatch(/\bmd:whitespace-nowrap\b/)
  })

  it('places a small upright discount beside the current price on the mobile showcase and restores it beside the reference price from md', () => {
    renderPriceBlock({ price: 369.9, listPrice: 450, showcase: true })
    const list = screen.getByTestId('price-list')
    const badge = screen.getByTestId('price-badge')
    const current = screen.getByTestId('price-current')
    const installments = screen.getByTestId('price-installments')

    expect(list.className.split(/\s+/)).toEqual(expect.arrayContaining(['col-span-3', 'text-xs', 'md:text-sm', 'md:row-start-1']))
    expect(current.className.split(/\s+/)).toEqual(expect.arrayContaining(['text-base', 'md:text-xl', 'row-start-2']))
    expect(badge.className.split(/\s+/)).toEqual(expect.arrayContaining(['col-start-2', 'row-start-2', 'text-[11px]', 'md:row-start-1']))
    expect(badge.className).not.toMatch(/rotate/)
    expect(badge.textContent).toBe('−17%')
    expect(installments.className).toMatch(/\btext-xs\b/)
    expect(installments.textContent).toBe(creditInstallmentLabel(369.9))
    expect(screen.getByTestId('price-pix').className.split(/\s+/)).toContain('col-start-3')
  })

  it('keeps the showcase current price on the first row when there is no reference price', () => {
    renderPriceBlock({ price: 369.9, showcase: true })
    expect(screen.queryByTestId('price-badge')).toBeNull()
    expect(screen.getByTestId('price-current').className.split(/\s+/)).toContain('row-start-1')
    expect(screen.getByTestId('price-pix').className.split(/\s+/)).toContain('col-start-2')
  })

  it('keeps the default reference row unchanged outside the compact card', () => {
    renderPriceBlock({ price: 369.9, listPrice: 450 })
    const row = screen.getByTestId('price-list').parentElement

    expect(row?.className).toMatch(/\bflex-nowrap\b/)
    expect(row?.className).toMatch(/\bwhitespace-nowrap\b/)
    expect(row?.className).not.toMatch(/\bflex-wrap\b/)
  })

  it('preserves the full long reference price and discount in compact mode', () => {
    renderPriceBlock({
      price: 123_456.78,
      listPrice: 123_456_789.99,
      wrapListPriceOnMobile: true,
    })

    expect(screen.getByTestId('price-list').textContent).toBe('De R$ 123.456.789,99')
    expect(screen.getByTestId('price-badge').textContent).toBe('−99%')
  })

  it('preserves the full long reference price when no discount seal is due in compact mode', () => {
    renderPriceBlock({
      price: 123_456_789.98,
      listPrice: 123_456_789.99,
      wrapListPriceOnMobile: true,
    })

    expect(screen.getByTestId('price-list').textContent).toBe('De R$ 123.456.789,99')
    expect(screen.queryByTestId('price-badge')).toBeNull()
  })

  it('uses light-theme primary-tint token values from index.css (CAT-106)', () => {
    const css = readFileSync(join(clientRoot, 'src/index.css'), 'utf-8')
    const root = rootBlock(css)
    expect(root).toMatch(
      /--primary-tint:\s*#0066cc[\s\S]*--primary-tint-background:\s*rgba\(0,\s*102,\s*204,\s*0\.12\)/,
    )
    expect(root).toMatch(
      /^\s*--primary-tint-foreground:\s*var\(--primary-tint\);$/m,
    )
    renderPriceBlock({ price: 369.9, listPrice: 450 }, 'light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('maps seal classes to their tokens inside @theme inline (CAT-104, CAT-105)', () => {
    const css = readFileSync(join(clientRoot, 'src/index.css'), 'utf-8')
    const block = themeInlineBlock(css)
    expect(block).toContain(
      '--color-primary-tint-foreground: var(--primary-tint-foreground);',
    )
    expect(block).toContain(
      '--color-primary-tint-background: var(--primary-tint-background);',
    )
    expect(block).toContain('--color-ink-muted-48: var(--ink-muted-48);')
  })

  it('uses dark-theme primary-tint token values from index.css (CAT-107)', () => {
    const css = readFileSync(join(clientRoot, 'src/index.css'), 'utf-8')
    const dark = darkBlock(css)
    expect(dark).toMatch(
      /--primary-tint:\s*#2997ff[\s\S]*--primary-tint-background:\s*rgba\(41,\s*151,\s*255,\s*0\.16\)/,
    )
    expect(dark).toMatch(
      /^\s*--primary-tint-foreground:\s*var\(--primary-tint\);$/m,
    )
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    renderPriceBlock({ price: 369.9, listPrice: 450 }, 'dark')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it.each([false, true])('paints the current price red only for an unmissable offer when showcase is %s', (showcase) => {
    renderPriceBlock({ price: 369.9, showcase, unmissableOffer: true })
    expect(screen.getByTestId('price-current').className).toMatch(/\btext-destructive\b/)
    cleanup()
    renderPriceBlock({ price: 369.9, showcase })
    expect(screen.getByTestId('price-current').className).not.toMatch(/\btext-destructive\b/)
  })
})
