import { useState } from 'react'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DesktopProductMedia } from './desktop-product-media'

function photos(count: number) {
  return Array.from({ length: count }, (_, index) => `/photo-${index + 1}.webp`)
}

function renderMedia(images = photos(1), index = 0) {
  const onIndexChange = vi.fn()
  const onOpenGallery = vi.fn()
  const primaryRef = vi.fn()
  const view = render(
    <DesktopProductMedia
      images={images}
      alt="Relógio de teste"
      index={index}
      onIndexChange={onIndexChange}
      onOpenGallery={onOpenGallery}
      primaryRef={primaryRef}
    />,
  )
  return { ...view, onIndexChange, onOpenGallery, primaryRef }
}

function renderControlledMedia(images = photos(1), initialIndex = 0) {
  const onOpenGallery = vi.fn()
  const primaryRef = vi.fn()

  function ControlledHarness() {
    const [index, setIndex] = useState(initialIndex)
    const [galleryIndex, setGalleryIndex] = useState<number | null>(null)
    return (
      <>
        <DesktopProductMedia
          images={images}
          alt="Relógio de teste"
          index={index}
          onIndexChange={setIndex}
          onOpenGallery={(requestedIndex, trigger) => {
            setIndex(requestedIndex)
            setGalleryIndex(requestedIndex)
            onOpenGallery(requestedIndex, trigger)
          }}
          primaryRef={primaryRef}
        />
        <output data-testid="selected-index">{index}</output>
        <output data-testid="requested-gallery-index">{galleryIndex ?? 'closed'}</output>
      </>
    )
  }

  const view = render(<ControlledHarness />)
  return { ...view, onOpenGallery, primaryRef }
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })))
  vi.stubGlobal('PointerEvent', class extends MouseEvent {
    pointerType: string
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init)
      this.pointerType = init.pointerType ?? 'mouse'
    }
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('DesktopProductMedia (CATREF-16, CATREF-21–30, CATREF-51, CATREF-71)', () => {
  it.each([
    { count: 1, thumbs: 1 },
    { count: 7, thumbs: 7 },
    { count: 8, thumbs: 8 },
    { count: 9, thumbs: 7 },
    { count: 12, thumbs: 7 },
  ])('shows $thumbs thumbnails for $count photos and the required +N when needed', ({ count, thumbs }) => {
    renderMedia(photos(count))
    const group = screen.getByRole('group', { name: 'Miniaturas do produto' })
    const buttons = within(group).getAllByRole('button')

    expect(buttons.filter((button) => button.getAttribute('aria-label')?.startsWith('Foto '))).toHaveLength(thumbs)
    if (count > 8) {
      const more = screen.getByRole('button', { name: `Abrir galeria na foto 8, mais ${count - 7} fotos` })
      expect(more.textContent).toBe(`+${count - 7}`)
      expect(buttons).toContain(more)
    } else {
      expect(buttons).toHaveLength(thumbs)
      expect(screen.queryByText(/^\+\d+$/)).toBeNull()
    }
  })

  it.each([7, 8, 11])('marks +N active when the controlled selection is photo %i', (index) => {
    renderMedia(photos(12), index)
    expect(screen.getByRole('button', { name: 'Abrir galeria na foto 8, mais 5 fotos' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.queryByRole('button', { name: `Foto ${index + 1}` })).toBeNull()
  })

  it('updates the active thumbnail and main photo after a click', () => {
    renderControlledMedia(photos(7))
    fireEvent.click(screen.getByRole('button', { name: 'Foto 3' }))
    expect(screen.getByTestId('selected-index').textContent).toBe('2')
    expect(screen.getByRole('button', { name: 'Foto 3' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Foto 1' }).getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByRole('button', { name: 'Abrir galeria na foto 3' })).not.toBeNull()
  })

  it('updates the active thumbnail after keyboard activation', () => {
    renderControlledMedia(photos(7))
    const thumbnail = screen.getByRole('button', { name: 'Foto 4' })
    thumbnail.focus()
    fireEvent.click(thumbnail, { detail: 0 })
    expect(document.activeElement).toBe(thumbnail)
    expect(screen.getByTestId('selected-index').textContent).toBe('3')
    expect(screen.getByRole('button', { name: 'Foto 4' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('does not change selection when the pointer only hovers a thumbnail', () => {
    renderControlledMedia(photos(7))
    const first = screen.getByRole('button', { name: 'Foto 1' })
    const third = screen.getByRole('button', { name: 'Foto 3' })

    fireEvent.mouseEnter(third)
    fireEvent.mouseOver(third)
    expect(screen.getByTestId('selected-index').textContent).toBe('0')
    expect(first.getAttribute('aria-pressed')).toBe('true')
    expect(third.getAttribute('aria-pressed')).toBe('false')
  })

  it.each([0, 11])('opens +N at index 7 regardless of previous selection %i', (index) => {
    renderControlledMedia(photos(12), index)
    const more = screen.getByRole('button', { name: 'Abrir galeria na foto 8, mais 5 fotos' })

    fireEvent.click(more)
    expect(screen.getByTestId('selected-index').textContent).toBe('7')
    expect(screen.getByTestId('requested-gallery-index').textContent).toBe('7')
    expect(more.getAttribute('aria-pressed')).toBe('true')
  })

  it('opens the selected main photo and exposes an accessible current-photo name', () => {
    const { onOpenGallery, primaryRef } = renderControlledMedia(photos(7), 3)
    const main = screen.getByRole('button', { name: 'Abrir galeria na foto 4' })

    expect(main.getAttribute('aria-haspopup')).toBe('dialog')
    expect(primaryRef).toHaveBeenCalledWith(main)
    expect(screen.getByRole('img', { name: 'Relógio de teste' }).getAttribute('src')).toBe('/photo-4.webp')
    fireEvent.click(main)
    expect(screen.getByTestId('requested-gallery-index').textContent).toBe('3')
    expect(onOpenGallery).toHaveBeenCalledWith(3, main)
  })

  it('suppresses gallery activation after dragging the main photo', () => {
    const { onOpenGallery } = renderControlledMedia(photos(9))
    const main = screen.getByRole('button', { name: 'Abrir galeria na foto 1' })

    fireEvent.pointerDown(main, { button: 0, clientX: 100, clientY: 100 })
    fireEvent.pointerMove(main, { button: 0, clientX: 110, clientY: 100 })
    fireEvent.pointerUp(main, { button: 0, clientX: 110, clientY: 100 })
    fireEvent.click(main, { detail: 1 })

    expect(onOpenGallery).not.toHaveBeenCalled()
    expect(screen.getByTestId('selected-index').textContent).toBe('0')
    expect(screen.getByTestId('requested-gallery-index').textContent).toBe('closed')
  })

  it('has no desktop carousel arrows, dots, or photo counter', () => {
    renderMedia(photos(9))
    expect(screen.queryByRole('button', { name: 'Anterior' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Próxima' })).toBeNull()
    expect(screen.queryByText(/^\d+\s*\/\s*\d+$/)).toBeNull()
    expect(screen.queryByRole('list', { name: /página|bolinha/i })).toBeNull()
  })

  it('presents a vertical thumbnail column beside the main photo (CATREF-16)', () => {
    renderMedia(photos(3))
    const media = screen.getByTestId('desktop-product-media')
    const group = screen.getByRole('group', { name: 'Miniaturas do produto' })
    const main = screen.getByRole('button', { name: 'Abrir galeria na foto 1' })
    const mediaTokens = media.className.split(/\s+/)
    const groupTokens = group.className.split(/\s+/)

    expect(groupTokens).toContain('flex-col')
    expect(groupTokens).not.toContain('flex-row')
    expect(mediaTokens).toContain('flex')
    expect(mediaTokens).not.toContain('flex-col')
    expect(media.contains(group)).toBe(true)
    expect(media.contains(main)).toBe(true)
    expect(group.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('offers a name, visible focus, and keyboard activation for thumbnails, +N, and the main photo (CATREF-71)', () => {
    renderControlledMedia(photos(9))
    const thumbnail = screen.getByRole('button', { name: 'Foto 2' })
    const more = screen.getByRole('button', { name: 'Abrir galeria na foto 8, mais 2 fotos' })
    const main = screen.getByRole('button', { name: 'Abrir galeria na foto 1' })

    expect(thumbnail.className).toMatch(/focus-visible:ring/)
    expect(more.className).toMatch(/focus-visible:ring/)
    expect(main.className).toMatch(/focus-visible:ring/)

    thumbnail.focus()
    expect(document.activeElement).toBe(thumbnail)
    fireEvent.click(thumbnail, { detail: 0 })
    expect(screen.getByTestId('selected-index').textContent).toBe('1')
    expect(screen.getByRole('button', { name: 'Foto 2' }).getAttribute('aria-pressed')).toBe('true')

    const selectedMain = screen.getByRole('button', { name: 'Abrir galeria na foto 2' })
    selectedMain.focus()
    expect(document.activeElement).toBe(selectedMain)
    fireEvent.click(selectedMain, { detail: 0 })
    expect(screen.getByTestId('requested-gallery-index').textContent).toBe('1')

    more.focus()
    expect(document.activeElement).toBe(more)
    fireEvent.click(more, { detail: 0 })
    expect(screen.getByTestId('requested-gallery-index').textContent).toBe('7')
    expect(more.getAttribute('aria-pressed')).toBe('true')
  })
})
