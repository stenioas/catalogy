import { describe, expect, it } from 'vitest'

import {
  calculateZoomGeometry,
  type Rect,
  type ZoomGeometry,
} from './zoom-geometry'

type GeometryInput = Parameters<typeof calculateZoomGeometry>[0]

function expectRectWithinOnePixel(actual: Rect, expected: Rect) {
  for (const coordinate of ['x', 'y', 'width', 'height'] as const) {
    expect(Math.abs(actual[coordinate] - expected[coordinate])).toBeLessThanOrEqual(1)
  }
}

function expectGeometryWithinOnePixel(
  actual: ZoomGeometry | null,
  expected: ZoomGeometry,
) {
  expect(actual).not.toBeNull()
  if (actual === null) return

  expect(actual.scale).toBeCloseTo(expected.scale, 4)
  expect(actual.scale).toBeGreaterThan(1)
  expectRectWithinOnePixel(actual.image, expected.image)
  expectRectWithinOnePixel(actual.lens, expected.lens)
  expectRectWithinOnePixel(actual.frame, expected.frame)
  expectRectWithinOnePixel(actual.source, expected.source)
}

const stage: Rect = { x: 0, y: 0, width: 400, height: 400 }
const viewport = { width: 1000, height: 800 }

type EdgeScenario = {
  name: string
  natural: GeometryInput['natural']
  pointer: GeometryInput['pointer']
  expected: ZoomGeometry
}

const orientationScenarios: EdgeScenario[] = [
  {
    name: 'square photo at center',
    natural: { width: 800, height: 800 },
    pointer: { x: 200, y: 200 },
    expected: {
      image: { x: 0, y: 0, width: 400, height: 400 },
      lens: { x: 120, y: 93.3333, width: 160, height: 213.3333 },
      frame: { x: 412, y: 12, width: 320, height: 426.6667 },
      scale: 2,
      source: { x: 240, y: 186.6667, width: 320, height: 426.6667 },
    },
  },
  {
    name: 'square photo at the left border',
    natural: { width: 800, height: 800 },
    pointer: { x: 0, y: 200 },
    expected: {
      image: { x: 0, y: 0, width: 400, height: 400 },
      lens: { x: 0, y: 93.3333, width: 160, height: 213.3333 },
      frame: { x: 412, y: 12, width: 320, height: 426.6667 },
      scale: 2,
      source: { x: 0, y: 186.6667, width: 320, height: 426.6667 },
    },
  },
  {
    name: 'square photo at the top border',
    natural: { width: 800, height: 800 },
    pointer: { x: 200, y: 0 },
    expected: {
      image: { x: 0, y: 0, width: 400, height: 400 },
      lens: { x: 120, y: 0, width: 160, height: 213.3333 },
      frame: { x: 412, y: 12, width: 320, height: 426.6667 },
      scale: 2,
      source: { x: 240, y: 0, width: 320, height: 426.6667 },
    },
  },
  {
    name: 'square photo at the right border',
    natural: { width: 800, height: 800 },
    pointer: { x: 400, y: 200 },
    expected: {
      image: { x: 0, y: 0, width: 400, height: 400 },
      lens: { x: 240, y: 93.3333, width: 160, height: 213.3333 },
      frame: { x: 412, y: 12, width: 320, height: 426.6667 },
      scale: 2,
      source: { x: 480, y: 186.6667, width: 320, height: 426.6667 },
    },
  },
  {
    name: 'square photo at the bottom border',
    natural: { width: 800, height: 800 },
    pointer: { x: 200, y: 400 },
    expected: {
      image: { x: 0, y: 0, width: 400, height: 400 },
      lens: { x: 120, y: 186.6667, width: 160, height: 213.3333 },
      frame: { x: 412, y: 12, width: 320, height: 426.6667 },
      scale: 2,
      source: { x: 240, y: 373.3333, width: 320, height: 426.6667 },
    },
  },
  {
    name: 'horizontal photo at center',
    natural: { width: 800, height: 400 },
    pointer: { x: 200, y: 200 },
    expected: {
      image: { x: 0, y: 100, width: 400, height: 200 },
      lens: { x: 125, y: 100, width: 150, height: 200 },
      frame: { x: 412, y: 100, width: 320, height: 426.6667 },
      scale: 32 / 15,
      source: { x: 250, y: 0, width: 300, height: 400 },
    },
  },
  {
    name: 'horizontal photo at the left border',
    natural: { width: 800, height: 400 },
    pointer: { x: 0, y: 200 },
    expected: {
      image: { x: 0, y: 100, width: 400, height: 200 },
      lens: { x: 0, y: 100, width: 150, height: 200 },
      frame: { x: 412, y: 100, width: 320, height: 426.6667 },
      scale: 32 / 15,
      source: { x: 0, y: 0, width: 300, height: 400 },
    },
  },
  {
    name: 'horizontal photo at the top border',
    natural: { width: 800, height: 400 },
    pointer: { x: 200, y: 100 },
    expected: {
      image: { x: 0, y: 100, width: 400, height: 200 },
      lens: { x: 125, y: 100, width: 150, height: 200 },
      frame: { x: 412, y: 100, width: 320, height: 426.6667 },
      scale: 32 / 15,
      source: { x: 250, y: 0, width: 300, height: 400 },
    },
  },
  {
    name: 'horizontal photo at the right border',
    natural: { width: 800, height: 400 },
    pointer: { x: 400, y: 200 },
    expected: {
      image: { x: 0, y: 100, width: 400, height: 200 },
      lens: { x: 250, y: 100, width: 150, height: 200 },
      frame: { x: 412, y: 100, width: 320, height: 426.6667 },
      scale: 32 / 15,
      source: { x: 500, y: 0, width: 300, height: 400 },
    },
  },
  {
    name: 'horizontal photo at the bottom border',
    natural: { width: 800, height: 400 },
    pointer: { x: 200, y: 300 },
    expected: {
      image: { x: 0, y: 100, width: 400, height: 200 },
      lens: { x: 125, y: 100, width: 150, height: 200 },
      frame: { x: 412, y: 100, width: 320, height: 426.6667 },
      scale: 32 / 15,
      source: { x: 250, y: 0, width: 300, height: 400 },
    },
  },
  {
    name: 'vertical photo at center',
    natural: { width: 400, height: 800 },
    pointer: { x: 200, y: 200 },
    expected: {
      image: { x: 100, y: 0, width: 200, height: 400 },
      lens: { x: 120, y: 93.3333, width: 160, height: 213.3333 },
      frame: { x: 412, y: 12, width: 320, height: 426.6667 },
      scale: 2,
      source: { x: 40, y: 186.6667, width: 320, height: 426.6667 },
    },
  },
  {
    name: 'vertical photo at the left border',
    natural: { width: 400, height: 800 },
    pointer: { x: 100, y: 200 },
    expected: {
      image: { x: 100, y: 0, width: 200, height: 400 },
      lens: { x: 100, y: 93.3333, width: 160, height: 213.3333 },
      frame: { x: 412, y: 12, width: 320, height: 426.6667 },
      scale: 2,
      source: { x: 0, y: 186.6667, width: 320, height: 426.6667 },
    },
  },
  {
    name: 'vertical photo at the top border',
    natural: { width: 400, height: 800 },
    pointer: { x: 200, y: 0 },
    expected: {
      image: { x: 100, y: 0, width: 200, height: 400 },
      lens: { x: 120, y: 0, width: 160, height: 213.3333 },
      frame: { x: 412, y: 12, width: 320, height: 426.6667 },
      scale: 2,
      source: { x: 40, y: 0, width: 320, height: 426.6667 },
    },
  },
  {
    name: 'vertical photo at the right border',
    natural: { width: 400, height: 800 },
    pointer: { x: 300, y: 200 },
    expected: {
      image: { x: 100, y: 0, width: 200, height: 400 },
      lens: { x: 140, y: 93.3333, width: 160, height: 213.3333 },
      frame: { x: 412, y: 12, width: 320, height: 426.6667 },
      scale: 2,
      source: { x: 80, y: 186.6667, width: 320, height: 426.6667 },
    },
  },
  {
    name: 'vertical photo at the bottom border',
    natural: { width: 400, height: 800 },
    pointer: { x: 200, y: 400 },
    expected: {
      image: { x: 100, y: 0, width: 200, height: 400 },
      lens: { x: 120, y: 186.6667, width: 160, height: 213.3333 },
      frame: { x: 412, y: 12, width: 320, height: 426.6667 },
      scale: 2,
      source: { x: 40, y: 373.3333, width: 320, height: 426.6667 },
    },
  },
]

describe('calculateZoomGeometry', () => {
  it.each(orientationScenarios)('$name', ({ natural, pointer, expected }) => {
    expectGeometryWithinOnePixel(
      calculateZoomGeometry({ stage, natural, viewport, pointer }),
      expected,
    )
  })

  it.each([
    { name: 'letterbox above a horizontal photo', pointer: { x: 200, y: 50 } },
    { name: 'letterbox below a horizontal photo', pointer: { x: 200, y: 350 } },
  ])('returns null for a pointer in $name', ({ pointer }) => {
    expect(
      calculateZoomGeometry({
        stage,
        natural: { width: 800, height: 400 },
        viewport,
        pointer,
      }),
    ).toBeNull()
  })

  it('shrinks the frame to fit a low window height', () => {
    expectGeometryWithinOnePixel(
      calculateZoomGeometry({
        stage,
        natural: { width: 800, height: 800 },
        viewport: { width: 1000, height: 320 },
        pointer: { x: 200, y: 200 },
      }),
      {
        image: { x: 0, y: 0, width: 400, height: 400 },
        lens: { x: 144.5, y: 126, width: 111, height: 148 },
        frame: { x: 412, y: 12, width: 222, height: 296 },
        scale: 2,
        source: { x: 289, y: 252, width: 222, height: 296 },
      },
    )
  })

  it('shrinks the frame to fit a narrow window', () => {
    expectGeometryWithinOnePixel(
      calculateZoomGeometry({
        stage,
        natural: { width: 800, height: 800 },
        viewport: { width: 500, height: 800 },
        pointer: { x: 200, y: 200 },
      }),
      {
        image: { x: 0, y: 0, width: 400, height: 400 },
        lens: { x: 181, y: 174.6667, width: 38, height: 50.6667 },
        frame: { x: 412, y: 12, width: 76, height: 101.3333 },
        scale: 2,
        source: { x: 362, y: 349.3333, width: 76, height: 101.3333 },
      },
    )
  })

  it('keeps the frame inside a 920px viewport beside a desktop media stage', () => {
    const geometry = calculateZoomGeometry({
      stage: { x: 92, y: 20, width: 441, height: 441 },
      natural: { width: 882, height: 882 },
      viewport: { width: 920, height: 600 },
      pointer: { x: 312.5, y: 240.5 },
    })

    expectGeometryWithinOnePixel(geometry, {
      image: { x: 92, y: 20, width: 441, height: 441 },
      lens: { x: 232.5, y: 133.8333, width: 160, height: 213.3333 },
      frame: { x: 545, y: 20, width: 320, height: 426.6667 },
      scale: 2,
      source: { x: 281, y: 227.6667, width: 320, height: 426.6667 },
    })
    if (geometry !== null) {
      expect(geometry.frame.x + geometry.frame.width).toBeLessThanOrEqual(920 - 12)
      expect(geometry.frame.y + geometry.frame.height).toBeLessThanOrEqual(600 - 12)
    }
  })

  it('returns null when the viewport leaves no positive frame width', () => {
    expect(
      calculateZoomGeometry({
        stage,
        natural: { width: 800, height: 800 },
        viewport: { width: 424, height: 800 },
        pointer: { x: 200, y: 200 },
      }),
    ).toBeNull()
  })

  const invalidInputs: Array<[string, GeometryInput]> = [
    [
      'zero stage width',
      { stage: { ...stage, width: 0 }, natural: { width: 800, height: 800 }, viewport, pointer: { x: 200, y: 200 } },
    ],
    [
      'negative stage height',
      { stage: { ...stage, height: -1 }, natural: { width: 800, height: 800 }, viewport, pointer: { x: 200, y: 200 } },
    ],
    [
      'zero natural width',
      { stage, natural: { width: 0, height: 800 }, viewport, pointer: { x: 200, y: 200 } },
    ],
    [
      'negative natural height',
      { stage, natural: { width: 800, height: -1 }, viewport, pointer: { x: 200, y: 200 } },
    ],
    [
      'zero viewport width',
      { stage, natural: { width: 800, height: 800 }, viewport: { width: 0, height: 800 }, pointer: { x: 200, y: 200 } },
    ],
    [
      'negative viewport height',
      { stage, natural: { width: 800, height: 800 }, viewport: { width: 1000, height: -1 }, pointer: { x: 200, y: 200 } },
    ],
    [
      'non-finite natural width',
      { stage, natural: { width: Number.NaN, height: 800 }, viewport, pointer: { x: 200, y: 200 } },
    ],
    [
      'infinite viewport height',
      { stage, natural: { width: 800, height: 800 }, viewport: { width: 1000, height: Number.POSITIVE_INFINITY }, pointer: { x: 200, y: 200 } },
    ],
  ]

  it.each(invalidInputs)('returns null for %s', (_name, input) => {
    expect(calculateZoomGeometry(input)).toBeNull()
  })
})
