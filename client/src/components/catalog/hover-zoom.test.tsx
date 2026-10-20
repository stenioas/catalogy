import { act } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { HoverZoom } from './hover-zoom'

let hover = true
let callbacks: Map<number, FrameRequestCallback>
let nextFrame: number
let stageBox: DOMRect

function stage() { return screen.getByTestId('hover-zoom-stage') }
function lens() { return screen.queryByTestId('hover-zoom-lens') }
function frame() { return screen.queryByTestId('hover-zoom-frame') }
function load(width = 800, height = 800) {
  const image = screen.getByRole('img', { name: 'Relógio' })
  Object.defineProperties(image, {
    naturalWidth: { configurable: true, value: width },
    naturalHeight: { configurable: true, value: height },
  })
  fireEvent.load(image)
}
function move(x = 200, y = 200, pointerType = 'mouse') {
  fireEvent.pointerMove(stage(), { clientX: x, clientY: y, pointerType })
}
function flush() {
  act(() => {
    const pending = [...callbacks.values()]
    callbacks.clear()
    pending.forEach(callback => callback(0))
  })
}
function ready() {
  const view = render(<HoverZoom src="photo.webp" alt="Relógio" />)
  load()
  return view
}

beforeEach(() => {
  hover = true
  nextFrame = 0
  callbacks = new Map()
  stageBox = { x: 0, y: 0, width: 400, height: 400 } as DOMRect
  vi.stubGlobal('innerWidth', 1000)
  vi.stubGlobal('innerHeight', 800)
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: hover, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
  vi.stubGlobal('PointerEvent', class extends MouseEvent {
    pointerType: string
    constructor(type: string, init: PointerEventInit) { super(type, init); this.pointerType = init.pointerType ?? '' }
  })
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
    callbacks.set(++nextFrame, callback)
    return nextFrame
  }))
  vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => callbacks.delete(id)))
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => stageBox)
})
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('HoverZoom (CATREF-32–41)', () => {
  it('shows a square dark lens and the matching original crop in a non-interactive portal', () => {
    const { container } = ready()
    move(); flush()
    expect(lens()?.style.left).toBe('81px')
    expect(parseFloat(lens()!.style.top)).toBeCloseTo(81, 3)
    expect(lens()?.style.width).toBe('238px')
    expect(parseFloat(lens()!.style.height)).toBeCloseTo(238, 3)
    expect(lens()?.style.background).toBe('var(--surface-black)')
    expect(lens()?.style.opacity).toBe('0.25')
    expect(stage().style.cursor).toBe('zoom-in')
    expect(container.contains(frame())).toBe(false)
    expect(frame()?.parentElement).toBe(document.body)
    expect(frame()?.style.position).toBe('fixed')
    expect(frame()?.style.pointerEvents).toBe('none')
    expect(frame()?.style.left).toBe('412px')
    expect(frame()?.style.top).toBe('12px')
    const crop = frame()!.querySelector('img')!
    expect(crop.getAttribute('src')).toBe('photo.webp')
    expect(crop.style.width).toBe('800px')
    expect(crop.style.height).toBe('800px')
    const translation = /^translate\((-?[\d.]+)px, (-?[\d.]+)px\)$/.exec(crop.style.transform)
    expect(translation).not.toBeNull()
    expect(Number(translation![1])).toBeCloseTo(-162, 3)
    expect(Number(translation![2])).toBeCloseTo(-162, 3)
  })
  it.each(['touch', 'pen'])('does not activate for %s', type => {
    ready(); move(200, 200, type); flush()
    expect(frame()).toBeNull(); expect(lens()).toBeNull()
  })
  it('does not activate without hover', () => {
    hover = false; ready(); move(); flush()
    expect(frame()).toBeNull()
  })
  it('does not activate below 920px', () => {
    vi.stubGlobal('innerWidth', 919); ready(); move(); flush()
    expect(frame()).toBeNull()
  })
  it('waits for natural dimensions and removes overlays on image failure', () => {
    render(<HoverZoom src="photo.webp" alt="Relógio" />)
    move(); flush(); expect(frame()).toBeNull()
    load(); move(); flush(); expect(frame()).not.toBeNull()
    fireEvent.error(screen.getByRole('img', { name: 'Relógio' }))
    expect(frame()).toBeNull(); expect(lens()).toBeNull()
  })
  it('excludes contain whitespace and clamps the lens to the effective image', () => {
    ready(); load(800, 400)
    move(200, 50); flush(); expect(frame()).toBeNull()
    move(400, 300); flush()
    expect(lens()?.style.left).toBe('200px')
    expect(parseFloat(lens()!.style.top)).toBeCloseTo(100, 3)
    expect(lens()?.style.width).toBe('200px')
    expect(parseFloat(lens()!.style.height)).toBeCloseTo(200, 3)
  })
  it('coalesces moves in one RAF and renders the latest pointer', () => {
    ready(); move(100, 100); move(200, 200); move(390, 390)
    expect(callbacks.size).toBe(1)
    flush()
    expect(lens()?.style.left).toBe('162px')
    expect(parseFloat(lens()!.style.top)).toBeCloseTo(162, 3)
    expect(callbacks.size).toBe(0)
  })
  it.each(['pointerLeave', 'pointerCancel'] as const)('%s removes overlays and pending RAF', event => {
    ready(); move(); flush(); move(250, 250)
    fireEvent[event](stage())
    expect(frame()).toBeNull(); expect(lens()).toBeNull(); expect(callbacks.size).toBe(0)
  })
  it('disabling for the gallery removes overlays and pending RAF', () => {
    const view = ready(); move(); flush(); move()
    view.rerender(<HoverZoom src="photo.webp" alt="Relógio" disabled />)
    expect(frame()).toBeNull(); expect(lens()).toBeNull(); expect(callbacks.size).toBe(0)
    move(); flush(); expect(frame()).toBeNull()
  })
  it('clears the previous photo dimensions while the next photo loads', () => {
    const view = ready(); move(); flush(); move()
    view.rerender(<HoverZoom src="next.webp" alt="Relógio" />)
    expect(frame()).toBeNull(); expect(callbacks.size).toBe(0)
    move(); flush(); expect(frame()).toBeNull()
    load(400, 800); move(); flush()
    expect(frame()?.querySelector('img')?.getAttribute('src')).toBe('next.webp')
    expect(lens()?.style.left).toBe('100px')
    expect(frame()?.querySelector('img')?.style.width).toBe('476px')
  })
  it('remeasures on scroll and resize and keeps the frame in the viewport', () => {
    ready(); move(); flush()
    stageBox = { x: 0, y: -100, width: 400, height: 400 } as DOMRect
    fireEvent.scroll(window); flush()
    expect(parseFloat(lens()!.style.top)).toBeCloseTo(162, 3)
    expect(frame()?.style.top).toBe('12px')
    vi.stubGlobal('innerWidth', 920); vi.stubGlobal('innerHeight', 300)
    fireEvent.resize(window); flush()
    expect(frame()?.style.width).toBe('276px')
    expect(frame()?.style.height).toBe('276px')
    vi.stubGlobal('innerWidth', 919)
    fireEvent.resize(window); flush(); expect(frame()).toBeNull()
  })
  it('unmount removes the portal and cancels outstanding work', () => {
    const view = ready(); move(); flush(); move()
    view.unmount()
    expect(frame()).toBeNull(); expect(callbacks.size).toBe(0)
    fireEvent.scroll(window); fireEvent.resize(window)
    expect(callbacks.size).toBe(0)
  })
})
