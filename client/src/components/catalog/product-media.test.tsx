import { act } from 'react'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductMedia } from './product-media'

const photos = Array.from({ length: 12 }, (_, index) => `foto-${index + 1}.webp`)
let width = 921
let reduced = false
const listeners = new Set<() => void>()

function resize(next: number) {
  width = next
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
  act(() => { listeners.forEach((listener) => listener()) })
}

function Product({ slug = 'watch', images = photos }: { slug?: string; images?: string[] }) {
  return <ProductMedia key={slug} images={images} alt="Seculus">
    {({ media, isDesktop }) => isDesktop
      ? <section aria-label="Desktop">{media}<button>Oferta desktop</button></section>
      : <article aria-label="Mobile"><button>Oferta mobile</button>{media}</article>}
  </ProductMedia>
}

function mount(images = photos) {
  const root = document.createElement('div')
  root.id = 'root'
  document.body.append(root)
  return { root, ...render(<Product images={images} />, { container: root }) }
}

function main() {
  return screen.queryByTestId('desktop-product-main') ?? screen.getByTestId('carousel-frame')
}

function open() {
  const trigger = main()
  trigger.focus()
  if (width >= 921) fireEvent.click(trigger)
  else fireEvent.keyDown(trigger, { key: 'Enter' })
  return trigger
}

function selected() {
  return within(main()).getByRole('img', { name: 'Seculus' }).getAttribute('src')
}

function dialog() { return screen.getByRole('dialog', { name: 'Galeria de fotos' }) }
function galleryPhoto() { return within(dialog()).getByRole('img', { name: 'Seculus' }).getAttribute('src') }

beforeAll(() => {
  if (typeof window.PointerEvent !== 'function') {
    window.PointerEvent = class PointerEvent extends MouseEvent {} as typeof PointerEvent
  }
})

beforeEach(() => {
  width = 921
  reduced = false
  listeners.clear()
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
    get matches() { return query === '(min-width: 921px)' ? width >= 921 : query === '(hover: hover)' || reduced && query === '(prefers-reduced-motion: reduce)' },
    media: query,
    addEventListener: (_event: string, listener: () => void) => { if (query === '(min-width: 921px)') listeners.add(listener) },
    removeEventListener: (_event: string, listener: () => void) => { if (query === '(min-width: 921px)') listeners.delete(listener) },
  })))
  resize(921)
})

afterEach(() => {
  cleanup()
  document.body.replaceChildren()
  document.body.style.overflow = ''
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('ProductMedia shared owner (CATREF-21–31, 40, 47–51, 71, 73)', () => {
  it.each([1, 7, 8, 9, 12])('initializes the first photo and the desktop thumbnail set for %i photos', (count) => {
    mount(photos.slice(0, count))
    expect(selected()).toBe(photos[0])
    expect(screen.queryByRole('dialog')).toBeNull()
    const thumbnails = screen.getByRole('group', { name: 'Miniaturas do produto' })
    expect(within(thumbnails).getAllByRole('button').length).toBe(count > 8 ? 8 : count)
    expect(within(thumbnails).getByRole('button', { name: 'Foto 1' }).getAttribute('aria-pressed')).toBe('true')
    if (count > 8) expect(within(thumbnails).getByRole('button', { name: `Abrir galeria na foto 8, mais ${count - 7} fotos` }).textContent).toBe(`+${count - 7}`)
    expect(screen.queryByTestId('watch-carousel')).toBeNull()
    expect(screen.queryByTestId('carousel-count')).toBeNull()
  })

  it('selects a thumbnail on activation, without selecting on hover', () => {
    mount()
    const third = screen.getByRole('button', { name: 'Foto 3' })
    fireEvent.pointerEnter(third)
    expect(selected()).toBe(photos[0])
    fireEvent.click(third)
    expect(selected()).toBe(photos[2])
    expect(third.getAttribute('aria-pressed')).toBe('true')
    expect(screen.queryByRole('dialog')).toBeNull()
    open()
    expect(galleryPhoto()).toBe(photos[2])
  })

  it('opens +N at photo eight every time and synchronizes a later selection on closing', () => {
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'Foto 3' }))
    fireEvent.click(screen.getByRole('button', { name: 'Abrir galeria na foto 8, mais 5 fotos' }))
    expect(galleryPhoto()).toBe(photos[7])
    fireEvent.keyDown(document, { key: 'ArrowRight' })
    expect(galleryPhoto()).toBe(photos[8])
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Fechar' }))
    expect(selected()).toBe(photos[8])
    const more = screen.getByRole('button', { name: 'Abrir galeria na foto 8, mais 5 fotos' })
    expect(more.getAttribute('aria-pressed')).toBe('true')
    expect(document.activeElement).toBe(more)
    fireEvent.click(more)
    expect(galleryPhoto()).toBe(photos[7])
  })

  it.each(['button', 'escape', 'backdrop'])('isolates one gallery, locks scroll, and restores focus after %s close', (method) => {
    const { root } = mount()
    document.body.style.overflow = 'scroll'
    const trigger = open()
    expect(screen.getAllByRole('dialog').length).toBe(1)
    expect(document.activeElement).toBe(dialog())
    expect(root.hasAttribute('inert')).toBe(true)
    expect(document.body.style.overflow).toBe('hidden')
    if (method === 'button') fireEvent.click(within(dialog()).getByRole('button', { name: 'Fechar' }))
    else if (method === 'escape') fireEvent.keyDown(document, { key: 'Escape' })
    else fireEvent.click(dialog())
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(root.hasAttribute('inert')).toBe(false)
    expect(document.body.style.overflow).toBe('scroll')
    expect(document.activeElement).toBe(trigger)
  })

  it('preserves the previous inert attribute and restores it on unmount', () => {
    const { root, unmount } = mount()
    root.setAttribute('inert', 'previous')
    open()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(root.getAttribute('inert')).toBe('previous')
    open()
    unmount()
    expect(root.getAttribute('inert')).toBe('previous')
    expect(document.body.style.overflow).toBe('')
    expect(listeners.size).toBe(0)
  })

  it.each([920, 921])('preserves selection and the closed modal across both breakpoints starting at %i', (initial) => {
    resize(initial)
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'Foto 3' }))
    for (const next of [initial === 920 ? 921 : 920, initial]) {
      resize(next)
      expect(selected()).toBe(photos[2])
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(screen.getByRole(next >= 921 ? 'region' : 'article', { name: next >= 921 ? 'Desktop' : 'Mobile' })).toBeTruthy()
    }
  })

  it.each([920, 921])('keeps the same open gallery and internal zoom across 920/921 starting at %i', (initial) => {
    resize(initial)
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'Foto 3' }))
    const trigger = open()
    const modal = dialog()
    const viewport = screen.getByTestId('watch-gallery-viewport')
    const frame = screen.getByTestId('watch-gallery-frame')
    vi.spyOn(frame, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 0, left: 0, top: 0, width: 400, height: 400, right: 400, bottom: 400, toJSON() {} })
    fireEvent.wheel(frame, { ctrlKey: true, deltaY: -100, clientX: 200, clientY: 200 })
    const zoom = viewport.style.transform
    expect(zoom).not.toContain('scale(1)')
    resize(initial === 920 ? 921 : 920)
    expect(dialog()).toBe(modal)
    expect(screen.getAllByRole('dialog').length).toBe(1)
    expect(viewport.style.transform).toBe(zoom)
    expect(galleryPhoto()).toBe(photos[2])
    expect(trigger.isConnected).toBe(false)
    fireEvent.keyDown(document, { key: 'ArrowRight' })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(selected()).toBe(photos[3])
    expect(document.activeElement).toBe(main())
  })

  it('resets selection and modal for a new slug', () => {
    const { rerender } = mount()
    fireEvent.click(screen.getByRole('button', { name: 'Foto 3' }))
    open()
    rerender(<Product slug="another-watch" />)
    expect(selected()).toBe(photos[0])
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.body.style.overflow).toBe('')
    expect(document.getElementById('root')?.hasAttribute('inert')).toBe(false)
  })

  it.each([920, 921])('opens and restores focus with one photo at %i without navigation', (initial) => {
    resize(initial)
    mount(photos.slice(0, 1))
    const trigger = open()
    expect(galleryPhoto()).toBe(photos[0])
    expect(within(dialog()).queryByRole('button', { name: 'Seguinte' })).toBeNull()
    expect(within(dialog()).queryByRole('button', { name: 'Anterior' })).toBeNull()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(document.activeElement).toBe(trigger)
    expect(selected()).toBe(photos[0])
  })

  it('preserves reduced motion for both carousel and gallery navigation', () => {
    reduced = true
    resize(920)
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'Foto 3' }))
    expect(screen.getByTestId('carousel-track').style.transitionDuration).toBe('0ms')
    open()
    fireEvent.keyDown(document, { key: 'ArrowRight' })
    expect(screen.getByTestId('watch-gallery-track').style.transitionDuration).toBe('0ms')
    expect(galleryPhoto()).toBe(photos[3])
  })

  it('falls back to the main image when a connected gallery trigger becomes hidden', () => {
    mount()
    const trigger = screen.getByRole('button', { name: 'Abrir galeria na foto 8, mais 5 fotos' })
    fireEvent.click(trigger)
    trigger.style.display = 'none'
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(trigger.isConnected).toBe(true)
    expect(document.activeElement).toBe(main())
  })

  it('removes the active hover lens, portal and pending work on opening the gallery', () => {
    const callbacks = new Map<number, FrameRequestCallback>()
    let nextFrame = 0
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callbacks.set(++nextFrame, callback); return nextFrame })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => callbacks.delete(id))
    vi.stubGlobal('PointerEvent', class extends MouseEvent {
      pointerType: string
      constructor(type: string, init: PointerEventInit) { super(type, init); this.pointerType = init.pointerType ?? '' }
    })
    mount()
    const stage = screen.getByTestId('hover-zoom-stage')
    vi.spyOn(stage, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 0, width: 400, height: 400 } as DOMRect)
    const image = within(stage).getByRole('img')
    Object.defineProperties(image, { naturalWidth: { value: 800 }, naturalHeight: { value: 800 } })
    fireEvent.load(image)
    fireEvent.pointerMove(stage, { clientX: 200, clientY: 200, pointerType: 'mouse' })
    act(() => { const pending = [...callbacks.values()]; callbacks.clear(); pending.forEach(callback => callback(0)) })
    expect(screen.queryByTestId('hover-zoom-lens')).not.toBeNull()
    expect(screen.queryByTestId('hover-zoom-frame')).not.toBeNull()
    fireEvent.pointerMove(stage, { clientX: 210, clientY: 210, pointerType: 'mouse' })
    expect(callbacks.size).toBe(1)
    open()
    expect(screen.queryByTestId('hover-zoom-lens')).toBeNull()
    expect(screen.queryByTestId('hover-zoom-frame')).toBeNull()
    expect(callbacks.size).toBe(0)
    expect(galleryPhoto()).toBe(photos[0])
    resize(920)
    expect(screen.queryByTestId('hover-zoom-stage')).toBeNull()
    expect(screen.queryByTestId('hover-zoom-frame')).toBeNull()
  })

  it('does not navigate or open the desktop main image after a drag', () => {
    mount()
    fireEvent.pointerDown(main(), { clientX: 100, clientY: 100, button: 0 })
    fireEvent.pointerMove(main(), { clientX: 200, clientY: 100 })
    fireEvent.pointerUp(main(), { clientX: 200, clientY: 100 })
    fireEvent.click(main(), { detail: 1 })
    expect(selected()).toBe(photos[0])
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
