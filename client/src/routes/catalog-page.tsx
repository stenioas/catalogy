import { activeSection, homeCards, homeEmptyText, type SectionId } from '@catalogo/shared'
import { useSearchParams } from 'react-router-dom'

import { products } from '../catalog/products.generated'
import { TopBar } from '../components/catalog/top-bar'
import { WatchCard } from '../components/catalog/watch-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'available', label: 'Disponível' },
  { id: 'coming-soon', label: 'Chega em breve' },
  { id: 'on-order', label: 'Sob encomenda' },
]

const resultsEnterClass =
  'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200'

function isSectionId(value: string | null): value is SectionId {
  return value === 'available' || value === 'coming-soon' || value === 'on-order'
}

export function CatalogPage() {
  const [params, setParams] = useSearchParams()
  const sectionParam = params.get('section')
  const resolved = activeSection(products, sectionParam)
  const cards = homeCards(products, sectionParam)
  const emptyText = homeEmptyText(products, sectionParam)

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

  return (
    <>
      <TopBar />
      <main className="max-w-full min-w-0 overflow-x-clip">
        <div data-testid="catalog-page-column" className="catalog-column catalog-vitrine py-4">
          <Tabs
            value={resolved}
            onValueChange={(id) => {
              if (isSectionId(id)) selectSection(id)
            }}
            className="mb-6 w-full"
          >
            <TabsList aria-label="Seção" className="w-full bg-[var(--hairline)] md:w-fit">
              {SECTIONS.map((section) => (
                <TabsTrigger
                  key={section.id}
                  value={section.id}
                  className="data-active:bg-primary data-active:text-primary-foreground dark:data-active:bg-primary dark:data-active:text-primary-foreground"
                >
                  {section.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value={resolved}>
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
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  )
}
