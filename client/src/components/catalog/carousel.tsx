import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Gallery } from './gallery'
import { DRAG_THRESHOLD_PX, rubberBand, rubberStretch, slideDuration } from './motion'

export type CarouselProps = {
  images: string[]
  alt: string
}

function prefersReducedMotion(): boolean {
  if (typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function Carousel({ images, alt }: CarouselProps) {
  const [index, setIndex] = useState(0)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [pullPx, setPullPx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const dragStartX = useRef<number | null>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const wasGalleryOpen = useRef(false)
  const count = images.length
  const multi = count > 1
  const duration = slideDuration(prefersReducedMotion())
  const trackDuration = galleryOpen ? '0ms' : duration
  const atStart = index === 0
  const atEnd = index === count - 1

  useEffect(() => {
    const root = document.getElementById('root')
    if (!galleryOpen || !root) return
    const wasInert = root.hasAttribute('inert')
    root.setAttribute('inert', '')
    return () => {
      if (!wasInert) root.removeAttribute('inert')
    }
  }, [galleryOpen])

  useEffect(() => {
    if (galleryOpen) {
      wasGalleryOpen.current = true
      return
    }
    if (wasGalleryOpen.current) {
      frameRef.current?.focus()
      wasGalleryOpen.current = false
    }
  }, [galleryOpen])

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
    if (Math.abs(delta) < DRAG_THRESHOLD_PX) {
      setGalleryOpen(true)
      return
    }
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
    'hidden size-11 shrink-0 cursor-pointer rounded-full text-inherit hover:bg-[#e5e5ea] md:inline-flex'

  return (
    <div data-testid="watch-carousel" className="w-full" inert={galleryOpen}>
      <div
        data-testid="carousel-stage"
        className="relative mx-auto flex w-full max-w-[480px] items-center justify-center md:max-w-[600px] md:gap-4"
      >
        {multi ? (
          <Button
            type="button"
            variant="ghost"
            aria-label="Anterior"
            disabled={atStart}
            className={arrowClassName}
            onClick={() => step(-1)}
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
        ) : null}
        <div
          ref={frameRef}
          data-testid="carousel-frame"
          className="relative mx-auto aspect-square w-full min-w-0 max-w-[480px] flex-1 touch-pan-y overflow-hidden rounded-[12px]"
          tabIndex={multi ? 0 : -1}
          onKeyDown={multi ? onKeyDown : undefined}
          onPointerDown={onPointerDown}
          onPointerMove={multi ? onPointerMove : undefined}
          onPointerUp={releaseDrag}
          onPointerCancel={multi ? onPointerCancel : undefined}
        >
        <div
          data-testid="carousel-track"
          className="flex h-full w-full"
          style={{
            transform: `translateX(-${index * 100}%)`,
            transitionProperty: 'transform',
            transitionDuration: trackDuration,
          }}
        >
          {images.map((src, imageIndex) => {
            const current = imageIndex === index
            const stretch = current ? rubberStretch(pullPx) : 1
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
            aria-label="Seguinte"
            disabled={atEnd}
            className={arrowClassName}
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
                      ? 'size-[10px] cursor-pointer rounded-full bg-[#0066cc] p-0 hover:bg-[#0066cc]'
                      : 'size-[10px] cursor-pointer rounded-full bg-current/35 p-0 hover:bg-[#6e6e73]'
                  }
                  onClick={() => setIndex(imageIndex)}
                />
              )
            })}
          </div>
        </div>
      ) : null}
      {galleryOpen ? (
        <Gallery
          images={images}
          alt={alt}
          index={index}
          onIndexChange={setIndex}
          onClose={() => setGalleryOpen(false)}
        />
      ) : null}
    </div>
  )
}
