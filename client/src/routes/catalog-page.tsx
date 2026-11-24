import type { Label } from '@catalogo/shared'
import { activeFilter, filterHasCards, homeCards } from '@catalogo/shared'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import * as catalogGenerated from '../catalog/products.generated'
import { TopBar } from '../components/catalog/top-bar'
import { WatchCard } from '../components/catalog/watch-card'
import { Button } from '../components/ui/button'

const FIXED_FILTERS = [
  { id: 'female', label: 'Feminino' },
  { id: 'male', label: 'Masculino' },
  { id: 'new', label: 'Novos' },
  { id: 'openbox', label: 'Openbox' },
  { id: 'used', label: 'Usados' },
] as const

export function buildFilterPills(labels: Label[]) {
  const labelPills = labels
    .filter((label) => label.enabled && label.filterable)
    .map((label) => ({
      id: label.id,
      label: label.type === 'campaign' ? label.shortText : label.text,
    }))
  return [{ id: 'all', label: 'Todos' }, ...labelPills, ...FIXED_FILTERS]
}

const resultsEnterClass =
  'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200'

/** Narrowest column. Two still fit a 360px vitrine after 12px of side padding. */
export const HOME_COLUMN_MIN_PX = 152
export const HOME_COLUMN_GAP_PX = 8
const HOME_CARD_BODY_PX = 120

export function vitrineContentWidth(viewportWidth: number): number {
  const capped = Math.min(Math.max(viewportWidth, 0), 1120)
  return Math.max(0, capped - 24)
}

export function homeColumnCount(contentWidth: number): number {
  if (contentWidth <= 0) return 1
  const span = HOME_COLUMN_MIN_PX + HOME_COLUMN_GAP_PX
  return Math.max(1, Math.floor((contentWidth + HOME_COLUMN_GAP_PX) / span))
}

/** Deal the sorted list across columns: index 0, 2, 4 go left when there are two. */
export function dealIntoColumns<T>(items: readonly T[], columnCount: number): T[][] {
  const count = Math.max(1, columnCount)
  const columns: T[][] = Array.from({ length: count }, () => [])
  items.forEach((item, index) => {
    columns[index % count]!.push(item)
  })
  return columns
}

/** How many home cards fit in the first screen, including a row that is only partly visible. */
export function eagerHomeCardCount(viewportWidth: number, viewportHeight: number): number {
  const contentWidth = vitrineContentWidth(viewportWidth)
  const columns = homeColumnCount(contentWidth)
  const image =
    (contentWidth - HOME_COLUMN_GAP_PX * (columns - 1)) / columns
  const row = image + HOME_CARD_BODY_PX + HOME_COLUMN_GAP_PX
  const chrome = viewportWidth >= 768 ? 136 : 112
  const rows = Math.max(1, Math.ceil(Math.max(viewportHeight - chrome, 1) / row))
  return columns * rows
}

function useViewportWidth(): number {
  const [width, setWidth] = useState(() => window.innerWidth || 1024)
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return width
}

function eagerCardCount(): number {
  const width = window.innerWidth || 1024
  const height = window.innerHeight || 800
  return eagerHomeCardCount(width, height)
}

export function CatalogPage() {
  const [params, setParams] = useSearchParams()
  const viewportWidth = useViewportWidth()
  const filterParam = params.get('filter')
  const catalogProducts = catalogGenerated.products
  const catalogLabels = catalogGenerated.labels ?? []
  const requested = activeFilter(filterParam, catalogLabels)
  const resolved =
    requested !== 'all' && !filterHasCards(catalogProducts, requested, catalogLabels)
      ? 'all'
      : requested
  const cards = homeCards(catalogProducts, resolved, catalogLabels)
  const filters = buildFilterPills(catalogLabels)
  const eagerCards = eagerCardCount()
  const emptyText = cards.length === 0 ? 'Não temos nenhum anúncio ativo.' : null

  function selectFilter(id: string) {
    if (id !== 'all' && !filterHasCards(catalogProducts, id, catalogLabels)) return
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
              {filters.map((filter) => (
                <Button
                  key={filter.id}
                  type="button"
                  variant={resolved === filter.id ? 'default' : 'outline'}
                  aria-pressed={resolved === filter.id}
                  disabled={
                    filter.id === 'all'
                      ? cards.length === 0
                      : !filterHasCards(catalogProducts, filter.id, catalogLabels)
                  }
                  className="flex-none cursor-pointer rounded-full"
                  onClick={() => selectFilter(filter.id)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
          <div key={resolved} data-testid="catalog-results" className={`catalog-results ${resultsEnterClass}`}>
            {emptyText !== null ? (
              <p className="m-0 text-[var(--ink-primary)]">{emptyText}</p>
            ) : cards.length === 0 ? null : (
              <div
                data-testid="catalog-grid"
                className="catalog-grid flex items-start"
                style={{ gap: HOME_COLUMN_GAP_PX }}
              >
                {dealIntoColumns(cards, homeColumnCount(vitrineContentWidth(viewportWidth))).map(
                  (column, columnIndex) => (
                    <ul
                      key={columnIndex}
                      data-testid="catalog-column-stack"
                      className="m-0 flex min-w-0 flex-1 list-none flex-col p-0"
                      style={{ gap: HOME_COLUMN_GAP_PX }}
                    >
                      {column.map((card) => {
                        const product = catalogProducts.find((item) => item.slug === card.slug)
                        if (product === undefined) return null
                        const index = cards.indexOf(card)
                        return (
                          <li key={`${card.slug}-${card.listingId}`} className="min-w-0">
                            <WatchCard
                              product={product}
                              card={card}
                              imageLoading={index < eagerCards ? 'eager' : 'lazy'}
                            />
                          </li>
                        )
                      })}
                    </ul>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
