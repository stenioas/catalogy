import { useLayoutEffect, useRef, useState, type RefObject } from 'react'

import { PriceBlock } from './price-block'
import { WantLink } from './want-link'

const frostedBarStyle =
  'background-color: color-mix(in srgb, var(--canvas-parchment) 80%, transparent); -webkit-backdrop-filter: saturate(180%) blur(20px); backdrop-filter: saturate(180%) blur(20px);'

export type StickyBarProps = {
  price: number
  listPrice?: number
  slug: string
  title: string
  target?: Element | null
  targetRef?: RefObject<Element | null>
}

export function StickyBar({
  price,
  listPrice,
  slug,
  title,
  target: targetElement,
  targetRef,
}: StickyBarProps) {
  const [fullyVisible, setFullyVisible] = useState(false)
  const [barHeight, setBarHeight] = useState(0)
  const barRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const observedTargetRef = useRef<Element | null | undefined>(undefined)

  useLayoutEffect(() => {
    const target = targetElement !== undefined ? targetElement : (targetRef?.current ?? null)
    const targetChanged = target !== observedTargetRef.current

    if (!targetChanged && (!target || observerRef.current)) return

    observerRef.current?.disconnect()
    observerRef.current = null
    if (targetChanged) {
      observedTargetRef.current = target
      setFullyVisible(false)
    }
    if (!target || typeof IntersectionObserver !== 'function') return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        setFullyVisible(entry !== undefined && entry.intersectionRatio >= 1)
      },
      { threshold: 1 },
    )
    observer.observe(target)
    observerRef.current = observer
  })

  useLayoutEffect(
    () => () => {
      observerRef.current?.disconnect()
      observerRef.current = null
    },
    [],
  )

  useLayoutEffect(() => {
    const node = barRef.current
    if (!node) return

    const measure = () => {
      const next = node.getBoundingClientRect().height
      setBarHeight((current) => (current === next ? current : next))
    }
    measure()
    if (typeof ResizeObserver !== 'function') return

    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [fullyVisible])

  if (fullyVisible) return null

  return (
    <>
      <div aria-hidden="true" data-testid="sticky-bar-spacer" style={{ height: barHeight }} />
      <div
        data-testid="sticky-bar"
        className="fixed inset-x-0 bottom-0 z-10"
        ref={(node) => {
          barRef.current = node
          node?.setAttribute(
            'style',
            `padding-bottom: env(safe-area-inset-bottom); ${frostedBarStyle}`,
          )
        }}
      >
        <div
          data-testid="sticky-bar-row"
          className="catalog-column flex flex-col items-stretch gap-3 py-3 md:flex-row md:items-center"
        >
          <div className="min-w-0 md:flex-1">
            <PriceBlock price={price} listPrice={listPrice} />
          </div>
          <div
            data-testid="sticky-bar-action"
            className="w-full min-w-0 md:flex-1 [&>a]:flex [&>a]:w-full [&>a]:justify-center"
          >
            <WantLink slug={slug} title={title} />
          </div>
        </div>
      </div>
    </>
  )
}
