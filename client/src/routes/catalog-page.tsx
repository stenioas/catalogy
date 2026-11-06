import { homeCards, type FilterMarks } from '@catalogo/shared'
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import { products } from '../catalog/products.generated'
import { TopBar } from '../components/catalog/top-bar'
import { WatchCard } from '../components/catalog/watch-card'

export const EMPTY_VITRINE_MESSAGE = 'A vitrine ainda não tem relógios.'

const emptyMarks: FilterMarks = { state: [], audience: [], axes: {} }

export function CatalogPage() {
  const location = useLocation()
  const section = useMemo(() => new URLSearchParams(location.search).get('section'), [location.search])

  const cards = useMemo(() => homeCards(products, section, emptyMarks), [section])

  return (
    <>
      <TopBar />
      <main className="max-w-full min-w-0 overflow-x-clip">
        <div data-testid="catalog-page-column" className="catalog-column catalog-vitrine py-8">
          {cards.length === 0 ? (
            <p className="m-0 text-[var(--ink-primary)]">{EMPTY_VITRINE_MESSAGE}</p>
          ) : (
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
      </main>
    </>
  )
}
