import { describe, expect, it } from 'vitest'

import {
  DOUBLE_TAP_MS,
  DRAG_THRESHOLD_PX,
  clampScale,
  panWithin,
  pinchScale,
  rubberBand,
  rubberStretch,
  slideDuration,
  wheelScale,
  zoomToward,
} from './motion'

describe('gallery motion math', () => {
  it('uses the 40px drag threshold and 300ms double-tap window', () => {
    expect(DRAG_THRESHOLD_PX).toBe(40)
    expect(DOUBLE_TAP_MS).toBe(300)
  })

  it('uses 200ms unless reduced motion is requested', () => {
    expect(slideDuration(false)).toBe('200ms')
    expect(slideDuration(true)).toBe('0ms')
  })

  it('applies the exponential rubber band in both directions', () => {
    const pullAt40 = 56 * (1 - Math.exp(-40 / 160))

    expect(rubberBand(40)).toBeCloseTo(pullAt40)
    expect(rubberBand(-40)).toBeCloseTo(-pullAt40)
    expect(rubberBand(0)).toBe(0)
  })

  it('caps rubber-band input at 280px', () => {
    expect(rubberBand(500)).toBeCloseTo(56 * (1 - Math.exp(-280 / 160)))
    expect(rubberBand(-500)).toBeCloseTo(-56 * (1 - Math.exp(-280 / 160)))
  })

  it('stretches in proportion to the rubber-band pull', () => {
    expect(rubberStretch(0)).toBe(1)
    expect(rubberStretch(56)).toBeCloseTo(1.08)
    expect(rubberStretch(-56)).toBeCloseTo(1.08)
  })

  it('clamps scale to the closed interval from 1 to 3', () => {
    expect(clampScale(0.5)).toBe(1)
    expect(clampScale(1)).toBe(1)
    expect(clampScale(2)).toBe(2)
    expect(clampScale(3)).toBe(3)
    expect(clampScale(4)).toBe(3)
  })

  it('changes wheel scale by deltaY divided by 400 and clamps both ends', () => {
    expect(wheelScale(1, -100)).toBe(1.25)
    expect(wheelScale(2, -400)).toBe(3)
    expect(wheelScale(2, 400)).toBe(1)
  })

  it('changes pinch scale by the distance ratio and clamps both ends', () => {
    expect(pinchScale(2, 100, 125)).toBe(2.5)
    expect(pinchScale(2, 100, 150)).toBe(3)
    expect(pinchScale(2, 100, 25)).toBe(1)
  })

  it('keeps the starting scale when the starting pinch distance is zero', () => {
    expect(pinchScale(2, 0, 50)).toBe(2)
    expect(pinchScale(4, 0, 50)).toBe(3)
  })

  it('keeps the pointer position fixed while zooming within the frame', () => {
    expect(
      zoomToward(
        { scale: 2, tx: 0, ty: 0 },
        3,
        25,
        -10,
        100,
      ),
    ).toEqual({ scale: 3, tx: -12.5, ty: 5 })
  })

  it('clips zoom translation to half the scaled frame overflow', () => {
    expect(zoomToward({ scale: 1, tx: 0, ty: 0 }, 3, 1_000, -1_000, 100)).toEqual({
      scale: 3,
      tx: -100,
      ty: 100,
    })
  })

  it('resets translation when zoom returns to 1x', () => {
    expect(zoomToward({ scale: 3, tx: 80, ty: -80 }, 1, 20, 30, 100)).toEqual({
      scale: 1,
      tx: 0,
      ty: 0,
    })
  })

  it('pans by the requested distance while remaining within the frame', () => {
    expect(panWithin(0, 0, 20, -15, 2, 100)).toEqual({ scale: 2, tx: 20, ty: -15 })
    expect(panWithin(40, -40, 100, -100, 3, 100)).toEqual({
      scale: 3,
      tx: 100,
      ty: -100,
    })
  })

  it('does not allow panning at 1x', () => {
    expect(panWithin(20, -20, 10, -10, 1, 100)).toEqual({ scale: 1, tx: 0, ty: 0 })
  })
})
