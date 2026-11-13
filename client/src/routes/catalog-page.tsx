import {
  activeSection,
  homeCards,
  homeEmptyText,
  sectionHasCards,
  type SectionId,
} from '@catalogo/shared'
import { useSearchParams } from 'react-router-dom'

import { products } from '../catalog/products.generated'
import { TopBar } from '../components/catalog/top-bar'
import { WatchCard } from '../components/catalog/watch-card'
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs'

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'available', label: 'Pronta entrega' },
  { id: 'coming-soon', label: 'A caminho' },
  { id: 'on-order', label: 'Encomendar' },
]

const resultsEnterClass =
  'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200'

const MOBILE_CARD_ROW_PX = 144
const DESKTOP_CARD_BODY_PX = 160
const DESKTOP_GRID_GAP_PX = 24

/** How many home cards fit in the first screen, including a row that is only partly visible. */
export function eagerHomeCardCount(viewportWidth: number, viewportHeight: number): number {
  const columns = viewportWidth >= 1024 ? 3 : viewportWidth >= 768 ? 2 : 1
  const chrome = viewportWidth >= 768 ? 136 : 112
  const contentWidth =
    columns === 1 ? viewportWidth : Math.min(viewportWidth, 1120) - 48
  const image =
    columns === 1
      ? 128
      : (contentWidth - DESKTOP_GRID_GAP_PX * (columns - 1)) / columns
  const row = columns === 1 ? MOBILE_CARD_ROW_PX : image + DESKTOP_CARD_BODY_PX + DESKTOP_GRID_GAP_PX
  const rows = Math.max(1, Math.ceil(Math.max(viewportHeight - chrome, 1) / row))
  return columns * rows
}

function eagerCardCount(): number {
  const width = window.innerWidth || 1024
  const height = window.innerHeight || 800
  return eagerHomeCardCount(width, height)
}

function isSectionId(value: string | null): value is SectionId {
  return value === 'all' || value === 'available' || value === 'coming-soon' || value === 'on-order'
}

export function CatalogPage() {
  const [params, setParams] = useSearchParams()
  const sectionParam = params.get('section')
  const requested = activeSection(products, sectionParam)
  const filled = SECTIONS.filter((section) => sectionHasCards(products, section.id))
  const resolved =
    filled.length === 0 ? 'all' : sectionHasCards(products, requested) ? requested : filled[0].id
  const cards = homeCards(products, resolved)
  const eagerCards = eagerCardCount()
  const emptyText = homeEmptyText(products, resolved)

  function selectSection(id: SectionId) {
    if (!sectionHasCards(products, id)) return
    const raw = params.get('section')
    if (raw === id) return
    if (!isSectionId(raw) && id === resolved && id !== 'all') return
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('section', id)
      return next
    })
  }

  return (
    <>
      <TopBar />
      <main className="max-w-full min-w-0 overflow-x-clip">
        <div data-testid="catalog-page-column" className="catalog-column catalog-vitrine py-2 md:py-4">
          <div className="mb-2 md:mb-6">
            <Tabs
              data-testid="section-toggle"
              className="items-center"
              value={resolved}
              onValueChange={(id) => {
                if (isSectionId(id)) selectSection(id)
              }}
            >
              <TabsList
                variant="line"
                aria-label="Seção"
                className="h-8 w-fit gap-3 p-0 text-[14px] group-data-horizontal/tabs:h-8 md:text-[15px]"
              >
                {SECTIONS.map((section) => (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    disabled={!sectionHasCards(products, section.id)}
                    className="w-auto flex-none px-0 text-[14px] data-active:font-bold data-active:text-primary data-active:after:bg-primary md:text-[15px] dark:data-active:text-primary"
                  >
                    {section.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <div key={resolved} data-testid="catalog-results" className={resultsEnterClass}>
            {emptyText !== null ? (
              <p className="m-0 text-[var(--ink-primary)]">{emptyText}</p>
            ) : cards.length === 0 ? null : (
              <ul
                data-testid="catalog-grid"
                className="catalog-grid m-0 grid list-none grid-cols-1 items-stretch gap-4 p-0 md:grid-cols-2 md:gap-6 lg:grid-cols-3"
              >
                {cards.map((card, index) => {
                  const product = products.find((item) => item.slug === card.slug)
                  if (product === undefined) return null
                  return (
                    <li key={`${card.slug}-${card.listingId}`} className="flex h-full">
                      <WatchCard
                        product={product}
                        card={card}
                        imageLoading={index < eagerCards ? 'eager' : 'lazy'}
                      />
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
