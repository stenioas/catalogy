import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { act, useRef, useState } from 'react'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { CarouselView } from './carousel'
import { ProductMedia } from './product-media'

const clientSrc = join(dirname(fileURLToPath(import.meta.url)), '../..')

const photos = ['foto-1.webp', 'foto-2.webp', 'foto-3.webp']

function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query === '(min-width: 768px)' || query === '(min-width: 920px)' ? false : reduce && query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
}

function renderCarousel(images: string[] = photos, container?: HTMLElement) {
  const productMedia = <ProductMedia images={images} alt="Seculus">{({ media }) => media}</ProductMedia>
  return container ? render(productMedia, { container }) : render(productMedia)
}

function shownSrc() {
  return screen.getByRole('img', { name: 'Seculus' }).getAttribute('src')
}

function visibleGallerySrc(dialog: HTMLElement) {
  const track = within(dialog).getByTestId('watch-gallery-track')
  const offset = /^translateX\(-(\d+)%\)$/.exec(track.style.transform)
  expect(offset).not.toBeNull()
  const slot = Number(offset?.[1]) / 100
  const images = [...track.querySelectorAll('img')]
    .map((image, domIndex) => ({ image, domIndex, order: Number(image.style.order || 0) }))
    .sort((left, right) => left.order - right.order || left.domIndex - right.domIndex)
  return images[slot]?.image.getAttribute('src')
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

function ControlledCarousel({ images = photos }: { images?: string[] }) {
  const [index, setIndex] = useState(0)
  const [opened, setOpened] = useState('closed')
  const primary = useRef<HTMLElement | null>(null)
  return <>
    <CarouselView images={images} alt="Seculus" index={index}
      onIndexChange={setIndex} primaryRef={(element) => { primary.current = element }}
      onOpenGallery={(selected, trigger) => {
        setOpened(`${selected}:${trigger === primary.current}`)
      }} />
    <output aria-label="Gallery request">{opened}</output>
  </>
}

describe('Carousel (CAT-70–CAT-86)', () => {
  beforeAll(() => {
    if (typeof window.PointerEvent === 'function') return
    window.PointerEvent = class PointerEvent extends MouseEvent {} as typeof PointerEvent
  })

  beforeEach(() => mockReducedMotion(false))

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('is consumed only through ProductMedia and has no legacy adapter importers (CAT-70, CATREF-13)', () => {
    const productionFiles = sourceFiles(clientSrc).filter((path) => !path.endsWith('.test.tsx'))
    const legacyImporters = productionFiles.flatMap((path) => {
      const text = readFileSync(path, 'utf8')
      if (!/import\s*\{[^}]*\bCarousel\b[^}]*\}\s*from\s*['"][^'"]*carousel['"]/.test(text)) return []
      return [relative(clientSrc, path)]
    })
    const viewImporters = productionFiles.flatMap((path) => {
      const text = readFileSync(path, 'utf8')
      if (!/import\s*\{[^}]*\bCarouselView\b[^}]*\}\s*from\s*['"][^'"]*carousel['"]/.test(text)) return []
      return [relative(clientSrc, path)]
    })
    const carouselSource = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'carousel.tsx'), 'utf8')

    expect(legacyImporters).toEqual([])
    expect(carouselSource).not.toMatch(/export function Carousel\s*\(/)
    expect(viewImporters.toSorted()).toEqual([
      'components/catalog/product-media.tsx',
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

  it('places previous and next on the photo line and keeps the dots centered underneath (CAT-75, CAT-76)', () => {
    renderCarousel()
    const stage = screen.getByTestId('carousel-stage')
    const controls = screen.getByTestId('carousel-controls')
    const previous = screen.getByRole('button', { name: 'Anterior' })
    const dots = screen.getByTestId('carousel-dots')
    const next = screen.getByRole('button', { name: 'Seguinte' })

    expect(stage.contains(frame())).toBe(true)
    expect(stage.contains(previous)).toBe(true)
    expect(stage.contains(next)).toBe(true)
    expect(follows(frame(), controls)).toBe(true)
    expect(controls.className.split(/\s+/)).toContain('mt-6')
    expect(follows(previous, frame())).toBe(true)
    expect(follows(frame(), next)).toBe(true)
    expect(follows(previous, dots)).toBe(true)
    expect(follows(next, dots)).toBe(true)
    expect(dots.className).toMatch(/\bjustify-center\b/)
    expect(stage.className).toMatch(/\bitems-center\b/)
    expect(stage.className).toMatch(/\bmd:gap-4\b/)
    for (const arrow of [previous, next]) {
      expect(arrow.className).not.toMatch(/\babsolute\b/)
      expect(arrow.className).toMatch(/\bcursor-pointer\b/)
      expect(arrow.className).toMatch(/\brounded-full\b/)
      expect(arrow.className).toMatch(/hover:bg-\[#e5e5ea\]/)
    }
    expect(previous.hasAttribute('hidden')).toBe(false)
    expect(next.hasAttribute('hidden')).toBe(false)
    expect(previous).toHaveProperty('disabled', true)
    expect(next).toHaveProperty('disabled', false)

    fireEvent.click(screen.getByRole('button', { name: 'Foto 3' }))
    expect(shownSrc()).toBe(photos[2])
    expect(screen.getByRole('button', { name: 'Anterior' }).hasAttribute('hidden')).toBe(
      false,
    )
    expect(screen.getByRole('button', { name: 'Seguinte' }).hasAttribute('hidden')).toBe(
      false,
    )
    expect(screen.getByRole('button', { name: 'Anterior' })).toHaveProperty('disabled', false)
    expect(screen.getByRole('button', { name: 'Seguinte' })).toHaveProperty('disabled', true)
  })

  it('stays on the last photo when next is pressed (CAT-77)', () => {
    renderCarousel()
    fireEvent.click(screen.getByRole('button', { name: 'Foto 3' }))
    const next = screen.getByRole('button', { name: 'Seguinte' })
    expect(next).toHaveProperty('disabled', true)
    fireEvent.click(next)
    expect(shownSrc()).toBe(photos[2])
  })

  it('stays on the first photo when previous is pressed (CAT-78)', () => {
    renderCarousel()
    const previous = screen.getByRole('button', { name: 'Anterior' })
    expect(previous).toHaveProperty('disabled', true)
    fireEvent.click(previous)
    expect(shownSrc()).toBe(photos[0])
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

  it('stretches the photo without leaving it when a drag passes the first or the last (CAT-81)', () => {
    renderCarousel()
    const box = frame()

    fireEvent.pointerDown(box, { clientX: 40, pointerId: 1 })
    fireEvent.pointerMove(box, { clientX: 200, pointerId: 1 })
    const first = screen.getByRole('img', { name: 'Seculus' })
    expect(shownSrc()).toBe(photos[0])
    expect(first.style.transitionDuration).toBe('0ms')
    expect(first.style.transform).toMatch(/translateX\([1-9]/)
    expect(first.style.transform).toMatch(/scaleX\(1\./)
    expect(first.style.transformOrigin).toBe('left center')
    fireEvent.pointerUp(box, { clientX: 200, pointerId: 1 })
    expect(shownSrc()).toBe(photos[0])
    expect(first.style.transform).toBe('translateX(0px) scaleX(1)')
    expect(first.style.transitionDuration).toBe('200ms')

    fireEvent.click(screen.getByRole('button', { name: 'Foto 3' }))
    fireEvent.pointerDown(box, { clientX: 200, pointerId: 1 })
    fireEvent.pointerMove(box, { clientX: 40, pointerId: 1 })
    const last = screen.getByRole('img', { name: 'Seculus' })
    expect(shownSrc()).toBe(photos[2])
    expect(last.style.transform).toMatch(/translateX\(-/)
    expect(last.style.transform).toMatch(/scaleX\(1\./)
    expect(last.style.transformOrigin).toBe('right center')
    fireEvent.pointerUp(box, { clientX: 40, pointerId: 1 })
    expect(shownSrc()).toBe(photos[2])
    expect(last.style.transform).toBe('translateX(0px) scaleX(1)')
  })

  it('changes photos over 200 ms (GAL-49)', () => {
    mockReducedMotion(false)
    renderCarousel()
    const track = screen.getByTestId('carousel-track')
    expect(track.style.transitionProperty).toBe('transform')
    expect(track.style.transitionDuration).toBe('200ms')
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
    expect(screen.queryByTestId('carousel-count')).toBeNull()
    expect(frame().className).toMatch(/\baspect-square\b/)
    expect(frame().getAttribute('tabindex')).toBe('0')
    drag(frame(), 180, 40)
    expect(shownSrc()).toBe('somente.webp')
    expect(screen.queryAllByRole('button')).toEqual([frame()])
  })

  it('shows the current photo and the total on a lighter parchment badge', () => {
    renderCarousel()
    const badge = screen.getByTestId('carousel-count')
    expect(frame().contains(badge)).toBe(true)
    expect(badge.textContent).toBe('1/3')
    expect(badge.getAttribute('aria-hidden')).toBe('true')
    const classes = badge.className.split(/\s+/)
    expect(classes).toContain(
      'bg-[color-mix(in_srgb,var(--canvas-parchment)_52%,transparent)]',
    )
    expect(classes).toContain('[backdrop-filter:saturate(140%)_blur(8px)]')
    expect(classes).not.toContain('[backdrop-filter:saturate(180%)_blur(20px)]')
    expect(classes).toContain('pointer-events-none')

    fireEvent.click(screen.getByRole('button', { name: 'Seguinte' }))
    expect(badge.textContent).toBe('2/3')
    fireEvent.click(screen.getByRole('button', { name: 'Foto 3' }))
    expect(badge.textContent).toBe('3/3')
  })

  it('changes photos with no duration when reduced motion is requested (GAL-50)', () => {
    mockReducedMotion(true)
    renderCarousel()
    const track = screen.getByTestId('carousel-track')
    expect(track.style.transitionDuration).toBe('0ms')
    fireEvent.click(screen.getByRole('button', { name: 'Seguinte' }))
    expect(shownSrc()).toBe(photos[1])
    expect(track.style.transitionDuration).toBe('0ms')
  })

  it('moves with ArrowRight and ArrowLeft and stops at the ends (CAT-86, SV-58)', () => {
    renderCarousel()
    const box = frame()
    box.focus()
    expect(document.activeElement).toBe(box)

    fireEvent.keyDown(box, { key: 'ArrowLeft' })
    expect(shownSrc()).toBe(photos[0])

    fireEvent.keyDown(box, { key: 'ArrowRight' })
    expect(shownSrc()).toBe(photos[1])

    fireEvent.keyDown(box, { key: 'ArrowRight' })
    expect(shownSrc()).toBe(photos[2])

    fireEvent.keyDown(box, { key: 'ArrowRight' })
    expect(shownSrc()).toBe(photos[2])
  })

  it('keeps the frame centered, square, and at most 476px, with the photo contained (SV-44)', () => {
    renderCarousel()
    const box = frame()
    const classes = box.className.split(/\s+/)
    expect(classes).toContain('max-w-[476px]')
    expect(classes).toContain('mx-auto')
    expect(classes).toContain('aspect-square')
    expect(classes).toContain('rounded-none')
    expect(classes).toContain('md:rounded-[12px]')
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

  it('opens the current photo after a pointer release under 40px and restores focus on close (GAL-01, GAL-08, GAL-11)', () => {
    const root = document.createElement('div')
    root.id = 'root'
    document.body.appendChild(root)
    const view = renderCarousel(photos, root)
    fireEvent.click(screen.getByRole('button', { name: 'Foto 2' }))

    fireEvent.pointerDown(frame(), { clientX: 100, pointerId: 1 })
    fireEvent.pointerUp(frame(), { clientX: 61, pointerId: 1 })

    const dialog = screen.getByRole('dialog', { name: 'Galeria de fotos' })
    expect(dialog.querySelector('img')?.getAttribute('src')).toBe(photos[1])
    expect(visibleGallerySrc(dialog)).toBe(photos[1])
    expect(document.activeElement).toBe(dialog)
    expect(screen.getByTestId('watch-carousel').parentElement?.hasAttribute('inert')).toBe(true)
    expect(root.hasAttribute('inert')).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))

    expect(screen.queryByRole('dialog', { name: 'Galeria de fotos' })).toBeNull()
    expect(document.activeElement).toBe(frame())
    expect(screen.getByTestId('watch-carousel').parentElement?.hasAttribute('inert')).toBe(false)
    expect(root.hasAttribute('inert')).toBe(false)

    view.unmount()
    root.remove()
  })

  it('does not count the opening pointer release toward a gallery double tap (GAL-46)', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000)
    renderCarousel()
    drag(frame(), 200, 200)

    const dialog = screen.getByRole('dialog', { name: 'Galeria de fotos' })
    const galleryFrame = within(dialog).getByTestId('watch-gallery-frame')
    const galleryViewport = within(dialog).getByTestId('watch-gallery-viewport')
    drag(galleryFrame, 200, 200)
    expect(galleryViewport.style.transform).toBe('translate(0px, 0px) scale(1) scaleX(1)')
    drag(galleryFrame, 200, 200)
    expect(galleryViewport.style.transform).toBe('translate(0px, 0px) scale(3) scaleX(1)')
  })

  it('keeps the carousel on the gallery photo without a track transition while open (GAL-38)', () => {
    renderCarousel()

    drag(frame(), 100, 100)

    const dialog = screen.getByRole('dialog', { name: 'Galeria de fotos' })
    const track = screen.getByTestId('carousel-track')
    expect(track.style.transitionDuration).toBe('0ms')

    fireEvent.click(within(dialog).getByRole('button', { name: 'Seguinte' }))

    const galleryImage = within(dialog).getByRole('img', { name: 'Seculus' })
    const carouselImage = within(screen.getByTestId('watch-carousel')).getByRole('img', {
      name: 'Seculus',
    })
    expect(galleryImage.getAttribute('src')).toBe(photos[1])
    expect(visibleGallerySrc(dialog)).toBe(photos[1])
    expect(carouselImage.getAttribute('src')).toBe(photos[1])
    expect(track.style.transitionDuration).toBe('0ms')
  })

  it('does not open after a release at or beyond 40px (GAL-02)', () => {
    renderCarousel()

    drag(frame(), 100, 60)
    expect(screen.queryByRole('dialog', { name: 'Galeria de fotos' })).toBeNull()
    expect(shownSrc()).toBe(photos[0])

    drag(frame(), 100, 59)
    expect(screen.queryByRole('dialog', { name: 'Galeria de fotos' })).toBeNull()
    expect(shownSrc()).toBe(photos[1])
  })

  it('opens and returns focus to the single-photo frame with sequential focus (GAL-01, GAL-08, GAL-14)', () => {
    renderCarousel(['somente.webp'])

    drag(frame(), 100, 99)

    expect(screen.getByRole('dialog', { name: 'Galeria de fotos' })).toBeTruthy()
    expect(frame().getAttribute('tabindex')).toBe('0')

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))

    expect(document.activeElement).toBe(frame())
    expect(frame().getAttribute('tabindex')).toBe('0')
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
    expect(dot('Foto 1').className.split(/\s+/)).toContain('cursor-pointer')
    expect(dot('Foto 1').className.split(/\s+/)).toContain('bg-[#0066cc]')
    expect(dot('Foto 1').className).toMatch(/hover:bg-\[#0066cc\]/)
    expect(dot('Foto 1').className).not.toMatch(/\bbg-current\/35\b/)

    for (const name of ['Foto 2', 'Foto 3']) {
      expect(dot(name).getAttribute('data-slot')).toBe('button')
      expect(dot(name).hasAttribute('aria-current')).toBe(false)
      expect(dot(name).className.split(/\s+/)).toContain('size-[10px]')
      expect(dot(name).className.split(/\s+/)).toContain('cursor-pointer')
      expect(dot(name).className.split(/\s+/)).toContain('bg-current/35')
      expect(dot(name).className).toMatch(/hover:bg-\[#6e6e73\]/)
      expect(dot(name).className).not.toMatch(/\bbg-\[#0066cc\]\b/)
    }

    fireEvent.click(dot('Foto 2'))
    expect(dot('Foto 2').getAttribute('aria-current')).toBe('true')
    expect(dot('Foto 2').className.split(/\s+/)).toContain('bg-[#0066cc]')
    expect(dot('Foto 1').hasAttribute('aria-current')).toBe(false)
    expect(dot('Foto 1').className.split(/\s+/)).toContain('bg-current/35')
  })
  it('renders external selection and never changes it without owner approval (CATREF-44, CATREF-45)', () => {
    const onIndexChange = vi.fn()
    const primaryRef = vi.fn()
    const view = render(<CarouselView images={photos} alt="Seculus" index={1}
      onIndexChange={onIndexChange} onOpenGallery={vi.fn()} primaryRef={primaryRef} />)
    expect(shownSrc()).toBe(photos[1])
    expect(screen.getByTestId('carousel-count').textContent).toBe('2/3')
    expect(screen.getByRole('button', { name: 'Foto 2' }).getAttribute('aria-current')).toBe('true')
    expect(primaryRef).toHaveBeenCalledWith(frame())
    fireEvent.click(screen.getByRole('button', { name: 'Foto 3' }))
    expect(onIndexChange).toHaveBeenCalledWith(2)
    expect(shownSrc()).toBe(photos[1])
    view.rerender(<CarouselView images={photos} alt="Seculus" index={2}
      onIndexChange={onIndexChange} onOpenGallery={vi.fn()} primaryRef={primaryRef} />)
    expect(shownSrc()).toBe(photos[2])
    expect(screen.getByTestId('carousel-count').textContent).toBe('3/3')
  })

  it('navigates controlled dots, arrows and keyboard within bounds (CATREF-44)', () => {
    render(<ControlledCarousel />)
    frame().focus()
    fireEvent.keyDown(frame(), { key: 'ArrowLeft' })
    expect(shownSrc()).toBe(photos[0])
    fireEvent.click(screen.getByRole('button', { name: 'Seguinte' }))
    expect(shownSrc()).toBe(photos[1])
    fireEvent.keyDown(frame(), { key: 'ArrowRight' })
    fireEvent.keyDown(frame(), { key: 'ArrowRight' })
    expect(shownSrc()).toBe(photos[2])
    expect(screen.getByRole('button', { name: 'Seguinte' })).toHaveProperty('disabled', true)
    fireEvent.click(screen.getByRole('button', { name: 'Foto 1' }))
    expect(shownSrc()).toBe(photos[0])
    expect(screen.getByRole('button', { name: 'Anterior' })).toHaveProperty('disabled', true)
  })

  it('keeps threshold, resistance and cancellation in the controlled harness (CATREF-44, CATREF-46)', () => {
    render(<ControlledCarousel />)
    drag(frame(), 100, 60)
    expect(shownSrc()).toBe(photos[0])
    expect(screen.getByLabelText('Gallery request').textContent).toBe('closed')
    drag(frame(), 100, 59)
    expect(shownSrc()).toBe(photos[1])
    fireEvent.click(screen.getByRole('button', { name: 'Foto 1' }))
    fireEvent.pointerDown(frame(), { clientX: 40, pointerId: 1 })
    fireEvent.pointerMove(frame(), { clientX: 200, pointerId: 1 })
    expect(screen.getByRole('img', { name: 'Seculus' }).style.transform).toMatch(/scaleX\(1\./)
    fireEvent.pointerCancel(frame(), { pointerId: 1 })
    fireEvent.pointerUp(frame(), { clientX: 40, pointerId: 1 })
    expect(shownSrc()).toBe(photos[0])
    expect(screen.getByRole('img', { name: 'Seculus' }).style.transform).toBe('translateX(0px) scaleX(1)')
    expect(screen.getByLabelText('Gallery request').textContent).toBe('closed')
  })

  it('requests the selected photo and exact primary trigger on a tap without owning a modal (CATREF-46)', () => {
    render(<ControlledCarousel />)
    fireEvent.click(screen.getByRole('button', { name: 'Foto 2' }))
    drag(frame(), 100, 61)
    expect(screen.getByLabelText('Gallery request').textContent).toBe('1:true')
    expect(shownSrc()).toBe(photos[1])
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByTestId('watch-carousel').parentElement?.hasAttribute('inert')).toBe(false)
  })

  it.each(['Enter', ' '])('opens a single photo by %s with focus and no navigation (CATREF-51, CATREF-71)', (key) => {
    render(<ControlledCarousel images={['somente.webp']} />)
    expect(frame().getAttribute('tabindex')).toBe('0')
    expect(frame().getAttribute('aria-label')).toBe('Abrir galeria na foto 1')
    expect(frame().className).toContain('focus-visible:ring-2')
    frame().focus()
    expect(document.activeElement).toBe(frame())
    expect(fireEvent.keyDown(frame(), { key })).toBe(false)
    expect(screen.getByLabelText('Gallery request').textContent).toBe('0:true')
    expect(screen.queryByTestId('carousel-count')).toBeNull()
    expect(screen.queryByTestId('carousel-dots')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Anterior' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Seguinte' })).toBeNull()
  })

  it('preserves tablet arrow breakpoint rules in the controlled presentation (CATREF-42, CATREF-43)', () => {
    render(<ControlledCarousel />)
    for (const name of ['Anterior', 'Seguinte']) {
      const classes = screen.getByRole('button', { name }).className.split(/\s+/)
      expect(classes).toContain('hidden')
      expect(classes).toContain('md:inline-flex')
    }
  })

  it.each([false, true])('preserves controlled transition duration with reduced motion %s (CATREF-73)', (reduce) => {
    mockReducedMotion(reduce)
    render(<ControlledCarousel />)
    fireEvent.click(screen.getByRole('button', { name: 'Seguinte' }))
    expect(shownSrc()).toBe(photos[1])
    expect(screen.getByTestId('carousel-track').style.transitionDuration).toBe(reduce ? '0ms' : '200ms')
  })

})
