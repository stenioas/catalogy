import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

import { Button } from '@/components/ui/button'

export type GalleryProps = {
  images: string[]
  alt: string
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
}

export function Gallery({ images, alt, index, onIndexChange, onClose }: GalleryProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

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

  const image = images[index]
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
        data-testid="watch-gallery-frame"
        className="relative flex aspect-square w-[min(calc(100vw-2rem),calc(100dvh-4.5rem))] items-center justify-center md:w-[min(calc(100vw-8.5rem),calc(100dvh-4.5rem))]"
      >
        {image ? <img src={image} alt={alt} className="h-full w-full object-contain" /> : null}
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
