import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { act } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { Carousel } from './carousel'

const clientSrc = join(dirname(fileURLToPath(import.meta.url)), '../..')

const photos = ['foto-1.webp', 'foto-2.webp', 'foto-3.webp']

function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: reduce && query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
}

function renderCarousel(images: string[] = photos) {
  return render(<Carousel images={images} alt="Seculus" />)
}

function shownSrc() {
  return screen.getByRole('img', { name: 'Seculus' }).getAttribute('src')
}

function frame() {
  return screen.getByTestId('carousel-frame')
}

function frameBox(box: HTMLElement) {
  const rect = box.getBoundingClientRect()
  return {
    height: box.style.height,
    width: box.style.width,
    minHeight: box.style.minHeight,
    maxHeight: box.style.maxHeight,
    aspectRatio: box.style.aspectRatio,
    rectWidth: rect.width,
    rectHeight: rect.height,
  }
}

function follows(earlier: HTMLElement, later: HTMLElement) {
  return (
    earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING
  ) !== 0
}

function drag(target: HTMLElement, fromX: number, toX: number) {
  fireEvent.pointerDown(target, { clientX: fromX, pointerId: 1 })
  fireEvent.pointerUp(target, { clientX: toX, pointerId: 1 })
}

function sourceFiles(dir: string): string[] {
  const found: string[] = []
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) {
      found.push(...sourceFiles(path))
    } else if (path.endsWith('.ts') || path.endsWith('.tsx')) {
      found.push(path)
    }
  }
  return found
}

describe('Carousel (CAT-70–CAT-86)', () => {
  beforeAll(() => {
    if (typeof window.PointerEvent === 'function') return
    window.PointerEvent = class PointerEvent extends MouseEvent {} as typeof PointerEvent
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('is mounted only from the watch page (CAT-70)', () => {
    const importers = sourceFiles(clientSrc).flatMap((path) => {
      const text = readFileSync(path, 'utf8')
      const importsCarousel =
        text.includes('catalog/carousel') || text.includes("from './carousel'")
      if (!importsCarousel) return []
      return [relative(clientSrc, path)]
    })

    expect(importers.toSorted()).toEqual([
      'components/catalog/carousel.test.tsx',
      'routes/watch-page.tsx',
    ])
  })

  it('shows images in the given order inside an aspect-square frame (CAT-71, CAT-72)', () => {
    renderCarousel()
    const box = frame()
    expect(box.className).toMatch(/\baspect-square\b/)
    expect(
      [...box.querySelectorAll('img')].map((img) => img.getAttribute('src')),
    ).toEqual(photos)
    expect(shownSrc()).toBe(photos[0])
  })

  it('keeps the same square frame height when the photo changes (CAT-73)', () => {
    renderCarousel()
    const box = frame()
    const beforeClass = box.className
    const before = frameBox(box)
    fireEvent.click(screen.getByRole('button', { name: 'Seguinte' }))
    expect(frame()).toBe(box)
    expect(box.className).toBe(beforeClass)
    expect(frameBox(box)).toEqual(before)
    expect(box.contains(screen.getByRole('img', { name: 'Seculus' }))).toBe(true)
    expect(shownSrc()).toBe(photos[1])
  })

  it('fits each photo inside the frame without distortion (CAT-74)', () => {
    renderCarousel()
    for (const img of frame().querySelectorAll('img')) {
      expect(img.className).toMatch(/\bobject-contain\b/)
    }
  })

  it('places previous, centered dots, and next under the image, still visible on the first and last photos (CAT-75, CAT-76)', () => {
    renderCarousel()
    const controls = screen.getByTestId('carousel-controls')
    const previous = screen.getByRole('button', { name: 'Anterior' })
    const dots = screen.getByTestId('carousel-dots')
    const next = screen.getByRole('button', { name: 'Seguinte' })

    expect(follows(frame(), controls)).toBe(true)
    expect(follows(previous, dots)).toBe(true)
    expect(follows(dots, next)).toBe(true)
    expect(dots.className).toMatch(/\bjustify-center\b/)
    expect(previous.hasAttribute('hidden')).toBe(false)
    expect(next.hasAttribute('hidden')).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: 'Foto 3' }))
    expect(shownSrc()).toBe(photos[2])
    expect(screen.getByRole('button', { name: 'Anterior' }).hasAttribute('hidden')).toBe(
      false,
    )
    expect(screen.getByRole('button', { name: 'Seguinte' }).hasAttribute('hidden')).toBe(
      false,
    )
  })

  it('wraps next on the last photo back to the first (CAT-77)', () => {
    renderCarousel()
    fireEvent.click(screen.getByRole('button', { name: 'Foto 3' }))
    fireEvent.click(screen.getByRole('button', { name: 'Seguinte' }))
    expect(shownSrc()).toBe(photos[0])
  })

  it('wraps previous on the first photo to the last (CAT-78)', () => {
    renderCarousel()
    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(shownSrc()).toBe(photos[2])
  })

  it('shows the photo for each dot (CAT-79)', () => {
    renderCarousel()
    fireEvent.click(screen.getByRole('button', { name: 'Foto 2' }))
    expect(shownSrc()).toBe(photos[1])
    fireEvent.click(screen.getByRole('button', { name: 'Foto 3' }))
    expect(shownSrc()).toBe(photos[2])
    fireEvent.click(screen.getByRole('button', { name: 'Foto 1' }))
    expect(shownSrc()).toBe(photos[0])
  })

  it('changes photo on a horizontal drag (CAT-80)', () => {
    renderCarousel()
    drag(frame(), 180, 40)
    expect(shownSrc()).toBe(photos[1])
  })

  it('wraps a horizontal drag past the last photo and past the first photo (CAT-81)', () => {
    renderCarousel()
    fireEvent.click(screen.getByRole('button', { name: 'Foto 3' }))
    drag(frame(), 180, 40)
    expect(shownSrc()).toBe(photos[0])

    drag(frame(), 40, 180)
    expect(shownSrc()).toBe(photos[2])
  })

  it('changes photos over 300 ms (CAT-82)', () => {
    mockReducedMotion(false)
    renderCarousel()
    const track = screen.getByTestId('carousel-track')
    expect(track.style.transitionProperty).toBe('transform')
    expect(track.style.transitionDuration).toBe('300ms')
  })

  it('does not autoplay (CAT-83)', () => {
    vi.useFakeTimers()
    renderCarousel()
    expect(shownSrc()).toBe(photos[0])
    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    expect(shownSrc()).toBe(photos[0])
  })

  it('hides the arrow row, the dots, and the drag gesture when there is one photo (CAT-84, SV-56, SV-57)', () => {
    renderCarousel(['somente.webp'])
    expect(screen.queryByRole('button', { name: 'Anterior' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Seguinte' })).toBeNull()
    expect(screen.queryByTestId('carousel-dots')).toBeNull()
    expect(screen.queryByTestId('carousel-controls')).toBeNull()
    expect(frame().className).toMatch(/\baspect-square\b/)
    drag(frame(), 180, 40)
    expect(shownSrc()).toBe('somente.webp')
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('changes photos with no duration when reduced motion is requested (CAT-85)', () => {
    mockReducedMotion(true)
    renderCarousel()
    const track = screen.getByTestId('carousel-track')
    expect(track.style.transitionDuration).toBe('0ms')
    fireEvent.click(screen.getByRole('button', { name: 'Seguinte' }))
    expect(shownSrc()).toBe(photos[1])
    expect(track.style.transitionDuration).toBe('0ms')
  })

  it('wraps ArrowRight and ArrowLeft when the carousel is focused (CAT-86, SV-58)', () => {
    renderCarousel()
    const box = frame()
    box.focus()
    expect(document.activeElement).toBe(box)

    fireEvent.keyDown(box, { key: 'ArrowLeft' })
    expect(shownSrc()).toBe(photos[2])

    fireEvent.keyDown(box, { key: 'ArrowRight' })
    expect(shownSrc()).toBe(photos[0])

    fireEvent.keyDown(box, { key: 'ArrowRight' })
    expect(shownSrc()).toBe(photos[1])
  })

  it('keeps the frame centered, square, and at most 480px, with the photo contained (SV-44)', () => {
    renderCarousel()
    const box = frame()
    const classes = box.className.split(/\s+/)
    expect(classes).toContain('max-w-[480px]')
    expect(classes).toContain('mx-auto')
    expect(classes).toContain('aspect-square')
    for (const img of box.querySelectorAll('img')) {
      expect(img.className.split(/\s+/)).toContain('object-contain')
    }
  })

  it('sets draggable false on each photo and touch-action pan-y on the frame (SV-53)', () => {
    renderCarousel()
    const box = frame()
    expect(box.className.split(/\s+/)).toContain('touch-pan-y')
    const images = box.querySelectorAll('img')
    expect(images.length).toBeGreaterThan(1)
    for (const img of images) {
      expect(img.getAttribute('draggable')).toBe('false')
    }
  })

  it('changes the photo only after a horizontal drag of more than 40px when there are two or more photos (SV-54)', () => {
    renderCarousel()
    drag(frame(), 100, 60)
    expect(shownSrc()).toBe(photos[0])
    drag(frame(), 100, 59)
    expect(shownSrc()).toBe(photos[1])
    drag(frame(), 59, 99)
    expect(shownSrc()).toBe(photos[1])
    drag(frame(), 59, 100)
    expect(shownSrc()).toBe(photos[0])
  })

  it('does not change the photo when the gesture is cancelled (SV-55)', () => {
    renderCarousel()
    const box = frame()
    fireEvent.pointerDown(box, { clientX: 200, pointerId: 1 })
    fireEvent.pointerCancel(box, { pointerId: 1 })
    fireEvent.pointerUp(box, { clientX: 100, pointerId: 1 })
    expect(shownSrc()).toBe(photos[0])
  })

  it('uses ghost 44×44 Buttons with ChevronLeft and ChevronRight and no pill background (SV-29, SV-33, SV-34)', () => {
    renderCarousel()
    const previous = screen.getByRole('button', { name: 'Anterior' })
    const next = screen.getByRole('button', { name: 'Seguinte' })

    for (const button of [previous, next]) {
      expect(button.getAttribute('data-slot')).toBe('button')
      expect(button.getAttribute('data-variant')).toBe('ghost')
      expect(button.className.split(/\s+/)).toContain('size-11')
      expect(button.className.split(/\s+/)).toContain('hidden')
      expect(button.className.split(/\s+/)).toContain('md:inline-flex')
      expect(button.className.split(/\s+/)).toContain('text-inherit')
      expect(button.className).not.toMatch(/\bbg-primary\b/)
      expect(button.className).not.toMatch(/\bbg-\[#0066cc\]\b/)
    }

    expect(previous.querySelector('svg.lucide-chevron-left')).not.toBeNull()
    expect(next.querySelector('svg.lucide-chevron-right')).not.toBeNull()
  })

  it('paints the current 10px dot #0066cc with aria-current and the others in the text color at 0.35 opacity (SV-59, SV-60)', () => {
    renderCarousel()

    function dot(name: string) {
      return screen.getByRole('button', { name })
    }

    expect(dot('Foto 1').getAttribute('data-slot')).toBe('button')
    expect(dot('Foto 1').getAttribute('aria-current')).toBe('true')
    expect(dot('Foto 1').className.split(/\s+/)).toContain('size-[10px]')
    expect(dot('Foto 1').className.split(/\s+/)).toContain('bg-[#0066cc]')
    expect(dot('Foto 1').className).not.toMatch(/\bbg-current\/35\b/)

    for (const name of ['Foto 2', 'Foto 3']) {
      expect(dot(name).getAttribute('data-slot')).toBe('button')
      expect(dot(name).hasAttribute('aria-current')).toBe(false)
      expect(dot(name).className.split(/\s+/)).toContain('size-[10px]')
      expect(dot(name).className.split(/\s+/)).toContain('bg-current/35')
      expect(dot(name).className).not.toMatch(/\bbg-\[#0066cc\]\b/)
    }

    fireEvent.click(dot('Foto 2'))
    expect(dot('Foto 2').getAttribute('aria-current')).toBe('true')
    expect(dot('Foto 2').className.split(/\s+/)).toContain('bg-[#0066cc]')
    expect(dot('Foto 1').hasAttribute('aria-current')).toBe(false)
    expect(dot('Foto 1').className.split(/\s+/)).toContain('bg-current/35')
  })
})
