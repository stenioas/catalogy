export type Rect = { x: number; y: number; width: number; height: number }
export type Size = { width: number; height: number }
export type Point = { x: number; y: number }

export type ZoomGeometry = {
  image: Rect
  lens: Rect
  frame: Rect
  scale: number
  source: Rect
}

export function calculateZoomGeometry(input: {
  stage: Rect
  natural: Size
  viewport: Size
  pointer: Point
}): ZoomGeometry | null {
  const { stage, natural, viewport, pointer } = input
  const values = [
    stage.x,
    stage.y,
    stage.width,
    stage.height,
    natural.width,
    natural.height,
    viewport.width,
    viewport.height,
    pointer.x,
    pointer.y,
  ]

  if (!values.every(Number.isFinite)) return null
  if (
    stage.width <= 0 ||
    stage.height <= 0 ||
    natural.width <= 0 ||
    natural.height <= 0 ||
    viewport.width <= 0 ||
    viewport.height <= 0
  ) {
    return null
  }

  const imageScale = Math.min(
    stage.width / natural.width,
    stage.height / natural.height,
  )
  const imageWidth = natural.width * imageScale
  const imageHeight = natural.height * imageScale
  const image: Rect = {
    x: stage.x + (stage.width - imageWidth) / 2,
    y: stage.y + (stage.height - imageHeight) / 2,
    width: imageWidth,
    height: imageHeight,
  }

  if (
    !Number.isFinite(imageScale) ||
    imageScale <= 0 ||
    ![image.x, image.y, image.width, image.height].every(Number.isFinite) ||
    image.width <= 0 ||
    image.height <= 0
  ) {
    return null
  }

  if (
    pointer.x < image.x ||
    pointer.x > image.x + image.width ||
    pointer.y < image.y ||
    pointer.y > image.y + image.height
  ) {
    return null
  }

  const frameX = stage.x + stage.width + 12
  const availableWidth = viewport.width - 12 - frameX
  const frameWidth = Math.min(
    320,
    availableWidth,
    (viewport.height - 24) * (3 / 4),
  )
  if (!Number.isFinite(frameWidth) || frameWidth <= 0) return null

  const frameHeight = frameWidth * (4 / 3)
  const frame: Rect = {
    x: frameX,
    y: Math.min(
      viewport.height - 12 - frameHeight,
      Math.max(12, image.y),
    ),
    width: frameWidth,
    height: frameHeight,
  }
  const scale = Math.max(2, frame.width / image.width, frame.height / image.height)
  const lens: Rect = {
    x: Math.min(
      image.x + image.width - frame.width / scale,
      Math.max(image.x, pointer.x - frame.width / scale / 2),
    ),
    y: Math.min(
      image.y + image.height - frame.height / scale,
      Math.max(image.y, pointer.y - frame.height / scale / 2),
    ),
    width: frame.width / scale,
    height: frame.height / scale,
  }
  const source: Rect = {
    x: (lens.x - image.x) / imageScale,
    y: (lens.y - image.y) / imageScale,
    width: lens.width / imageScale,
    height: lens.height / imageScale,
  }

  if (
    ![
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      scale,
      lens.x,
      lens.y,
      lens.width,
      lens.height,
      source.x,
      source.y,
      source.width,
      source.height,
    ].every(Number.isFinite)
  ) {
    return null
  }

  return { image, lens, frame, scale, source }
}
