import { useEffect, useRef, useState, type ReactNode } from 'react'

import { CarouselView } from './carousel'
import { DesktopProductMedia } from './desktop-product-media'
import { Gallery } from './gallery'

type ProductMediaProps = {
  images: string[]
  alt: string
  children: (slot: { isDesktop: boolean; media: ReactNode }) => ReactNode
}

const THUMBNAIL_QUERY = '(min-width: 768px)'
const DESKTOP_QUERY = '(min-width: 920px)'

function isVisible(element: HTMLElement | null): element is HTMLElement {
  if (!element?.isConnected || element.closest('[hidden]')) return false
  const style = getComputedStyle(element)
  return style.display !== 'none' && style.visibility !== 'hidden'
}

export function ProductMedia({ images, alt, children }: ProductMediaProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [useThumbnails, setUseThumbnails] = useState(() => window.matchMedia(THUMBNAIL_QUERY).matches)
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(DESKTOP_QUERY).matches)
  const triggerRef = useRef<HTMLElement | null>(null)
  const primaryRef = useRef<HTMLElement | null>(null)
  const wasGalleryOpen = useRef(false)

  useEffect(() => {
    const thumbnail = window.matchMedia(THUMBNAIL_QUERY)
    const desktop = window.matchMedia(DESKTOP_QUERY)
    function update() {
      setUseThumbnails(thumbnail.matches)
      setIsDesktop(desktop.matches)
    }
    thumbnail.addEventListener('change', update)
    desktop.addEventListener('change', update)
    return () => {
      thumbnail.removeEventListener('change', update)
      desktop.removeEventListener('change', update)
    }
  }, [])

  useEffect(() => {
    if (!galleryOpen) return
    const root = document.getElementById('root')
    if (!root) return
    const previousInert = root.getAttribute('inert')
    root.setAttribute('inert', '')
    return () => {
      if (previousInert === null) root.removeAttribute('inert')
      else root.setAttribute('inert', previousInert)
    }
  }, [galleryOpen])

  useEffect(() => {
    if (galleryOpen) {
      wasGalleryOpen.current = true
    } else if (wasGalleryOpen.current) {
      const target = isVisible(triggerRef.current) ? triggerRef.current : primaryRef.current
      target?.focus()
      wasGalleryOpen.current = false
    }
  }, [galleryOpen])

  function openGallery(index: number, trigger: HTMLElement) {
    setSelectedIndex(index)
    triggerRef.current = trigger
    setGalleryOpen(true)
  }

  const presentationProps = {
    images,
    alt,
    index: selectedIndex,
    onIndexChange: setSelectedIndex,
    onOpenGallery: openGallery,
    primaryRef: (element: HTMLElement | null) => { primaryRef.current = element },
  }
  const media = useThumbnails
    ? <DesktopProductMedia {...presentationProps} disabled={galleryOpen} />
    : <CarouselView {...presentationProps} animate={!galleryOpen} />

  return <>
    <div inert={galleryOpen}>{children({ media, isDesktop })}</div>
    {galleryOpen ? <Gallery images={images} alt={alt} index={selectedIndex}
      onIndexChange={setSelectedIndex} onClose={() => setGalleryOpen(false)} /> : null}
  </>
}
