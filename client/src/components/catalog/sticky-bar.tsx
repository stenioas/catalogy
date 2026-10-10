import { useLayoutEffect, useState, type RefObject } from 'react'

import { PriceBlock } from './price-block'
import { WantLink } from './want-link'

export type StickyBarProps = {
  price: number
  listPrice?: number
  phone: string
  slug: string
  title: string
  targetRef: RefObject<Element | null>
}

export function StickyBar({
  price,
  listPrice,
  phone,
  slug,
  title,
  targetRef,
}: StickyBarProps) {
  const [fullyVisible, setFullyVisible] = useState(false)

  useLayoutEffect(() => {
    const target = targetRef.current
    if (!target || typeof IntersectionObserver !== 'function') return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        setFullyVisible(entry !== undefined && entry.intersectionRatio >= 1)
      },
      { threshold: 1 },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [targetRef])

  if (fullyVisible) return null

  return (
    <div
      data-testid="sticky-bar"
      className="fixed inset-x-0 bottom-0 z-10"
      ref={(node) => {
        node?.setAttribute(
          'style',
          'padding-bottom: env(safe-area-inset-bottom); background-color: color-mix(in srgb, var(--canvas-parchment) 80%, transparent); backdrop-filter: saturate(180%) blur(20px);',
        )
      }}
    >
      <div
        data-testid="sticky-bar-row"
        className="catalog-column flex flex-col items-stretch gap-3 py-3 md:flex-row md:items-center md:justify-between"
      >
        <PriceBlock price={price} listPrice={listPrice} />
        <div
          data-testid="sticky-bar-action"
          className="w-full md:w-auto [&>a]:block [&>a]:w-full md:[&>a]:w-auto"
        >
          <WantLink slug={slug} title={title} />
        </div>
      </div>
    </div>
  )
}
