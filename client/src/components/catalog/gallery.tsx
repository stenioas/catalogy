import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DRAG_THRESHOLD_PX, panWithin, rubberBand, rubberStretch, slideDuration, type Zoom } from './motion'

export type GalleryProps = {
  images: string[]
  alt: string
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
}

export function Gallery({ images, alt, index, onIndexChange, onClose }: GalleryProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState<Zoom>({ scale: 1, tx: 0, ty: 0 })
  const [pullPx, setPullPx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef<{ x: number; y: number; zoom: Zoom } | null>(null)
  const previousIndex = useRef(index)
  const reduce = typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const duration = slideDuration(reduce)

  useEffect(() => {
    if (previousIndex.current === index) return
    previousIndex.current = index
    setZoom({ scale: 1, tx: 0, ty: 0 })
    setPullPx(0)
    setDragging(false)
    dragStart.current = null
  }, [index])

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (typeof event.currentTarget.setPointerCapture === 'function') {
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        // The pointer is no longer active. Coordinates still drive the gesture.
      }
    }
    dragStart.current = { x: event.clientX, y: event.clientY, zoom }
    setDragging(true)
  }

  function pan(event: PointerEvent<HTMLDivElement>) {
    const start = dragStart.current
    if (!start) return
    setZoom(panWithin(start.zoom.tx, start.zoom.ty,
      event.clientX - start.x, event.clientY - start.y, start.zoom.scale,
      frameRef.current?.getBoundingClientRect().width ?? 0))
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = dragStart.current
    if (!start) return
    if (start.zoom.scale > 1) {
      pan(event)
      return
    }
    const delta = event.clientX - start.x
    const atEdge = (index === 0 && delta > 0) || (index === images.length - 1 && delta < 0)
    setPullPx(atEdge ? rubberBand(delta) : 0)
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = dragStart.current
    if (!start) return
    if (start.zoom.scale > 1) pan(event)
    dragStart.current = null
    setDragging(false)
    setPullPx(0)
    if (start.zoom.scale > 1) return
    const delta = event.clientX - start.x
    if (Math.abs(delta) <= DRAG_THRESHOLD_PX) return
    const next = index + (delta < 0 ? 1 : -1)
    if (next >= 0 && next < images.length) onIndexChange(next)
  }

  function onPointerCancel() {
    dragStart.current = null
    setDragging(false)
    setPullPx(0)
  }

  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        const nextIndex = index + (event.key === 'ArrowRight' ? 1 : -1)
        if (nextIndex >= 0 && nextIndex < images.length) onIndexChange(nextIndex)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [images.length, index, onClose, onIndexChange])

  const count = images.length

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Galeria de fotos"
      data-testid="watch-gallery"
      tabIndex={-1}
      className="fixed inset-0 z-30 flex items-center justify-center bg-[rgb(0_0_0/80%)]"
      style={{
        backdropFilter: 'saturate(180%) blur(20px)',
        transitionDuration: '0ms',
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <Button
        type="button"
        variant="ghost"
        aria-label="Fechar"
        className="absolute top-3 left-3 size-11 rounded-full bg-[color-mix(in_srgb,var(--surface-black)_64%,transparent)] text-[var(--body-on-dark)] md:left-auto md:right-3"
        onClick={onClose}
      >
        <X aria-hidden="true" />
      </Button>
      {count > 1 ? (
        <>
          <Button
            type="button"
            variant="ghost"
            aria-label="Anterior"
            disabled={index === 0}
            className="absolute top-1/2 left-3 hidden size-11 -translate-y-1/2 rounded-full bg-[color-mix(in_srgb,var(--surface-black)_64%,transparent)] text-[var(--body-on-dark)] md:inline-flex"
            onClick={() => onIndexChange(index - 1)}
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            aria-label="Seguinte"
            disabled={index === count - 1}
            className="absolute top-1/2 right-3 hidden size-11 -translate-y-1/2 rounded-full bg-[color-mix(in_srgb,var(--surface-black)_64%,transparent)] text-[var(--body-on-dark)] md:inline-flex"
            onClick={() => onIndexChange(index + 1)}
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </>
      ) : null}
      <div
        ref={frameRef}
        data-testid="watch-gallery-frame"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        className="relative flex touch-none overflow-hidden aspect-square w-[min(calc(100vw-2rem),calc(100dvh-4.5rem))] items-center justify-center md:w-[min(calc(100vw-8.5rem),calc(100dvh-4.5rem))]"
      >
        <div
          data-testid="watch-gallery-track"
          className="flex h-full w-full"
          style={{
            transform: `translateX(-${index * 100}%)`,
            transitionProperty: 'transform',
            transitionDuration: dragging ? '0ms' : duration,
          }}
        >
          {[index, ...images.map((_, imageIndex) => imageIndex).filter((imageIndex) => imageIndex !== index)].map((imageIndex) => (
            <img
              key={`${images[imageIndex]}:${imageIndex}`}
              src={images[imageIndex]}
              alt={imageIndex === index ? alt : ''}
              draggable={false}
              className="h-full w-full shrink-0 object-contain"
              style={imageIndex === index ? {
                order: imageIndex,
                transform: `translate(${zoom.tx + pullPx}px, ${zoom.ty}px) scale(${zoom.scale}) scaleX(${rubberStretch(pullPx)})`,
                transformOrigin: pullPx ? (pullPx > 0 ? 'left center' : 'right center') : 'center',
                transitionProperty: 'transform',
                transitionDuration: dragging ? '0ms' : duration,
              } : { order: imageIndex }}
            />
          ))}
        </div>
        <span
          aria-hidden="true"
          className="absolute right-3 bottom-3 rounded-full bg-[color-mix(in_srgb,var(--surface-black)_64%,transparent)] px-3 py-1 text-[var(--body-on-dark)]"
        >
          {index + 1}/{count}
        </span>
      </div>
      <span className="sr-only" aria-live="polite">
        Foto {index + 1} de {count}
      </span>
    </div>,
    document.body,
  )
}
