import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  THEME_STORAGE_KEY,
  ThemeProvider,
  ThemeToggle,
  applyThemeClass,
  resolveTheme,
} from './theme-provider'

const clientRoot = join(dirname(fileURLToPath(import.meta.url)), '../..')

const FORBIDDEN_PHOTO_PROPERTY = /(?:^|[\s;{])(filter|opacity|mix-blend-mode)\s*:/
const FORBIDDEN_PHOTO_CLASS =
  /^(?:filter|opacity-|mix-blend-|blur|brightness-|contrast-|grayscale|hue-rotate-|invert|saturate-|sepia|drop-shadow|\[(?:filter|opacity|mix-blend-mode):)/

function imgElements(source: string): string[] {
  return source.match(/<img\b[\s\S]*?\/>/g) ?? []
}

/** Returns the reasons an `<img>` element source breaks CAT-119 (empty when it is fine). */
function imgViolations(element: string): string[] {
  const violations: string[] = []
  const classNames = [...element.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\}|\{'([^']*)'\})/g)]
  for (const match of classNames) {
    const value = match[1] ?? match[2] ?? match[3] ?? ''
    for (const token of value.split(/\s+/).filter(Boolean)) {
      const utility = token.replace(/^(?:[^[\]:]|\[[^\]]*\])+:/, '').replace(/^!/, '').replace(/^-/, '')
      if (FORBIDDEN_PHOTO_CLASS.test(utility)) violations.push(`class ${token}`)
    }
  }
  if (/className=\{(?!`[^`]*`\}|'[^']*'\})/.test(element)) violations.push('className not static')
  const style = element.match(/style=\{\{([\s\S]*?)\}\}/)?.[1] ?? ''
  if (/\b(filter|opacity|mixBlendMode)\s*:/.test(style)) violations.push('inline style')
  return violations
}

/** Returns the stylesheet rules that put filter, opacity or mix-blend-mode on images. */
function cssImgViolations(css: string): string[] {
  const violations: string[] = []
  for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = rule[1].trim()
    const body = rule[2]
    const targetsImages = /(^|[\s,>+~])(img|picture|\*)(?=$|[\s,.:[#>+~])/.test(selector)
    if (!targetsImages) continue
    if (FORBIDDEN_PHOTO_PROPERTY.test(body)) violations.push(`${selector} { ${body.trim()} }`)
    if (/@apply[^;]*\b(?:filter|opacity-|mix-blend-)/.test(body)) violations.push(`${selector} @apply`)
  }
  return violations
}

function colorProp(block: string, name: string): string | undefined {
  const match = block.match(new RegExp(`(?:^|[\\s;{])${name}\\s*:\\s*([^;}]+)`))
  return match?.[1]?.trim()
}

function resolvedColor(root: string, dark: string, value: string | undefined): string {
  const seen = new Set<string>()
  let current = value?.trim() ?? ''
  while (true) {
    const ref = current.match(/^var\(\s*(--[a-z0-9-]+)\s*\)$/)
    if (!ref) return current
    if (seen.has(ref[1])) return current
    seen.add(ref[1])
    const next = colorProp(dark, ref[1]) ?? colorProp(root, ref[1])
    if (!next) return current
    current = next
  }
}

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
    expect(colorProp(root, '--primary')).toBe('#0066cc')
    expect(colorProp(root, '--canvas')).toBe('#ffffff')
    expect(colorProp(root, '--canvas-parchment')).toBe('#f5f5f7')
    expect(colorProp(root, '--ink')).toBe('#1d1d1f')
    expect(resolvedColor(root, dark, colorProp(dark, '--background'))).toBe('#272729')

    const design = readFileSync(join(clientRoot, '../DESIGN.md'), 'utf-8')
    expect(design).toContain('{colors.primary}` — #0066cc')
    expect(design).toContain('{colors.canvas}` — #ffffff')
    expect(design).toContain('{colors.canvas-parchment}` — #f5f5f7')
    expect(design).toContain('{colors.ink}` — #1d1d1f')
    expect(design).toContain('{colors.surface-tile-1}` — #272729')
  })

  it('stays on light when the system prefers dark and does not read theme:v1 (CAT-117)', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    const getItem = vi.spyOn(Storage.prototype, 'getItem')
    mockColorScheme(true)
    applyThemeClass('dark')
    render(
      <ThemeProvider>
        <span>claro</span>
      </ThemeProvider>,
    )
    expect(resolveTheme()).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(getItem).not.toHaveBeenCalled()
    getItem.mockRestore()
  })

  it('uses light when the system prefers light and there is no stored choice (CAT-117)', () => {
    mockColorScheme(false)
    expect(resolveTheme()).toBe('light')
    applyThemeClass(resolveTheme())
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('keeps light when the toggle is activated and does not write theme:v1 (CAT-118)', () => {
    mockColorScheme(false)
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Usar tema escuro' }))
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(setItem).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Usar tema escuro' })).toBeDefined()
    setItem.mockRestore()
  })

  it('ignores a stored theme:v1 and stays on light (CAT-118)', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    mockColorScheme(true)
    expect(resolveTheme()).toBe('light')
  })

  it('does not put filter, opacity or mix-blend-mode on the watch photos in either theme (CAT-119)', () => {
    const catalogDir = join(clientRoot, 'src/components', 'catalog')
    for (const file of ['carousel.tsx', 'watch-card.tsx']) {
      const images = imgElements(readFileSync(join(catalogDir, file), 'utf-8'))
      expect(images, file).toHaveLength(1)
      expect(imgViolations(images[0]), file).toEqual([])
      expect(images[0]).toContain('object-contain')
    }

    const css = readFileSync(join(clientRoot, 'src/index.css'), 'utf-8')
    expect(css).toMatch(/\.dark\s*\{/)
    expect(cssImgViolations(css)).toEqual([])
  })

  it('detects filter, opacity and mix-blend-mode on a watch photo (CAT-119)', () => {
    const img = (props: string) => `<img src={src} ${props} />`
    expect(imgViolations(img('className="h-full w-full object-contain"'))).toEqual([])
    expect(imgViolations(img('className="object-contain opacity-80"'))).not.toEqual([])
    expect(imgViolations(img('className="object-contain dark:opacity-50"'))).not.toEqual([])
    expect(imgViolations(img('className="object-contain mix-blend-multiply"'))).not.toEqual([])
    expect(imgViolations(img('className="object-contain dark:invert"'))).not.toEqual([])
    expect(imgViolations(img('className="object-contain grayscale"'))).not.toEqual([])
    expect(imgViolations(img('className="object-contain [filter:blur(2px)]"'))).not.toEqual([])
    expect(imgViolations(img('className="object-contain" style={{ opacity: 0.5 }}'))).not.toEqual([])
    expect(imgViolations(img('className={cn(x)}'))).not.toEqual([])

    expect(cssImgViolations('.dark { --a: #000; }\nimg { object-fit: contain; }')).toEqual([])
    expect(cssImgViolations('.dark img { filter: invert(1); }')).not.toEqual([])
    expect(cssImgViolations('img { opacity: 0.8; }')).not.toEqual([])
    expect(cssImgViolations('.dark img { mix-blend-mode: multiply; }')).not.toEqual([])
    expect(cssImgViolations('* { filter: brightness(0.9); }')).not.toEqual([])
    expect(cssImgViolations('img { @apply opacity-50; }')).not.toEqual([])
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

  it('clears the dark class in index.html without reading theme:v1 (CAT-117, CAT-118)', () => {
    const html = readFileSync(join(clientRoot, 'index.html'), 'utf-8')
    expect(html).not.toContain('theme:v1')
    expect(html).not.toContain('localStorage')
    expect(html).toMatch(/classList\.remove\(\s*'dark'\s*\)/)
  })
})

describe('ThemeToggle (SV-29–SV-32, SV-35)', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    cleanup()
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    vi.unstubAllGlobals()
    mockColorScheme(false)
  })

  it('does not persist a theme choice while dark mode is disabled (SV-35)', () => {
    expect(THEME_STORAGE_KEY).toBe('theme:v1')
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Usar tema escuro' }))
    expect(setItem).not.toHaveBeenCalled()
    expect(localStorage.getItem('theme:v1')).toBeNull()
    setItem.mockRestore()
  })

  it('is a 44×44 ghost Button without the WhatsApp pill background (SV-29)', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )
    const button = screen.getByRole('button', { name: 'Usar tema escuro' })
    expect(button.getAttribute('data-slot')).toBe('button')
    expect(button.getAttribute('data-variant')).toBe('ghost')
    expect(button.className).toMatch(/\bsize-11\b/)
    expect(button.className).not.toMatch(/\bbg-primary\b/)
    expect(button.className).not.toMatch(/\bmin-h-11\b.*\bw-full\b|\bw-full\b.*\bmin-h-11\b/)
  })

  it('has no visible label text; only the accessible name from aria-label (SV-30)', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )
    const button = screen.getByRole('button', { name: 'Usar tema escuro' })
    expect(button.textContent?.replace(/\s/g, '')).toBe('')
  })

  it('shows Moon and aria-label Usar tema escuro while the theme is light (SV-31)', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )
    const button = screen.getByRole('button', { name: 'Usar tema escuro' })
    expect(button.querySelector('svg.lucide-moon')).not.toBeNull()
    expect(button.querySelector('svg.lucide-sun')).toBeNull()
  })

  it('stays on the light control when theme:v1 is dark (SV-32)', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    applyThemeClass('dark')
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )
    const button = screen.getByRole('button', { name: 'Usar tema escuro' })
    expect(button.querySelector('svg.lucide-moon')).not.toBeNull()
    expect(button.querySelector('svg.lucide-sun')).toBeNull()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
