import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { calculateZoomGeometry, type Point, type Size, type ZoomGeometry } from './zoom-geometry'

type HoverZoomProps = {
  src: string
  alt: string
  disabled?: boolean
}

export function HoverZoom({ src, alt, disabled = false }: HoverZoomProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const natural = useRef<Size | null>(null)
  const pointer = useRef<Point | null>(null)
  const pending = useRef<number | null>(null)
  const [geometry, setGeometry] = useState<ZoomGeometry | null>(null)

  useEffect(() => {
    const stage = stageRef.current!
    const image = imageRef.current!
    const hover = window.matchMedia('(hover: hover)')

    function stop() {
      pointer.current = null
      if (pending.current !== null) cancelAnimationFrame(pending.current)
      pending.current = null
      setGeometry(null)
    }
    function update() {
      pending.current = null
      if (disabled || !hover.matches || window.innerWidth < 920 || !pointer.current || !natural.current) {
        setGeometry(null)
        return
      }
      const rect = stage.getBoundingClientRect()
      setGeometry(calculateZoomGeometry({
        stage: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        natural: natural.current,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        pointer: pointer.current,
      }))
    }
    function schedule() {
      if (pointer.current && pending.current === null) pending.current = requestAnimationFrame(update)
    }
    function move(event: globalThis.PointerEvent) {
      if (event.pointerType !== 'mouse' || disabled || !hover.matches || window.innerWidth < 920) {
        stop()
        return
      }
      pointer.current = { x: event.clientX, y: event.clientY }
      schedule()
    }
    function loaded() {
      natural.current = image.naturalWidth > 0 && image.naturalHeight > 0
        ? { width: image.naturalWidth, height: image.naturalHeight }
        : null
      schedule()
    }
    function failed() { natural.current = null; stop() }

    natural.current = null
    stop()
    if (image.complete) loaded()
    image.addEventListener('load', loaded)
    image.addEventListener('error', failed)
    stage.addEventListener('pointermove', move)
    stage.addEventListener('pointerleave', stop)
    stage.addEventListener('pointercancel', stop)
    window.addEventListener('resize', schedule)
    window.addEventListener('scroll', schedule, { capture: true, passive: true })
    hover.addEventListener('change', stop)
    return () => {
      stop()
      natural.current = null
      image.removeEventListener('load', loaded)
      image.removeEventListener('error', failed)
      stage.removeEventListener('pointermove', move)
      stage.removeEventListener('pointerleave', stop)
      stage.removeEventListener('pointercancel', stop)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('scroll', schedule, true)
      hover.removeEventListener('change', stop)
    }
  }, [src, disabled])

  const { lens, frame, image, scale } = geometry ?? {}
  return (
    <div ref={stageRef} data-testid="hover-zoom-stage" className="relative aspect-square w-full" style={{ cursor: geometry ? 'zoom-in' : undefined }}>
      <img key={src} ref={imageRef} src={src} alt={alt} draggable={false} className="h-full w-full object-contain" />
      {lens ? (
        <div aria-hidden="true" data-testid="hover-zoom-lens" style={{
          position: 'absolute', pointerEvents: 'none',
          left: lens.x - (stageRef.current?.getBoundingClientRect().x ?? 0),
          top: lens.y - (stageRef.current?.getBoundingClientRect().y ?? 0),
          width: lens.width, height: lens.height,
          background: 'var(--surface-black)', opacity: 0.25,
        }} />
      ) : null}
      {frame && lens && image && scale ? createPortal(
        <div aria-hidden="true" data-testid="hover-zoom-frame" className="z-40 overflow-hidden bg-background ring-1 ring-border" style={{
          position: 'fixed', pointerEvents: 'none', left: frame.x, top: frame.y,
          width: frame.width, height: frame.height,
        }}>
          <img src={src} alt="" draggable={false} style={{
            position: 'absolute', maxWidth: 'none', width: image.width * scale, height: image.height * scale,
            transformOrigin: 'top left',
            transform: `translate(${-(lens.x - image.x) * scale}px, ${-(lens.y - image.y) * scale}px)`,
          }} />
        </div>, document.body,
      ) : null}
    </div>
  )
}
