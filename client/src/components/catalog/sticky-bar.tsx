import { useLayoutEffect, useState, type RefObject } from 'react'

import { PriceBlock } from './price-block'
import { WantLink } from './want-link'

const frostedBarStyle =
  'background-color: color-mix(in srgb, var(--canvas-parchment) 80%, transparent); -webkit-backdrop-filter: saturate(180%) blur(20px); backdrop-filter: saturate(180%) blur(20px);'

export type StickyBarProps = {
  price: number
  listPrice?: number
  slug: string
  title: string
  targetRef: RefObject<Element | null>
}

export function StickyBar({
  price,
  listPrice,
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
          `padding-bottom: env(safe-area-inset-bottom); ${frostedBarStyle}`,
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
          className="w-full md:w-auto [&>a]:flex [&>a]:w-full [&>a]:justify-center md:[&>a]:w-auto"
        >
          <WantLink slug={slug} title={title} />
        </div>
      </div>
    </div>
  )
}
