export const DRAG_THRESHOLD_PX = 40
export const DOUBLE_TAP_MS = 300

const RUBBER_MAX_PX = 56
const RUBBER_INPUT_LIMIT_PX = 280

export type Zoom = {
  scale: number
  tx: number
  ty: number
}

export function slideDuration(reduce: boolean): '0ms' | '200ms' {
  return reduce ? '0ms' : '200ms'
}

export function rubberBand(delta: number): number {
  const distance = Math.min(Math.abs(delta), RUBBER_INPUT_LIMIT_PX)
  return Math.sign(delta) * RUBBER_MAX_PX * (1 - Math.exp(-distance / 160))
}

export function rubberStretch(pullPx: number): number {
  return 1 + (Math.abs(pullPx) / RUBBER_MAX_PX) * 0.08
}

export function clampScale(scale: number): number {
  return Math.min(3, Math.max(1, scale))
}

export function wheelScale(scale: number, deltaY: number): number {
  return clampScale(scale - deltaY / 400)
}

export function pinchScale(
  startScale: number,
  startDistance: number,
  distance: number,
): number {
  if (startDistance === 0) return clampScale(startScale)
  return clampScale((startScale * distance) / startDistance)
}

function translationLimit(scale: number, frameSize: number): number {
  return (frameSize * (scale - 1)) / 2
}

function clampTranslation(value: number, limit: number): number {
  if (limit === 0) return 0
  return Math.min(limit, Math.max(-limit, value))
}

export function zoomToward(
  current: Zoom,
  nextScale: number,
  pointerFromCenterX: number,
  pointerFromCenterY: number,
  frameSize: number,
): Zoom {
  const scale = clampScale(nextScale)
  if (scale === 1) return { scale, tx: 0, ty: 0 }

  const ratio = scale / current.scale
  const limit = translationLimit(scale, frameSize)
  return {
    scale,
    tx: clampTranslation(
      pointerFromCenterX - (pointerFromCenterX - current.tx) * ratio,
      limit,
    ),
    ty: clampTranslation(
      pointerFromCenterY - (pointerFromCenterY - current.ty) * ratio,
      limit,
    ),
  }
}

export function panWithin(
  tx: number,
  ty: number,
  dx: number,
  dy: number,
  scale: number,
  frameSize: number,
): Zoom {
  const boundedScale = clampScale(scale)
  const limit = translationLimit(boundedScale, frameSize)
  return {
    scale: boundedScale,
    tx: clampTranslation(tx + dx, limit),
    ty: clampTranslation(ty + dy, limit),
  }
}
