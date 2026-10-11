import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { Gallery } from './gallery'

const zoomFixture = vi.hoisted(() => ({ value: null as null | { scale: number; tx: number; ty: number } }))

// T7 prepares an existing zoom; the public gestures that create it belong to T8.
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    useState: ((initial: unknown) => {
      const isZoom = typeof initial === 'object' && initial !== null && 'scale' in initial
      return actual.useState(isZoom && zoomFixture.value ? zoomFixture.value : initial)
    }) as typeof actual.useState,
  }
})

const photos = ['foto-1.webp', 'foto-2.webp']

function renderGallery(onClose = vi.fn()) {
  return render(
    <Gallery
      images={photos}
      alt="Relógio Seculus"
      index={0}
      onIndexChange={vi.fn()}
      onClose={onClose}
    />,
  )
}

function InteractiveGallery({ images = photos, initialIndex = 0 }: { images?: string[]; initialIndex?: number }) {
  const [index, setIndex] = useState(initialIndex)

  return (
    <Gallery
      images={images}
      alt="Relógio Seculus"
      index={index}
      onIndexChange={setIndex}
      onClose={vi.fn()}
    />
  )
}

afterEach(() => {
  cleanup()
  zoomFixture.value = null
  vi.unstubAllGlobals()
})

describe('Gallery modal (GAL-03–GAL-07, GAL-10, GAL-12, GAL-13, GAL-15–GAL-18, GAL-23)', () => {
  it('opens a named modal, moves focus to it, and covers the page with the specified backdrop', () => {
    renderGallery()

    const dialog = screen.getByRole('dialog', { name: 'Galeria de fotos' })
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(dialog.tabIndex).toBe(-1)
    expect(document.activeElement).toBe(dialog)
    expect(dialog.className.split(/\s+/)).toContain('fixed')
    expect(dialog.className.split(/\s+/)).toContain('inset-0')
    expect(dialog.className.split(/\s+/)).toContain('z-30')
    expect(dialog.className.split(/\s+/)).toContain('bg-[rgb(0_0_0/80%)]')
    expect(dialog.style.backdropFilter).toBe('saturate(180%) blur(20px)')
  })

  it('closes when Fechar is activated', () => {
    const onClose = vi.fn()
    renderGallery(onClose)

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on a background click but keeps open when the photo is clicked', () => {
    const onClose = vi.fn()
    renderGallery(onClose)
    const dialog = screen.getByRole('dialog', { name: 'Galeria de fotos' })

    fireEvent.click(screen.getByRole('img', { name: 'Relógio Seculus' }))
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.click(dialog)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes when Escape is pressed', () => {
    const onClose = vi.fn()
    renderGallery(onClose)

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('uses a 44px circular close button with a dark chip and responsive corners', () => {
    renderGallery()

    const close = screen.getByRole('button', { name: 'Fechar' })
    const classes = close.className.split(/\s+/)
    expect(classes).toContain('size-11')
    expect(classes).toContain('rounded-full')
    expect(classes).toContain('top-3')
    expect(classes).toContain('left-3')
    expect(classes).toContain('md:left-auto')
    expect(classes).toContain('md:right-3')
    expect(classes).toContain(
      'bg-[color-mix(in_srgb,var(--surface-black)_64%,transparent)]',
    )
    expect(classes).toContain('text-[var(--body-on-dark)]')
    expect(close.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('shows the current photo contained in a square frame', () => {
    renderGallery()

    const frame = screen.getByTestId('watch-gallery-frame')
    const photo = screen.getByRole('img', { name: 'Relógio Seculus' })
    expect(frame.className.split(/\s+/)).toContain('aspect-square')
    expect(photo.className.split(/\s+/)).toContain('object-contain')
    expect(photo.getAttribute('src')).toBe(photos[0])
  })

  it('locks page scrolling while open, removes overlay transitions, and leaves browser history unchanged', () => {
    const previousOverflow = document.body.style.overflow
    const previousLength = window.history.length
    const previousUrl = window.location.href
    const view = renderGallery()

    const dialog = screen.getByRole('dialog', { name: 'Galeria de fotos' })
    expect(document.body.style.overflow).toBe('hidden')
    expect(dialog.style.transitionDuration).toBe('0ms')
    expect(window.history.length).toBe(previousLength)
    expect(window.location.href).toBe(previousUrl)

    view.unmount()

    expect(document.body.style.overflow).toBe(previousOverflow)
    expect(window.history.length).toBe(previousLength)
    expect(window.location.href).toBe(previousUrl)
  })
})

describe('Gallery navigation and photo status (GAL-19–GAL-31)', () => {
  it('renders 44px circular responsive arrow buttons and disables them at the ends', () => {
    render(<InteractiveGallery />)

    const previous = screen.getByRole('button', { name: 'Anterior' })
    const next = screen.getByRole('button', { name: 'Seguinte' })
    for (const button of [previous, next]) {
      const classes = button.className.split(/\s+/)
      expect(classes).toContain('size-11')
      expect(classes).toContain('rounded-full')
      expect(classes).toContain('hidden')
      expect(classes).toContain('md:inline-flex')
      expect(classes).toContain(
        'bg-[color-mix(in_srgb,var(--surface-black)_64%,transparent)]',
      )
    }
    expect(previous.disabled).toBe(true)
    expect(next.disabled).toBe(false)

    fireEvent.click(next)
    expect(screen.getByRole('img', { name: 'Relógio Seculus' }).getAttribute('src')).toBe(photos[1])
    expect(screen.getByRole('button', { name: 'Anterior' }).disabled).toBe(false)
    expect(screen.getByRole('button', { name: 'Seguinte' }).disabled).toBe(true)

  })

  it.each([375, 768])('changes photos with keyboard at %i px without wrapping', (width) => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
    render(<InteractiveGallery />)

    fireEvent.keyDown(document, { key: 'ArrowRight' })
    expect(screen.getByRole('img', { name: 'Relógio Seculus' }).getAttribute('src')).toBe(photos[1])

    fireEvent.keyDown(document, { key: 'ArrowRight' })
    expect(screen.getByRole('img', { name: 'Relógio Seculus' }).getAttribute('src')).toBe(photos[1])

    fireEvent.keyDown(document, { key: 'ArrowLeft' })
    expect(screen.getByRole('img', { name: 'Relógio Seculus' }).getAttribute('src')).toBe(photos[0])

    fireEvent.keyDown(document, { key: 'ArrowLeft' })
    expect(screen.getByRole('img', { name: 'Relógio Seculus' }).getAttribute('src')).toBe(photos[0])
  })

  it('shows an aria-hidden current/total badge and announces each current photo', () => {
    render(<InteractiveGallery />)

    const badge = screen.getByText('1/2')
    expect(badge.getAttribute('aria-hidden')).toBe('true')
    expect(badge.className.split(/\s+/)).toContain('right-3')
    expect(badge.className.split(/\s+/)).toContain('bottom-3')
    expect(badge.className.split(/\s+/)).toContain('text-[var(--body-on-dark)]')
    expect(badge.className.split(/\s+/)).toContain(
      'bg-[color-mix(in_srgb,var(--surface-black)_64%,transparent)]',
    )
    expect(screen.getByText('Foto 1 de 2').getAttribute('aria-live')).toBe('polite')

    fireEvent.click(screen.getByRole('button', { name: 'Seguinte' }))

    expect(screen.getByText('2/2').getAttribute('aria-hidden')).toBe('true')
    expect(screen.getByText('Foto 2 de 2').getAttribute('aria-live')).toBe('polite')
    expect(screen.getByRole('img', { name: 'Relógio Seculus' }).getAttribute('alt')).toBe('Relógio Seculus')
  })

  it('keeps the 1/1 status and photo unchanged without rendering arrows', () => {
    render(<InteractiveGallery images={['foto-unica.webp']} />)

    expect(screen.queryByRole('button', { name: 'Anterior' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Seguinte' })).toBeNull()
    expect(screen.getByText('1/1').getAttribute('aria-hidden')).toBe('true')
    expect(screen.getByText('Foto 1 de 1').getAttribute('aria-live')).toBe('polite')

    fireEvent.keyDown(document, { key: 'ArrowRight' })
    fireEvent.keyDown(document, { key: 'ArrowLeft' })
    expect(screen.getByRole('img', { name: 'Relógio Seculus' }).getAttribute('src')).toBe('foto-unica.webp')
  })
})


describe('Gallery drag (GAL-32–GAL-37, GAL-51)', () => {
  beforeAll(() => {
    if (typeof window.PointerEvent === 'function') return
    window.PointerEvent = class PointerEvent extends MouseEvent {} as typeof PointerEvent
  })

  function shownPhoto() {
    return screen.getByRole('img', { name: 'Relógio Seculus' }) as HTMLImageElement
  }

  function drag(dx: number, dy = 0) {
    const frame = screen.getByTestId('watch-gallery-frame')
    fireEvent.pointerDown(frame, { clientX: 200, clientY: 200, pointerId: 1 })
    fireEvent.pointerMove(frame, { clientX: 200 + dx, clientY: 200 + dy, pointerId: 1 })
    fireEvent.pointerUp(frame, { clientX: 200 + dx, clientY: 200 + dy, pointerId: 1 })
  }

  it.each([[-41, 0, 1], [41, 1, 0]])('changes in the drag direction beyond 40px (%i)', (dx, initialIndex, expectedIndex) => {
    render(<InteractiveGallery initialIndex={initialIndex} />)
    drag(dx)
    expect(shownPhoto().getAttribute('src')).toBe(photos[expectedIndex])
    expect(screen.getByText(`Foto ${expectedIndex + 1} de 2`)).toBeTruthy()
  })

  it.each([-40, -39, 0, 39, 40])('keeps the photo and modal open at %ipx', (dx) => {
    render(<InteractiveGallery />)
    drag(dx, 100)
    expect(shownPhoto().getAttribute('src')).toBe(photos[0])
    expect(screen.getByRole('dialog', { name: 'Galeria de fotos' })).toBeTruthy()
  })

  it.each([[0, 100], [1, -100]])('shows the specified rubber at edge %i and restores it on release', (initialIndex, dx) => {
    render(<InteractiveGallery initialIndex={initialIndex} />)
    const frame = screen.getByTestId('watch-gallery-frame')
    fireEvent.pointerDown(frame, { clientX: 200, pointerId: 1 })
    fireEvent.pointerMove(frame, { clientX: 200 + dx, pointerId: 1 })
    const pull = Math.sign(dx) * 56 * (1 - Math.exp(-100 / 160))
    const stretch = 1 + Math.abs(pull) / 56 * 0.08
    expect(shownPhoto().style.transform).toBe(`translate(${pull}px, 0px) scale(1) scaleX(${stretch})`)
    expect(shownPhoto().style.transitionDuration).toBe('0ms')
    fireEvent.pointerUp(frame, { clientX: 200 + dx, pointerId: 1 })
    expect(shownPhoto().getAttribute('src')).toBe(photos[initialIndex])
    expect(shownPhoto().style.transform).toBe('translate(0px, 0px) scale(1) scaleX(1)')
  })

  it.each([[-500, -400, -200], [500, 400, 200]])('pans a zoomed photo within its frame without changing the index (%i)', (dx, dy, limit) => {
    zoomFixture.value = { scale: 2, tx: 0, ty: 0 }
    render(<InteractiveGallery />)
    const frame = screen.getByTestId('watch-gallery-frame')
    vi.spyOn(frame, 'getBoundingClientRect').mockReturnValue({ width: 400 } as DOMRect)
    drag(dx, dy)
    expect(shownPhoto().style.transform).toBe(`translate(${limit}px, ${limit}px) scale(2) scaleX(1)`)
    expect(shownPhoto().getAttribute('src')).toBe(photos[0])
    expect(screen.getByText('Foto 1 de 2')).toBeTruthy()
  })

  it.each(['button', 'keyboard', 'controlled'])('resets zoom and translation when a photo changes by %s', (method) => {
    zoomFixture.value = { scale: 3, tx: 75, ty: -50 }
    const onIndexChange = vi.fn()
    const view = method === 'controlled'
      ? render(<Gallery images={photos} alt="Relógio Seculus" index={0} onIndexChange={onIndexChange} onClose={vi.fn()} />)
      : render(<InteractiveGallery />)
    expect(shownPhoto().style.transform).toBe('translate(75px, -50px) scale(3) scaleX(1)')
    if (method === 'button') fireEvent.click(screen.getByRole('button', { name: 'Seguinte' }))
    else if (method === 'keyboard') fireEvent.keyDown(document, { key: 'ArrowRight' })
    else view.rerender(<Gallery images={photos} alt="Relógio Seculus" index={1} onIndexChange={onIndexChange} onClose={vi.fn()} />)
    expect(shownPhoto().getAttribute('src')).toBe(photos[1])
    expect(shownPhoto().style.transform).toBe('translate(0px, 0px) scale(1) scaleX(1)')
  })

  it.each([[false, '200ms'], [true, '0ms']])('uses the required slide duration with reduced motion %s', (reduce, duration) => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: reduce })))
    render(<InteractiveGallery />)
    drag(-41)
    expect(screen.getByTestId('watch-gallery-track').style.transitionDuration).toBe(duration)
    expect(screen.getByTestId('watch-gallery-track').style.transform).toBe('translateX(-100%)')
    expect(shownPhoto().getAttribute('src')).toBe(photos[1])
  })
})


describe('Gallery zoom (GAL-39–GAL-48, GAL-52)', () => {
  beforeAll(() => {
    window.PointerEvent = class extends MouseEvent {
      readonly pointerId: number
      readonly pointerType: string
      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init)
        this.pointerId = init.pointerId ?? 1
        this.pointerType = init.pointerType ?? 'touch'
      }
    } as typeof PointerEvent
  })

  afterEach(() => vi.restoreAllMocks())

  function setup() {
    render(<InteractiveGallery />)
    const frame = screen.getByTestId('watch-gallery-frame')
    vi.spyOn(frame, 'getBoundingClientRect').mockReturnValue({
      left: 100, top: 50, width: 400, height: 400,
    } as DOMRect)
    return frame
  }

  function photo() {
    return screen.getByRole('img', { name: 'Relógio Seculus' }) as HTMLImageElement
  }

  function tap(frame: HTMLElement, x = 350, y = 275, pointerType = 'touch') {
    const point = { clientX: x, clientY: y, pointerId: 1, pointerType }
    fireEvent.pointerDown(frame, point)
    fireEvent.pointerUp(frame, point)
  }

  it('uses deltaY / 400 toward the Ctrl-wheel pointer and clamps repeated requests to 1 and 3', () => {
    const frame = setup()
    fireEvent.wheel(frame, { ctrlKey: true, deltaY: -100, clientX: 350, clientY: 275 })
    expect(photo().style.transform).toBe('translate(-12.5px, -6.25px) scale(1.25) scaleX(1)')
    fireEvent.wheel(frame, { ctrlKey: true, deltaY: -10000, clientX: 350, clientY: 275 })
    expect(photo().style.transform).toBe('translate(-100px, -50px) scale(3) scaleX(1)')
    fireEvent.wheel(frame, { ctrlKey: true, deltaY: -400, clientX: 350, clientY: 275 })
    expect(photo().style.transform).toBe('translate(-100px, -50px) scale(3) scaleX(1)')
    fireEvent.wheel(frame, { ctrlKey: true, deltaY: 10000, clientX: 350, clientY: 275 })
    expect(photo().style.transform).toBe('translate(0px, 0px) scale(1) scaleX(1)')
    fireEvent.wheel(frame, { ctrlKey: true, deltaY: 400, clientX: 350, clientY: 275 })
    expect(photo().style.transform).toBe('translate(0px, 0px) scale(1) scaleX(1)')
  })

  it.each([1, 2])('ignores wheel without Ctrl at scale %i and keeps the photo', (scale) => {
    const frame = setup()
    if (scale === 2) fireEvent.wheel(frame, { ctrlKey: true, deltaY: -400, clientX: 300, clientY: 250 })
    fireEvent.wheel(frame, { deltaY: -1000, clientX: 350, clientY: 275 })
    expect(photo().style.transform).toBe(`translate(0px, 0px) scale(${scale}) scaleX(1)`)
    expect(photo().getAttribute('src')).toBe(photos[0])
  })

  it('uses the initial scale and pointer distance ratio toward the pinch midpoint', () => {
    const frame = setup()
    fireEvent.wheel(frame, { ctrlKey: true, deltaY: -400, clientX: 300, clientY: 250 })
    fireEvent.pointerDown(frame, { pointerId: 1, clientX: 300, clientY: 250 })
    fireEvent.pointerDown(frame, { pointerId: 2, clientX: 400, clientY: 250 })
    fireEvent.pointerMove(frame, { pointerId: 2, clientX: 425, clientY: 250 })
    expect(photo().style.transform).toBe('translate(-15.625px, 0px) scale(2.5) scaleX(1)')
    fireEvent.pointerMove(frame, { pointerId: 2, clientX: 450, clientY: 250 })
    expect(photo().style.transform).toBe('translate(-37.5px, 0px) scale(3) scaleX(1)')
    expect(photo().getAttribute('src')).toBe(photos[0])
  })

  it('clamps pinch requests at both bounds and never turns the two-pointer release into a swipe', () => {
    const frame = setup()
    fireEvent.pointerDown(frame, { pointerId: 1, clientX: 250, clientY: 250 })
    fireEvent.pointerDown(frame, { pointerId: 2, clientX: 350, clientY: 250 })
    fireEvent.pointerMove(frame, { pointerId: 2, clientX: 750, clientY: 250 })
    expect(photo().style.transform).toBe('translate(-400px, 0px) scale(3) scaleX(1)')
    fireEvent.pointerMove(frame, { pointerId: 2, clientX: 850, clientY: 250 })
    expect(photo().style.transform).toBe('translate(-400px, 0px) scale(3) scaleX(1)')
    fireEvent.pointerMove(frame, { pointerId: 2, clientX: 275, clientY: 250 })
    expect(photo().style.transform).toBe('translate(0px, 0px) scale(1) scaleX(1)')
    fireEvent.pointerMove(frame, { pointerId: 2, clientX: 260, clientY: 250 })
    expect(photo().style.transform).toBe('translate(0px, 0px) scale(1) scaleX(1)')
    fireEvent.pointerUp(frame, { pointerId: 2, clientX: 260, clientY: 250 })
    fireEvent.pointerMove(frame, { pointerId: 1, clientX: 150, clientY: 250 })
    fireEvent.pointerUp(frame, { pointerId: 1, clientX: 150, clientY: 250 })
    expect(photo().getAttribute('src')).toBe(photos[0])
    expect(screen.getByText('Foto 1 de 2')).toBeTruthy()
    expect(photo().style.transform).toBe('translate(0px, 0px) scale(1) scaleX(1)')
  })

  it.each(['touch', 'mouse'])('toggles 1 to 3 toward the second %s point and back to zero translation', (pointerType) => {
    const frame = setup()
    const now = vi.spyOn(Date, 'now').mockReturnValue(1000)
    tap(frame, 340, 270, pointerType)
    now.mockReturnValue(1200)
    tap(frame, 350, 275, pointerType)
    expect(photo().style.transform).toBe('translate(-100px, -50px) scale(3) scaleX(1)')
    now.mockReturnValue(2000)
    tap(frame, 350, 275, pointerType)
    now.mockReturnValue(2100)
    tap(frame, 350, 275, pointerType)
    expect(photo().style.transform).toBe('translate(0px, 0px) scale(1) scaleX(1)')
  })

  it.each([
    [300, 39, 0, true],
    [301, 0, 0, false],
    [200, 40, 0, false],
    [200, 41, 0, false],
    [200, 30, 30, false],
  ])('accepts only <=300ms and <40px (time %i, x %i, y %i)', (elapsed, dx, dy, accepted) => {
    const frame = setup()
    const now = vi.spyOn(Date, 'now').mockReturnValue(1000)
    tap(frame, 300, 250)
    now.mockReturnValue(1000 + elapsed)
    tap(frame, 300 + dx, 250 + dy)
    expect(photo().style.transform).toBe(accepted
      ? 'translate(-78px, 0px) scale(3) scaleX(1)'
      : 'translate(0px, 0px) scale(1) scaleX(1)')
  })

  it('limits the double-tap translation to the frame edges', () => {
    const frame = setup()
    vi.spyOn(Date, 'now').mockReturnValue(1000)
    tap(frame, 550, 500)
    tap(frame, 550, 500)
    expect(photo().style.transform).toBe('translate(-400px, -400px) scale(3) scaleX(1)')
  })

  it('renders only the closing and navigation controls, without zoom buttons', () => {
    setup()
    expect(screen.getAllByRole('button').map((button) => button.getAttribute('aria-label')))
      .toEqual(['Fechar', 'Anterior', 'Seguinte'])
  })

  it.each([[false, '200ms'], [true, '0ms']])('uses the specified zoom duration with reduced motion %s', (reduce, duration) => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: reduce })))
    const frame = setup()
    fireEvent.wheel(frame, { ctrlKey: true, deltaY: -400, clientX: 300, clientY: 250 })
    expect(photo().style.transform).toBe('translate(0px, 0px) scale(2) scaleX(1)')
    expect(photo().style.transitionDuration).toBe(duration)
    vi.spyOn(Date, 'now').mockReturnValue(1000)
    tap(frame, 300, 250)
    tap(frame, 300, 250)
    expect(photo().style.transform).toBe('translate(0px, 0px) scale(1) scaleX(1)')
    expect(photo().style.transitionDuration).toBe(duration)
  })
})
