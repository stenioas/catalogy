import { useRef, type RefObject } from 'react'

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { StickyBar } from './sticky-bar'

const phone = '5585997689165'
const title = 'Seculus'

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
      phone={phone}
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

describe('StickyBar (CAT-89–CAT-94, CAT-151)', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('shows the price and the same Eu quero! on first paint without full intersection (CAT-89)', () => {
    const observer = installObserver(0.4, true)
    renderBar()

    expect(observer.threshold()).toBe(1)
    const bar = screen.getByTestId('sticky-bar')
    expect(bar).toBeTruthy()
    expect(screen.getByTestId('price-current').textContent).toBe('R$ 369,90')

    const link = screen.getByRole('link', { name: 'Eu quero!' })
    const message = encodeURIComponent('Olá, tenho interesse no Seculus.')
    expect(link.getAttribute('href')).toBe(
      `https://wa.me/${phone}?text=${message}`,
    )
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    expect(bar.contains(link)).toBe(true)
  })

  it('hides the bar on first paint when the button is fully inside the viewport (CAT-90, CAT-151)', () => {
    installObserver(1, true)
    renderBar()

    expect(screen.queryByTestId('sticky-bar')).toBeNull()
    expect(screen.queryByRole('link', { name: 'Eu quero!' })).toBeNull()
    expect(screen.queryByTestId('price-current')).toBeNull()
  })

  it('places the price beside the button from 768px and above a full-width button below that (CAT-91, CAT-92, CAT-93)', () => {
    installObserver(0, false)
    renderBar()

    const row = screen.getByTestId('sticky-bar-row')
    const price = screen.getByTestId('price-block')
    const action = screen.getByTestId('sticky-bar-action')
    const link = screen.getByRole('link', { name: 'Eu quero!' })

    expect(row.className).toMatch(/\bflex-col\b/)
    expect(row.className).toMatch(/\bmd:flex-row\b/)
    expect(row.className).toMatch(/\bmd:justify-between\b/)
    expect(
      price.compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0)
    expect(action.className).toMatch(/\bw-full\b/)
    expect(action.className).toMatch(/\bmd:w-auto\b/)
    expect(action.className).toMatch(/\[&>a\]:w-full/)
    expect(action.className).toMatch(/md:\[&>a\]:w-auto/)
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
