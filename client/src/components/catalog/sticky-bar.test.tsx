import { useRef, type RefObject } from 'react'

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { waUrl } from './want-link'
import { StickyBar } from './sticky-bar'

const slug = 'seculus'
const title = 'Seculus'
const whatsappLinkName = 'Enviar no WhatsApp'

function installObserver(intersectionRatio: number, isIntersecting: boolean) {
  let threshold: number | number[] | undefined

  class FakeIntersectionObserver {
    constructor(
      private readonly callback: IntersectionObserverCallback,
      options?: IntersectionObserverInit,
    ) {
      threshold = options?.threshold
    }

    observe() {
      this.callback(
        [
          {
            intersectionRatio,
            isIntersecting,
          } as IntersectionObserverEntry,
        ],
        this as unknown as IntersectionObserver,
      )
    }

    unobserve() {}

    disconnect() {}

    takeRecords() {
      return []
    }
  }

  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
  return {
    threshold: () => threshold,
  }
}

function Harness({
  targetRef,
}: {
  targetRef: RefObject<HTMLButtonElement | null>
}) {
  return (
    <StickyBar
      price={369.9}
      slug={slug}
      title={title}
      targetRef={targetRef}
    />
  )
}

function renderBar() {
  function Fixture() {
    const targetRef = useRef<HTMLButtonElement>(null)
    return (
      <>
        <button ref={targetRef} type="button">
          alvo
        </button>
        <Harness targetRef={targetRef} />
      </>
    )
  }

  return render(<Fixture />)
}

describe('StickyBar (SV-16, SV-20, CAT-89–CAT-94, CAT-151)', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('shows the price and the same WhatsApp href as the page button on first paint without full intersection (SV-20, CAT-89)', () => {
    const observer = installObserver(0.4, true)
    renderBar()

    expect(observer.threshold()).toBe(1)
    const bar = screen.getByTestId('sticky-bar')
    expect(bar).toBeTruthy()
    expect(screen.getByTestId('price-current').textContent).toBe('R$ 369,90')

    const link = screen.getByRole('link', { name: whatsappLinkName })
    expect(link.getAttribute('href')).toBe(waUrl(slug, title))
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    expect(bar.contains(link)).toBe(true)
    const spacer = screen.getByTestId('sticky-bar-spacer')
    expect(spacer.getAttribute('aria-hidden')).toBe('true')
    expect(bar.contains(spacer)).toBe(false)
    expect(bar.className).toMatch(/\bfixed\b/)
    expect(bar.className).toMatch(/\binset-x-0\b/)
    expect(bar.classList.contains('catalog-column')).toBe(false)
    const row = screen.getByTestId('sticky-bar-row')
    expect(row.classList.contains('catalog-column')).toBe(true)
  })

  it('hides the bar on first paint when the button is fully inside the viewport (SV-16, CAT-90, CAT-151)', () => {
    installObserver(1, true)
    renderBar()

    expect(screen.queryByTestId('sticky-bar')).toBeNull()
    expect(screen.queryByTestId('sticky-bar-spacer')).toBeNull()
    expect(screen.queryByRole('link', { name: whatsappLinkName })).toBeNull()
    expect(screen.queryByTestId('price-current')).toBeNull()
  })

  it('places the price beside the button from 768px and above a full-width button below that (CAT-91, CAT-92, CAT-93)', () => {
    installObserver(0, false)
    renderBar()

    const row = screen.getByTestId('sticky-bar-row')
    const price = screen.getByTestId('price-block')
    const action = screen.getByTestId('sticky-bar-action')
    const link = screen.getByRole('link', { name: whatsappLinkName })

    expect(row.className).toMatch(/\bflex-col\b/)
    expect(row.className).toMatch(/\bmd:flex-row\b/)
    expect(row.className).not.toMatch(/\bmd:justify-between\b/)
    expect(
      price.compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0)
    expect(price.parentElement?.className).toMatch(/\bmd:flex-1\b/)
    expect(action.className).toMatch(/\bw-full\b/)
    expect(action.className).toMatch(/\bmd:flex-1\b/)
    expect(action.className).not.toMatch(/\bmd:w-auto\b/)
    expect(action.className).toMatch(/\[&>a\]:flex/)
    expect(action.className).toMatch(/\[&>a\]:w-full/)
    expect(action.className).toMatch(/\[&>a\]:justify-center/)
    expect(action.className).not.toMatch(/md:\[&>a\]:w-auto/)
    expect(action.className).not.toMatch(/\[&>a\]:block/)
    expect(action.contains(link)).toBe(true)
  })

  it('respects the safe area and uses the parchment blur (CAT-94)', () => {
    installObserver(0, false)
    renderBar()

    const style = screen.getByTestId('sticky-bar').getAttribute('style') ?? ''
    expect(style).toContain('env(safe-area-inset-bottom)')
    expect(style).toContain('saturate(180%) blur(20px)')
    expect(style).toContain('var(--canvas-parchment)')
    expect(style).toContain('80%')
  })
})
