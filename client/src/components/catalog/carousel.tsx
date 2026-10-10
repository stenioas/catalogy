import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'

export type CarouselProps = {
  images: string[]
  alt: string
}

const DRAG_THRESHOLD_PX = 40
const RUBBER_MAX_PX = 56

function prefersReducedMotion(): boolean {
  if (typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function slideDuration(): string {
  return prefersReducedMotion() ? '0ms' : '300ms'
}

function rubberBand(delta: number): number {
  const distance = Math.min(Math.abs(delta), 280)
  return Math.sign(delta) * RUBBER_MAX_PX * (1 - Math.exp(-distance / 160))
}

export function Carousel({ images, alt }: CarouselProps) {
  const [index, setIndex] = useState(0)
  const [pullPx, setPullPx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const dragStartX = useRef<number | null>(null)
  const count = images.length
  const multi = count > 1
  const duration = slideDuration()
  const atStart = index === 0
  const atEnd = index === count - 1

  function step(delta: number) {
    setIndex((current) => {
      const next = current + delta
      if (next < 0 || next >= count) return current
      return next
    })
  }

  function edgePull(delta: number): number {
    if (atStart && delta > 0) return rubberBand(delta)
    if (atEnd && delta < 0) return rubberBand(delta)
    return 0
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
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        // The pointer is no longer active. The drag still follows the coordinates.
      }
    }
    dragStartX.current = event.clientX
    setDragging(true)
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = dragStartX.current
    if (start === null) return
    setPullPx(edgePull(event.clientX - start))
  }

  function releaseDrag(event: PointerEvent<HTMLDivElement>) {
    const start = dragStartX.current
    dragStartX.current = null
    setDragging(false)
    setPullPx(0)
    if (start === null) return
    const delta = event.clientX - start
    if (atStart && delta > 0) return
    if (atEnd && delta < 0) return
    if (delta < -DRAG_THRESHOLD_PX) step(1)
    else if (delta > DRAG_THRESHOLD_PX) step(-1)
  }

  function onPointerCancel() {
    dragStartX.current = null
    setDragging(false)
    setPullPx(0)
  }

  const arrowClassName =
    'absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 cursor-pointer rounded-full text-inherit hover:bg-[#e5e5ea] md:inline-flex'

  return (
    <div data-testid="watch-carousel" className="w-full">
      <div data-testid="carousel-stage" className="relative mx-auto w-full max-w-[480px]">
        <div
          data-testid="carousel-frame"
          className="relative mx-auto aspect-square w-full max-w-[480px] touch-pan-y overflow-hidden rounded-[12px]"
        tabIndex={multi ? 0 : undefined}
        onKeyDown={multi ? onKeyDown : undefined}
        onPointerDown={multi ? onPointerDown : undefined}
        onPointerMove={multi ? onPointerMove : undefined}
        onPointerUp={multi ? releaseDrag : undefined}
        onPointerCancel={multi ? onPointerCancel : undefined}
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
          {images.map((src, imageIndex) => {
            const current = imageIndex === index
            const stretch = current ? 1 + (Math.abs(pullPx) / RUBBER_MAX_PX) * 0.08 : 1
            return (
              <img
                key={`${src}:${imageIndex}`}
                src={src}
                alt={current ? alt : ''}
                draggable={false}
                className="h-full w-full shrink-0 object-contain"
                style={
                  current
                    ? {
                        transform: `translateX(${pullPx}px) scaleX(${stretch})`,
                        transformOrigin: pullPx >= 0 ? 'left center' : 'right center',
                        transitionProperty: 'transform',
                        transitionDuration: dragging ? '0ms' : duration,
                      }
                    : undefined
                }
              />
            )
          })}
        </div>
        {multi ? (
          <p
            data-testid="carousel-count"
            aria-hidden="true"
            className="pointer-events-none absolute right-3 bottom-3 m-0 rounded-full bg-[color-mix(in_srgb,var(--canvas-parchment)_52%,transparent)] px-2.5 py-1 text-sm font-medium text-[var(--ink)] tabular-nums [-webkit-backdrop-filter:saturate(140%)_blur(8px)] [backdrop-filter:saturate(140%)_blur(8px)]"
          >
            {index + 1}/{count}
          </p>
        ) : null}
      </div>
        {multi ? (
          <Button
            type="button"
            variant="ghost"
            aria-label="Anterior"
            disabled={atStart}
            className={`${arrowClassName} left-2`}
            onClick={() => step(-1)}
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
        ) : null}
        {multi ? (
          <Button
            type="button"
            variant="ghost"
            aria-label="Seguinte"
            disabled={atEnd}
            className={`${arrowClassName} right-2`}
            onClick={() => step(1)}
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      {multi ? (
        <div data-testid="carousel-controls" className="mt-6 flex items-center justify-center">
          <div data-testid="carousel-dots" className="flex justify-center gap-2">
            {images.map((src, imageIndex) => {
              const current = imageIndex === index
              return (
                <Button
                  key={`${src}:${imageIndex}`}
                  type="button"
                  variant="ghost"
                  aria-label={`Foto ${imageIndex + 1}`}
                  aria-current={current ? 'true' : undefined}
                  className={
                    current
                      ? 'size-[10px] rounded-full bg-[#0066cc] p-0'
                      : 'size-[10px] rounded-full bg-current/35 p-0'
                  }
                  onClick={() => setIndex(imageIndex)}
                />
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
