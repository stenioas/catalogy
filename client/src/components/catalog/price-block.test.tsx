import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

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
  props: { price: number; listPrice?: number },
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

  it('shows only the current price when listPrice is absent (CAT-99)', () => {
    renderPriceBlock({ price: 369.9 })
    expect(screen.getByTestId('price-current').textContent).toBe('R$ 369,90')
    expect(screen.queryByTestId('price-list')).toBeNull()
    expect(screen.queryByTestId('price-badge')).toBeNull()
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

  it('styles the discount badge as a primary-tint pill without green or red (CAT-105, CAT-108, CAT-109)', () => {
    renderPriceBlock({ price: 369.9, listPrice: 450 })
    const badge = screen.getByTestId('price-badge')
    expect(badge.className).toMatch(/\brounded-full\b/)
    expect(badge.className).toMatch(/\btext-primary-tint-foreground\b/)
    expect(badge.className).toMatch(/\bbg-primary-tint-background\b/)
    expect(badge.className).not.toMatch(/green|red|emerald|rose/i)
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
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
