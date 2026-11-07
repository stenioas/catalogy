import { activeSection, homeCards, homeEmptyText, type SectionId } from '@catalogo/shared'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'

import { products } from '../catalog/products.generated'
import { TopBar } from '../components/catalog/top-bar'
import { WatchCard } from '../components/catalog/watch-card'
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group'

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'available', label: 'Disponível' },
  { id: 'coming-soon', label: 'Chega em breve' },
  { id: 'on-order', label: 'Sob encomenda' },
]

const resultsEnterClass =
  'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200'

const sectionItemClass =
  'min-w-0 flex-1 shrink px-1.5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary data-[state=on]:hover:text-primary-foreground dark:data-[state=on]:bg-primary dark:data-[state=on]:text-primary-foreground dark:data-[state=on]:hover:bg-primary'

const pinnedShellClass =
  'fixed inset-x-0 z-10 w-full bg-[color-mix(in_srgb,var(--canvas-parchment)_80%,transparent)] [-webkit-backdrop-filter:saturate(180%)_blur(20px)] [backdrop-filter:saturate(180%)_blur(20px)] motion-safe:transition-[top] motion-safe:duration-300 motion-safe:ease-out'

function isSectionId(value: string | null): value is SectionId {
  return value === 'available' || value === 'coming-soon' || value === 'on-order'
}

function usePinnedSectionToggle() {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const blockRef = useRef<HTMLDivElement>(null)
  const [pinned, setPinned] = useState(false)
  const [barHidden, setBarHidden] = useState(false)
  const [spacerHeight, setSpacerHeight] = useState(0)

  useEffect(() => {
    const sync = () => {
      const bar = document.querySelector('[data-testid="top-bar"]')
      const hidden = bar?.classList.contains('-translate-y-full') ?? false
      const sentinelTop = sentinelRef.current?.getBoundingClientRect().top ?? 0
      const y = window.scrollY
      const stickLine = hidden ? 0 : 64
      const fitsInFlow = sentinelTop >= stickLine
      const nextPinned =
        y === 0 || (y < 64 && fitsInFlow)
          ? false
          : y >= 64 && sentinelTop <= stickLine
            ? true
            : null

      setBarHidden((prev) => (prev === hidden ? prev : hidden))
      if (nextPinned === null) return
      if (nextPinned) {
        const height = blockRef.current?.offsetHeight ?? 0
        setSpacerHeight((prev) => (prev === height ? prev : height))
      }
      setPinned((prev) => (prev === nextPinned ? prev : nextPinned))
    }

    sync()
    const bar = document.querySelector('[data-testid="top-bar"]')
    const observer = new MutationObserver(sync)
    if (bar) observer.observe(bar, { attributes: true, attributeFilter: ['class'] })
    window.addEventListener('scroll', sync, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', sync)
    }
  }, [])

  return { sentinelRef, blockRef, pinned, barHidden, spacerHeight }
}

export function CatalogPage() {
  const [params, setParams] = useSearchParams()
  const sectionParam = params.get('section')
  const resolved = activeSection(products, sectionParam)
  const cards = homeCards(products, sectionParam)
  const emptyText = homeEmptyText(products, sectionParam)
  const { sentinelRef, blockRef, pinned, barHidden, spacerHeight } = usePinnedSectionToggle()

  function selectSection(id: SectionId) {
    const raw = params.get('section')
    if (raw === id) return
    if (!isSectionId(raw) && id === resolved) return
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('section', id)
      return next
    })
  }

  const shell = (
    <div
      ref={blockRef}
      data-testid="section-toggle"
      className={pinned ? `${pinnedShellClass} ${barHidden ? 'top-0' : 'top-16'}` : undefined}
    >
      <div className={pinned ? 'catalog-column catalog-vitrine' : undefined}>
        <div className="p-1">
          <ToggleGroup
            type="single"
            value={resolved}
            spacing={0}
            aria-label="Seção"
            onValueChange={(id) => {
              if (isSectionId(id)) selectSection(id)
            }}
            className="w-full bg-[var(--hairline)]"
          >
            {SECTIONS.map((section) => (
              <ToggleGroupItem key={section.id} value={section.id} className={sectionItemClass}>
                {section.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <TopBar />
      <main className="max-w-full min-w-0 overflow-x-clip">
        <div data-testid="catalog-page-column" className="catalog-column catalog-vitrine pb-4">
          <div className="mb-2">
            <div ref={sentinelRef} data-testid="section-toggle-sentinel" aria-hidden="true" className="h-0" />
            {pinned ? (
              <div data-testid="section-toggle-spacer" aria-hidden="true" style={{ height: spacerHeight }} />
            ) : null}
            {pinned ? createPortal(shell, document.body) : shell}
          </div>
          <div key={resolved} data-testid="catalog-results" className={resultsEnterClass}>
            {emptyText !== null ? (
              <p className="m-0 text-[var(--ink-primary)]">{emptyText}</p>
            ) : cards.length === 0 ? null : (
              <ul
                data-testid="catalog-grid"
                className="catalog-grid m-0 grid list-none grid-cols-1 items-stretch gap-4 p-0 md:grid-cols-2 md:gap-6 lg:grid-cols-3"
              >
                {cards.map((card) => {
                  const product = products.find((item) => item.slug === card.slug)
                  if (product === undefined) return null
                  return (
                    <li key={`${card.slug}-${card.listingId}`} className="flex h-full">
                      <WatchCard product={product} card={card} />
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
