import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'

export type GalleryProps = {
  images: string[]
  alt: string
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
}

export function Gallery({ images, alt, index, onClose }: GalleryProps) {
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
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  const image = images[index]

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
      <div
        data-testid="watch-gallery-frame"
        className="relative flex aspect-square w-[min(calc(100vw-2rem),calc(100dvh-4.5rem))] items-center justify-center md:w-[min(calc(100vw-8.5rem),calc(100dvh-4.5rem))]"
      >
        {image ? <img src={image} alt={alt} className="h-full w-full object-contain" /> : null}
      </div>
    </div>,
    document.body,
  )
}
