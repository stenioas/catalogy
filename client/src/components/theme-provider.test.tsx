import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import {
  THEME_STORAGE_KEY,
  ThemeProvider,
  ThemeToggle,
  applyThemeClass,
  readStoredTheme,
  resolveTheme,
  watchPhotoImgClassName,
} from './theme-provider'

const clientRoot = join(dirname(fileURLToPath(import.meta.url)), '../..')

function mockColorScheme(dark: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)' ? dark : false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
}

describe('theme persistence (CAT-116–CAT-119)', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    vi.unstubAllGlobals()
  })

  it('applies the light and dark theme colors the spec names (CAT-116)', () => {
    const css = readFileSync(join(clientRoot, 'src/index.css'), 'utf-8')
    const root = css.match(/:root\s*\{([^}]*)\}/)?.[1]
    const dark = css.match(/\.dark\s*\{([^}]*)\}/)?.[1]
    expect(root).toBeDefined()
    expect(dark).toBeDefined()
    expect(root).toMatch(/--primary-tint:\s*#0066cc\b/)
    expect(root).toMatch(/--primary-tint-background:\s*rgba\(0,\s*102,\s*204,\s*0\.12\)/)
    expect(root).toMatch(/--ink-muted-48:\s*#7a7a7a\b/)
    expect(dark).toMatch(/--primary-tint:\s*#2997ff\b/)
    expect(dark).toMatch(/--primary-tint-background:\s*rgba\(41,\s*151,\s*255,\s*0\.16\)/)
  })

  it('follows prefers-color-scheme when localStorage has no theme:v1 (CAT-117)', () => {
    mockColorScheme(true)
    expect(readStoredTheme()).toBeNull()
    expect(resolveTheme()).toBe('dark')
    applyThemeClass(resolveTheme())
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('uses light when the system prefers light and there is no stored choice (CAT-117)', () => {
    mockColorScheme(false)
    expect(resolveTheme()).toBe('light')
    applyThemeClass(resolveTheme())
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('stores light or dark in theme:v1 and updates the html class when toggling (CAT-118)', () => {
    mockColorScheme(false)
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Usar tema escuro' }))
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Usar tema claro' }))
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('honours a stored theme:v1 over the system preference (CAT-118)', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
    mockColorScheme(true)
    expect(resolveTheme()).toBe('light')
  })

  it('does not put theme filters on watch photos (CAT-119)', () => {
    expect(watchPhotoImgClassName).toBe('object-contain')
    expect(watchPhotoImgClassName).not.toMatch(/filter|invert|dark:/)
    const css = readFileSync(join(clientRoot, 'src/index.css'), 'utf-8')
    expect(css).not.toMatch(/\.dark\s+img\s*\{[^}]*filter:/)
  })

  it('defines {colors.primary-tint} with the light and dark badge colors (CAT-120)', () => {
    const design = readFileSync(join(clientRoot, '../DESIGN.md'), 'utf-8')
    const line = design
      .split('\n')
      .find((row) => row.includes('{colors.primary-tint}'))
    expect(line).toBeDefined()
    expect(line).toContain('#0066cc')
    expect(line).toContain('rgba(0, 102, 204, 0.12)')
    expect(line).toContain('#2997ff')
    expect(line).toContain('rgba(41, 151, 255, 0.16)')
  })

  it('applies theme:v1 from an inline script in index.html before React loads (CAT-117, CAT-118)', () => {
    const html = readFileSync(join(clientRoot, 'index.html'), 'utf-8')
    expect(html).toContain('theme:v1')
    expect(html).toMatch(/prefers-color-scheme:\s*dark/)
    expect(html).toMatch(/document\.documentElement\.classList/)
  })
})
