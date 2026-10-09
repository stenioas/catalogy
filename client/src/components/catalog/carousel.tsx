import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'

export type CarouselProps = {
  images: string[]
  alt: string
}

const DRAG_THRESHOLD_PX = 40

function prefersReducedMotion(): boolean {
  if (typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function slideDuration(): string {
  return prefersReducedMotion() ? '0ms' : '300ms'
}

export function Carousel({ images, alt }: CarouselProps) {
  const [index, setIndex] = useState(0)
  const dragStartX = useRef<number | null>(null)
  const count = images.length
  const multi = count > 1
  const duration = slideDuration()

  function step(delta: number) {
    setIndex((current) => (current + delta + count) % count)
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.currentTarget !== document.activeElement) return
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      step(1)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      step(-1)
    }
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (typeof event.currentTarget.setPointerCapture === 'function') {
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    dragStartX.current = event.clientX
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = dragStartX.current
    dragStartX.current = null
    if (start === null) return
    const delta = event.clientX - start
    if (delta <= -DRAG_THRESHOLD_PX) step(1)
    else if (delta >= DRAG_THRESHOLD_PX) step(-1)
  }

  return (
    <div data-testid="watch-carousel" className="w-full">
      <div
        data-testid="carousel-frame"
        className="aspect-square w-full overflow-hidden"
        tabIndex={multi ? 0 : undefined}
        onKeyDown={multi ? onKeyDown : undefined}
        onPointerDown={multi ? onPointerDown : undefined}
        onPointerUp={multi ? onPointerUp : undefined}
      >
        <div
          data-testid="carousel-track"
          className="flex h-full w-full"
          style={{
            transform: `translateX(-${index * 100}%)`,
            transitionProperty: 'transform',
            transitionDuration: duration,
          }}
        >
          {images.map((src, imageIndex) => (
            <img
              key={`${src}:${imageIndex}`}
              src={src}
              alt={imageIndex === index ? alt : ''}
              className="h-full w-full shrink-0 object-contain"
            />
          ))}
        </div>
      </div>
      {multi ? (
        <div data-testid="carousel-controls" className="mt-3 flex items-center">
          <button
            type="button"
            aria-label="Anterior"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            onClick={() => step(-1)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path
                d="M15 6 L9 12 L15 18"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div data-testid="carousel-dots" className="flex flex-1 justify-center gap-2">
            {images.map((src, imageIndex) => (
              <button
                key={`${src}:${imageIndex}`}
                type="button"
                aria-label={`Foto ${imageIndex + 1}`}
                aria-current={imageIndex === index ? 'true' : undefined}
                className="h-2.5 w-2.5 rounded-full bg-current"
                onClick={() => setIndex(imageIndex)}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="Seguinte"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            onClick={() => step(1)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path
                d="M9 6 L15 12 L9 18"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      ) : null}
    </div>
  )
}
