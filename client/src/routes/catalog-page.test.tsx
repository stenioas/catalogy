import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Product } from '@catalogo/shared'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { writeProductsModule } from '../../scripts/catalog'
import { ThemeProvider } from '../components/theme-provider'
import { CatalogPage } from './catalog-page'

const clientRoot = join(dirname(fileURLToPath(import.meta.url)), '../..')

function makeProduct(slug: string, title: string): Product {
  return {
    slug,
    title,
    price: 100,
    images: ['foto.webp'],
  }
}

const { mockProductsRef } = vi.hoisted(() => ({
  mockProductsRef: { current: [] as Product[] },
}))

vi.mock('../catalog/products.generated', () => ({
  get products() {
    return mockProductsRef.current
  },
}))

function lengthToPx(token: string): number {
  const value = token.trim()
  if (value.endsWith('px')) return Number.parseFloat(value)
  if (value.endsWith('rem')) return Number.parseFloat(value) * 16
  throw new Error(`unsupported length ${value}`)
}

function breakpointToken(name: 'md' | 'lg'): string {
  const appCss = readFileSync(join(clientRoot, 'src/index.css'), 'utf8')
  const override = appCss.match(
    new RegExp(`--breakpoint-${name}:\\s*([^;]+)`),
  )
  if (override?.[1]) return override[1]
  const theme = readFileSync(
    join(clientRoot, 'node_modules/tailwindcss/theme.css'),
    'utf8',
  )
  const fallback = theme.match(new RegExp(`--breakpoint-${name}:\\s*([^;]+)`))
  if (!fallback?.[1]) throw new Error(`missing breakpoint ${name}`)
  return fallback[1]
}

function columnCount(className: string, width: number): number {
  const md = lengthToPx(breakpointToken('md'))
  const lg = lengthToPx(breakpointToken('lg'))
  const base = className.match(/(?:^|\s)grid-cols-(\d+)\b/)
  let cols = base?.[1] ? Number(base[1]) : 0
  const rules = [...className.matchAll(/\b(md|lg):grid-cols-(\d+)\b/g)]
    .map((match) => ({
      min: match[1] === 'md' ? md : lg,
      cols: Number(match[2]),
    }))
    .sort((a, b) => a.min - b.min)
  for (const rule of rules) {
    if (width >= rule.min) cols = rule.cols
  }
  return cols
}

function productsFromModule(source: string): Product[] {
  const prefix = 'export const products = '
  return JSON.parse(source.slice(prefix.length)) as Product[]
}

function renderCatalogPage() {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={['/']}>
        <CatalogPage />
      </MemoryRouter>
    </ThemeProvider>,
  )
}

describe('CatalogPage (CAT-43, CAT-48, CAT-49–CAT-51, CAT-121, CAT-122)', () => {
  afterEach(() => {
    cleanup()
    mockProductsRef.current = []
  })

  beforeEach(() => {
    mockProductsRef.current = []
  })

  it('lists Addiesdive, then CURREN, then Seculus by Portuguese title order (CAT-48, AC19)', () => {
    mockProductsRef.current = [
      makeProduct('seculus-watch', 'Seculus'),
      makeProduct('addiesdive-watch', 'Addiesdive'),
      makeProduct('curren-watch', 'CURREN'),
    ]
    renderCatalogPage()
    const headings = screen.getAllByRole('heading', { level: 2 })
    expect(headings.map((node) => node.textContent)).toEqual([
      'Addiesdive',
      'CURREN',
      'Seculus',
    ])
  })

  it('hides a product with enabled false and keeps omitted or true', () => {
    mockProductsRef.current = [
      makeProduct('addiesdive-watch', 'Addiesdive'),
      { ...makeProduct('curren-watch', 'CURREN'), enabled: false },
      { ...makeProduct('seculus-watch', 'Seculus'), enabled: true },
    ]
    renderCatalogPage()
    expect(screen.queryByRole('heading', { name: 'CURREN' })).toBeNull()
    expect(screen.getByRole('heading', { name: 'Addiesdive' })).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Seculus' })).toBeDefined()
  })

  it('lists addiesdive, then Épico, then Zeta by Portuguese title order (CAT-46)', () => {
    mockProductsRef.current = [
      makeProduct('zeta-watch', 'Zeta'),
      makeProduct('addiesdive-watch', 'addiesdive'),
      makeProduct('epico-watch', 'Épico'),
    ]
    renderCatalogPage()
    const headings = screen.getAllByRole('heading', { level: 2 })
    expect(headings.map((node) => node.textContent)).toEqual([
      'addiesdive',
      'Épico',
      'Zeta',
    ])
  })

  it('uses one, two, and three grid columns at the md and lg breakpoints (CAT-49–CAT-51, AC20–22)', () => {
    mockProductsRef.current = [makeProduct('only-one', 'Only')]
    renderCatalogPage()
    const grid = screen.getByTestId('catalog-grid')
    expect(grid.className).toMatch(/\bgrid-cols-1\b/)
    expect(grid.className).toMatch(/\bmd:grid-cols-2\b/)
    expect(grid.className).toMatch(/\blg:grid-cols-3\b/)
    const css = readFileSync(join(clientRoot, 'src/index.css'), 'utf8')
    expect(css).not.toMatch(/html\s*\{[^}]*font-size/)
    expect(lengthToPx(breakpointToken('md'))).toBe(768)
    expect(lengthToPx(breakpointToken('lg'))).toBe(1024)
    expect(columnCount(grid.className, 767)).toBe(1)
    expect(columnCount(grid.className, 768)).toBe(2)
    expect(columnCount(grid.className, 1023)).toBe(2)
    expect(columnCount(grid.className, 1024)).toBe(3)
  })

  it('paints the page background across the full viewport width (CAT-39)', () => {
    const css = readFileSync(join(clientRoot, 'src/index.css'), 'utf8')
    const body = css.match(/(?:^|\n)body\s*\{([^}]*)\}/)?.[1]
    expect(body).toBeDefined()
    const widths = [...body!.matchAll(/width:\s*([^;]+)/g)].map((match) => match[1].trim())
    expect(widths.at(-1)).toBe('100%')
    expect(body).not.toMatch(/100vw/)
    expect(body).not.toMatch(/max-width/)
    expect(body).toMatch(/background-color:\s*var\(--background\)/)
  })

  it('centers a column at most 1120px wide with 24px of horizontal padding (CAT-40, CAT-41, CAT-42)', () => {
    const css = readFileSync(join(clientRoot, 'src/index.css'), 'utf8')
    const block = css.match(/\.catalog-column\s*\{([^}]*)\}/)?.[1]
    expect(block).toBeDefined()
    expect(block).toMatch(/max-width:\s*1120px/)
    expect(block).toMatch(/margin-inline:\s*auto/)
    expect(block).toMatch(/padding-inline:\s*24px/)
  })

  it('lists each watch in the product grid (SV-01, AC1)', () => {
    mockProductsRef.current = [
      makeProduct('alpha', 'Alpha'),
      makeProduct('beta', 'Beta'),
    ]
    renderCatalogPage()
    const grid = screen.getByTestId('catalog-grid')
    expect(within(grid).getAllByRole('heading', { level: 2 })).toHaveLength(2)
    expect(screen.getByText('Catálogo de Produtos')).toBeDefined()
  })

  it('shows the empty vitrine copy and keeps Catálogo in the top bar (SV-06, CAT-121, CAT-122, AC6–7)', () => {
    mockProductsRef.current = []
    renderCatalogPage()
    expect(screen.getByText('Catálogo de Produtos')).toBeDefined()
    expect(screen.getByText('A vitrine ainda não tem relógios.')).toBeDefined()
    expect(screen.queryByTestId('catalog-grid')).toBeNull()
  })

  it('places the empty state inside the shared catalog column (CAT-43, AC14)', () => {
    mockProductsRef.current = []
    renderCatalogPage()
    const column = screen.getByTestId('catalog-page-column')
    expect(column.classList.contains('catalog-column')).toBe(true)
    expect(within(column).getByText('A vitrine ainda não tem relógios.')).toBeDefined()
  })

  it('places the product grid inside the shared catalog column (CAT-43, AC14)', () => {
    mockProductsRef.current = [makeProduct('one', 'One')]
    renderCatalogPage()
    const column = screen.getByTestId('catalog-page-column')
    expect(column.classList.contains('catalog-column')).toBe(true)
    expect(within(column).getByTestId('catalog-grid')).toBeDefined()
  })

  it('gives the catalog main max-width 100%, min-width 0 and overflow-x clip (SV-51)', () => {
    mockProductsRef.current = [makeProduct('one', 'One')]
    renderCatalogPage()
    const main = screen.getByRole('main')
    const tokens = main.className.split(/\s+/)
    expect(tokens).toContain('max-w-full')
    expect(tokens).toContain('min-w-0')
    expect(tokens).toContain('overflow-x-clip')
    expect(main.contains(screen.getByTestId('catalog-page-column'))).toBe(true)
  })

  it('preserves stable title order when the source list is already sorted (CAT-47, AC18)', () => {
    mockProductsRef.current = [
      makeProduct('a', 'Addiesdive'),
      makeProduct('b', 'CURREN'),
      makeProduct('c', 'Seculus'),
    ]
    renderCatalogPage()
    const firstPass = screen.getAllByRole('heading', { level: 2 }).map((n) => n.textContent)
    cleanup()
    mockProductsRef.current = [
      makeProduct('a', 'Addiesdive'),
      makeProduct('b', 'CURREN'),
      makeProduct('c', 'Seculus'),
    ]
    renderCatalogPage()
    const secondPass = screen.getAllByRole('heading', { level: 2 }).map((n) => n.textContent)
    expect(secondPass).toEqual(firstPass)
    expect(secondPass).toEqual(['Addiesdive', 'CURREN', 'Seculus'])
  })

  it('keeps the same title order across two generated product modules (CAT-47, AC18)', () => {
    const shuffled = [
      makeProduct('seculus-watch', 'Seculus'),
      makeProduct('addiesdive-watch', 'Addiesdive'),
      makeProduct('curren-watch', 'CURREN'),
    ]
    const dir = mkdtempSync(join(tmpdir(), 'catalog-order-'))
    try {
      const firstFile = join(dir, 'first.ts')
      const secondFile = join(dir, 'second.ts')
      writeProductsModule(shuffled, firstFile)
      writeProductsModule([...shuffled].reverse(), secondFile)

      mockProductsRef.current = productsFromModule(readFileSync(firstFile, 'utf8'))
      renderCatalogPage()
      const firstBuild = screen
        .getAllByRole('heading', { level: 2 })
        .map((node) => node.textContent)
      cleanup()

      mockProductsRef.current = productsFromModule(readFileSync(secondFile, 'utf8'))
      renderCatalogPage()
      const secondBuild = screen
        .getAllByRole('heading', { level: 2 })
        .map((node) => node.textContent)

      expect(firstBuild).toEqual(['Addiesdive', 'CURREN', 'Seculus'])
      expect(secondBuild).toEqual(firstBuild)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
