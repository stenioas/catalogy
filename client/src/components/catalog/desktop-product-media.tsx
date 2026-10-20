import { useRef, type MouseEvent, type PointerEvent } from 'react'

import { Button } from '@/components/ui/button'
import { HoverZoom } from './hover-zoom'

type DesktopProductMediaProps = {
  images: string[]
  alt: string
  index: number
  disabled?: boolean
  onIndexChange: (index: number) => void
  onOpenGallery: (index: number, trigger: HTMLElement) => void
  primaryRef: (element: HTMLElement | null) => void
}

type Point = { x: number; y: number }

const DRAG_SLOP_PX = 4

export function DesktopProductMedia({
  images,
  alt,
  index,
  onIndexChange,
  onOpenGallery,
  primaryRef,
  disabled = false,
}: DesktopProductMediaProps) {
  const pointerStart = useRef<Point | null>(null)
  const dragged = useRef(false)
  const visibleCount = images.length > 8 ? 7 : images.length
  const hasMore = images.length > 8
  const moreCount = images.length - 7
  const selectedMore = hasMore && index >= 7

  function startPointer(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return
    pointerStart.current = { x: event.clientX, y: event.clientY }
    dragged.current = false
  }

  function movePointer(event: PointerEvent<HTMLButtonElement>) {
    const start = pointerStart.current
    if (!start) return
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > DRAG_SLOP_PX) {
      dragged.current = true
    }
  }

  function endPointer() {
    pointerStart.current = null
  }

  function openFromMain(event: MouseEvent<HTMLButtonElement>) {
    if (event.detail !== 0 && dragged.current) {
      event.preventDefault()
      event.stopPropagation()
      dragged.current = false
      return
    }
    dragged.current = false
    onOpenGallery(index, event.currentTarget)
  }

  return (
    <div data-testid="desktop-product-media" className="flex w-full min-w-0 items-start gap-3">
      <div role="group" aria-label="Miniaturas do produto" className="flex w-14 shrink-0 flex-col gap-1">
        {images.slice(0, visibleCount).map((src, imageIndex) => {
          const selected = imageIndex === index
          return (
            <Button
              key={`${src}:${imageIndex}`}
              type="button"
              variant="outline"
              aria-label={`Foto ${imageIndex + 1}`}
              aria-pressed={selected}
              className={`size-14 shrink-0 cursor-pointer p-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${selected ? 'border-primary ring-1 ring-primary' : ''}`}
              onClick={() => onIndexChange(imageIndex)}
            >
              <img src={src} alt="" aria-hidden="true" draggable={false} className="size-full rounded-md object-contain" />
            </Button>
          )
        })}
        {hasMore ? (
          <Button
            type="button"
            variant="outline"
            aria-label={`Abrir galeria na foto 8, mais ${moreCount} fotos`}
            aria-pressed={selectedMore}
            className={`size-14 shrink-0 cursor-pointer p-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${selectedMore ? 'border-primary ring-1 ring-primary' : ''}`}
            onClick={(event) => onOpenGallery(7, event.currentTarget)}
          >
            +{moreCount}
          </Button>
        ) : null}
      </div>

      <Button
        ref={primaryRef}
        type="button"
        variant="outline"
        aria-label={`Abrir galeria na foto ${index + 1}`}
        aria-haspopup="dialog"
        data-testid="desktop-product-main"
        className="relative aspect-square h-auto min-w-0 w-full max-w-[476px] flex-1 overflow-hidden rounded-xl p-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onPointerDown={startPointer}
        onPointerMove={movePointer}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onClick={openFromMain}
      >
        <HoverZoom src={images[index]} alt={alt} disabled={disabled} />
      </Button>
    </div>
  )
}
