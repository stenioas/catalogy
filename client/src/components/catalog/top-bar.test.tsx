import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { ThemeProvider } from '../theme-provider'
import { TopBar } from './top-bar'

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

  it('shows the fixed title Catálogo on the catalog route (SV-01)', () => {
    renderTopBar()
    expect(screen.getByText('Catálogo')).toBeDefined()
    expect(screen.queryByText(/Catálogo /)).toBeNull()
  })

  it('shows Catálogo on the watch route when catalogHref is set (SV-12)', () => {
    renderTopBar('/')
    expect(screen.getByRole('link', { name: 'Catálogo' })).toBeDefined()
    expect(screen.queryByText(/Catálogo /)).toBeNull()
  })

  it('does not show an accessible back control on the catalog grade route (CAT-37)', () => {
    renderTopBar()
    expect(screen.queryByRole('link', { name: 'Voltar' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Voltar' })).toBeNull()
  })

  it('places the theme control on the right of the bar (CAT-38)', () => {
    const { container } = renderTopBar()
    const row = container.querySelector(
      '[data-testid="top-bar-inner"]',
    ) as HTMLElement
    expect(row).not.toBeNull()
    expect(row.firstElementChild?.textContent).toContain('Catálogo')
    expect(row.lastElementChild?.tagName).toBe('BUTTON')
    expect(
      within(row).getByRole('button', { name: /Usar tema/ }),
    ).toBeDefined()
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
