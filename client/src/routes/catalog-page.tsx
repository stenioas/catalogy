import { activeFilter, filterHasCards, homeCards } from '@catalogo/shared'
import { useSearchParams } from 'react-router-dom'

import { products } from '../catalog/products.generated'
import { TopBar } from '../components/catalog/top-bar'
import { WatchCard } from '../components/catalog/watch-card'
import { Button } from '../components/ui/button'

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'discount', label: '20%+ de desconto' },
  { id: 'female', label: 'Feminino' },
  { id: 'male', label: 'Masculino' },
  { id: 'new', label: 'Novos' },
  { id: 'openbox', label: 'Openbox' },
  { id: 'used', label: 'Usados' },
] as const

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

export function CatalogPage() {
  const [params, setParams] = useSearchParams()
  const filterParam = params.get('filter')
  const requested = activeFilter(filterParam)
  const resolved = requested !== 'all' && !filterHasCards(products, requested) ? 'all' : requested
  const cards = homeCards(products, resolved)
  const eagerCards = eagerCardCount()
  const emptyText = cards.length === 0 ? 'Não temos nenhum anúncio ativo.' : null

  function selectFilter(id: (typeof FILTERS)[number]['id']) {
    if (id !== 'all' && !filterHasCards(products, id)) return
    if (id === resolved) return
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (id === 'all') next.delete('filter')
      else next.set('filter', id)
      return next
    })
  }

  return (
    <>
      <TopBar />
      <main className="max-w-full min-w-0 overflow-x-clip">
        <div data-testid="catalog-page-column" className="catalog-column catalog-vitrine py-2 md:py-4">
          <div className="mb-2 md:mb-6">
            <div role="group" aria-label="Filtros" className="catalog-filters flex flex-nowrap gap-2 overflow-x-auto px-1">
              {FILTERS.map((filter) => (
                <Button
                  key={filter.id}
                  type="button"
                  variant={resolved === filter.id ? 'default' : 'outline'}
                  aria-pressed={resolved === filter.id}
                  disabled={filter.id === 'all' ? cards.length === 0 : !filterHasCards(products, filter.id)}
                  className="flex-none cursor-pointer rounded-full"
                  onClick={() => selectFilter(filter.id)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
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
