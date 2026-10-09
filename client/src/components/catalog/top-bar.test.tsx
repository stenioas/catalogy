import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ThemeProvider } from '../theme-provider'
import { TopBar } from './top-bar'

function renderTopBar(sellerName: string) {
  return render(
    <ThemeProvider>
      <TopBar sellerName={sellerName} />
    </ThemeProvider>,
  )
}

describe('TopBar (CAT-36, CAT-37, CAT-38, CAT-44, CAT-45)', () => {
  it('shows Catálogo {name} for the matched seller (CAT-36)', () => {
    renderTopBar('Alexandre')
    expect(screen.getByText('Catálogo Alexandre')).toBeDefined()
  })

  it('does not show an accessible back control on the catalog grade route (CAT-37)', () => {
    renderTopBar('Manuela')
    expect(screen.queryByRole('link', { name: 'Voltar' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Voltar' })).toBeNull()
  })

  it('places the theme control on the right of the bar (CAT-38)', () => {
    const { container } = renderTopBar('Ana Claudia')
    const row = container.querySelector(
      '[data-testid="top-bar-inner"]',
    ) as HTMLElement
    expect(row).not.toBeNull()
    expect(row.firstElementChild?.textContent).toContain('Catálogo Ana Claudia')
    expect(row.lastElementChild?.tagName).toBe('BUTTON')
    expect(
      within(row).getByRole('button', { name: /Usar tema/ }),
    ).toBeDefined()
  })

  it('paints the bar across the full viewport width (CAT-44)', () => {
    const { container } = renderTopBar('Alexandre')
    const header = container.querySelector('header[data-testid="top-bar"]')
    expect(header).not.toBeNull()
    expect((header as HTMLElement).className).toMatch(/\bw-full\b/)
  })

  it('uses the shared 1120 px column for bar content (CAT-45)', () => {
    const { container } = renderTopBar('Alexandre')
    const inner = container.querySelector('[data-testid="top-bar-inner"]')
    expect(inner).not.toBeNull()
    expect((inner as HTMLElement).classList.contains('catalog-column')).toBe(true)
  })
})
