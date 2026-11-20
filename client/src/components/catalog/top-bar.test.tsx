import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ThemeProvider } from '../theme-provider'
import { TopBar } from './top-bar'

const NOTICE =
  'Adicione o Achavio à tela inicial para ver o catálogo sem a barra do navegador. Use o menu.'

function mockMedia(matches: (query: string) => boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: matches(query),
      media: query,
      addEventListener() {},
      removeEventListener() {},
    })),
  )
}

function renderTopBar(catalogHref?: string) {
  const bar = <TopBar catalogHref={catalogHref} />
  return render(
    <ThemeProvider>
      {catalogHref ? <MemoryRouter>{bar}</MemoryRouter> : bar}
    </ThemeProvider>,
  )
}

describe('TopBar (SV-01, SV-12, CAT-37, CAT-38, CAT-44, CAT-45)', () => {
  afterEach(() => {
    cleanup()
  })

  it('shows the Achavio logo on the catalog route (SV-01)', () => {
    renderTopBar()
    const logo = screen.getByAltText('Achavio')
    expect(logo.getAttribute('src')).toBe('/achavio_logo.webp')
  })

  it('links the logo to the catalog on the watch route when catalogHref is set (SV-12)', () => {
    renderTopBar('/')
    expect(screen.getByRole('link', { name: 'Achavio' }).getAttribute('href')).toBe('/')
  })

  it('fits the logo inside the 64px bar with a fixed 20px height', () => {
    renderTopBar()
    const logo = screen.getByAltText('Achavio')
    expect(logo.className).toMatch(/\bh-5\b/)
    expect(logo.className).toMatch(/\bw-auto\b/)
    expect(logo.getAttribute('height')).toBe('20')
  })

  it('does not show an accessible back control on the catalog grade route (CAT-37)', () => {
    renderTopBar()
    expect(screen.queryByRole('link', { name: 'Voltar' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Voltar' })).toBeNull()
  })

  it('keeps the logo centered and hides the theme control (CAT-38)', () => {
    const { container } = renderTopBar()
    const row = container.querySelector(
      '[data-testid="top-bar-inner"]',
    ) as HTMLElement
    expect(row).not.toBeNull()
    expect(row.className).toMatch(/grid-cols-\[1fr_auto_1fr\]/)
    expect(row.children[1]?.querySelector('img')?.getAttribute('alt')).toBe('Achavio')
    expect(row.lastElementChild?.querySelector('button')).toBeNull()
    expect(within(row).queryByRole('button', { name: /Usar tema/ })).toBeNull()
  })

  it('paints the bar across the full viewport width (CAT-44)', () => {
    const { container } = renderTopBar()
    const header = container.querySelector('header[data-testid="top-bar"]')
    expect(header).not.toBeNull()
    expect((header as HTMLElement).className).toMatch(/\bw-full\b/)
  })

  it('uses the shared 1120 px column for bar content (CAT-45)', () => {
    const { container } = renderTopBar()
    const inner = container.querySelector('[data-testid="top-bar-inner"]')
    expect(inner).not.toBeNull()
    expect((inner as HTMLElement).classList.contains('catalog-column')).toBe(true)
  })
})

describe('TopBar height and Voltar (SV-29, SV-33, SV-43)', () => {
  afterEach(() => {
    cleanup()
  })

  it('is 64px tall on the catalog grade without Voltar (SV-43)', () => {
    const { container } = renderTopBar()
    const header = container.querySelector(
      '[data-testid="top-bar"]',
    ) as HTMLElement
    const inner = container.querySelector(
      '[data-testid="top-bar-inner"]',
    ) as HTMLElement
    expect(header.className).toMatch(/\bh-16\b/)
    expect(header.className).toMatch(/\bfixed\b/)
    expect(inner.className).toMatch(/\bh-full\b/)
    expect(inner.className).not.toMatch(/\bpy-2\.5\b/)
    expect(header.className).toContain('bg-[color-mix(in_srgb,var(--canvas-parchment)_80%,transparent)]')
    expect(header.className).toContain('[backdrop-filter:saturate(180%)_blur(20px)]')
    expect(header.className).toContain('text-[var(--ink)]')
    expect(header.className).toContain('border-[rgba(0,0,0,0.08)]')
    expect(header.className).not.toContain('bg-[var(--surface-black)]')
  })

  it('is 64px tall on the watch route with Voltar (SV-43)', () => {
    const { container } = renderTopBar('/')
    const header = container.querySelector(
      '[data-testid="top-bar"]',
    ) as HTMLElement
    const inner = container.querySelector(
      '[data-testid="top-bar-inner"]',
    ) as HTMLElement
    expect(header.className).toMatch(/\bh-16\b/)
    expect(inner.className).toMatch(/\bh-full\b/)
    expect(inner.className).not.toMatch(/\bpy-2\.5\b/)
  })

  it('uses ArrowLeft on a ghost 44×44 Voltar without the WhatsApp pill background (SV-29, SV-33)', () => {
    renderTopBar('/')
    const back = screen.getByRole('link', { name: 'Voltar' })
    expect(back.querySelector('svg.lucide-arrow-left')).not.toBeNull()
    expect(back.getAttribute('data-slot')).toBe('button')
    expect(back.getAttribute('data-variant')).toBe('ghost')
    expect(back.className).toMatch(/\bsize-11\b/)
    expect(back.className).toMatch(/\brounded-full\b/)
    expect(back.className).toContain('hover:bg-[color-mix(in_srgb,var(--ink)_8%,transparent)]')
    expect(back.className).toMatch(/hover:text-inherit/)
    expect(back.className).not.toMatch(/\bbg-primary\b/)
  })

  it('hides when the page scrolls down and returns when it scrolls up', () => {
    const setScrollY = (y: number) => {
      Object.defineProperty(window, 'scrollY', {
        value: y,
        writable: true,
        configurable: true,
      })
    }

    setScrollY(0)
    renderTopBar()
    const header = screen.getByTestId('top-bar')
    expect(header.className).toMatch(/translate-y-0/)
    expect(screen.getByTestId('top-bar-spacer').className).toMatch(/\bh-16\b/)

    setScrollY(160)
    fireEvent.scroll(window)
    expect(header.className).toMatch(/-translate-y-full/)
    expect(header.hasAttribute('inert')).toBe(true)

    setScrollY(80)
    fireEvent.scroll(window)
    expect(header.className).not.toMatch(/-translate-y-full/)
    expect(header.hasAttribute('inert')).toBe(false)
  })
})

describe('TopBar PWA vitrine e ficha (PWA-16, PWA-39, PWA-40, PWA-47, PWA-48, PWA-49, PWA-50)', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
    vi.unstubAllGlobals()
    Reflect.deleteProperty(navigator, 'standalone')
  })

  it('na vitrine coloca Menu no slot esquerdo, mantém a logo e deixa o direito vazio', () => {
    mockMedia(() => false)
    const { container } = renderTopBar()
    expect(screen.getByRole('button', { name: 'Menu' })).toBeDefined()
    const logo = screen.getByAltText('Achavio')
    expect(logo.getAttribute('src')).toBe('/achavio_logo.webp')
    const row = container.querySelector('[data-testid="top-bar-inner"]') as HTMLElement
    expect(row.lastElementChild?.querySelector('button')).toBeNull()

    cleanup()
    mockMedia(
      (query) =>
        query === '(max-width: 767px)' || query === '(display-mode: standalone)',
    )
    renderTopBar()
    expect(screen.queryByRole('button', { name: 'Menu' })).toBeNull()
    expect(screen.queryByTestId('install-notice')).toBeNull()
  })

  it('na vitrine estreita mostra o aviso abaixo do espaçador', () => {
    mockMedia((query) => query === '(max-width: 767px)')
    const { container } = renderTopBar()
    const spacer = screen.getByTestId('top-bar-spacer')
    const notice = screen.getByTestId('install-notice')
    expect(screen.getByText(NOTICE)).toBeDefined()
    expect(
      spacer.compareDocumentPosition(notice) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    const header = container.querySelector('[data-testid="top-bar"]')
    expect(
      notice.compareDocumentPosition(header!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('na ficha estreita mantém só Voltar, sem Menu nem aviso', () => {
    mockMedia((query) => query === '(max-width: 767px)')
    renderTopBar('/')
    expect(screen.getByRole('link', { name: 'Voltar' })).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Menu' })).toBeNull()
    expect(screen.queryByTestId('install-notice')).toBeNull()
    expect(screen.queryByText(NOTICE)).toBeNull()
  })
})
