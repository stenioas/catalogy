import { compareTitles } from '@catalogo/shared'

import { products } from '../catalog/products.generated'
import { TopBar } from '../components/catalog/top-bar'
import { WatchCard } from '../components/catalog/watch-card'

export const EMPTY_VITRINE_MESSAGE = 'A vitrine ainda não tem relógios.'

export function CatalogPage() {
  const sortedProducts = [...products].sort((a, b) =>
    compareTitles(a.title, b.title),
  )

  return (
    <>
      <TopBar />
      <main className="max-w-full min-w-0 overflow-x-clip">
        <div data-testid="catalog-page-column" className="catalog-column py-8">
          {sortedProducts.length === 0 ? (
            <p className="m-0 text-[var(--ink-primary)]">{EMPTY_VITRINE_MESSAGE}</p>
          ) : (
            <ul
              data-testid="catalog-grid"
              className="m-0 grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-2 lg:grid-cols-3"
            >
              {sortedProducts.map((product) => (
                <li key={product.slug}>
                  <WatchCard product={product} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  )
}
