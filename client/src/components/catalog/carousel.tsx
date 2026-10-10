import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'

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
    if (delta < -DRAG_THRESHOLD_PX) step(1)
    else if (delta > DRAG_THRESHOLD_PX) step(-1)
  }

  function onPointerCancel() {
    dragStartX.current = null
  }

  return (
    <div data-testid="watch-carousel" className="w-full">
      <div
        data-testid="carousel-frame"
        className="mx-auto aspect-square w-full max-w-[480px] touch-pan-y overflow-hidden rounded-[12px]"
        tabIndex={multi ? 0 : undefined}
        onKeyDown={multi ? onKeyDown : undefined}
        onPointerDown={multi ? onPointerDown : undefined}
        onPointerUp={multi ? onPointerUp : undefined}
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
          {images.map((src, imageIndex) => (
            <img
              key={`${src}:${imageIndex}`}
              src={src}
              alt={imageIndex === index ? alt : ''}
              draggable={false}
              className="h-full w-full shrink-0 object-contain"
            />
          ))}
        </div>
      </div>
      {multi ? (
        <div data-testid="carousel-controls" className="mt-6 flex items-center">
          <Button
            type="button"
            variant="ghost"
            aria-label="Anterior"
            className="hidden size-11 shrink-0 text-inherit md:inline-flex"
            onClick={() => step(-1)}
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <div data-testid="carousel-dots" className="flex flex-1 justify-center gap-2">
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
          <Button
            type="button"
            variant="ghost"
            aria-label="Seguinte"
            className="hidden size-11 shrink-0 text-inherit md:inline-flex"
            onClick={() => step(1)}
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      ) : null}
    </div>
  )
}
