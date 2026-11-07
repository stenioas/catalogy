import {
  activeSection,
  filterGroups,
  homeCards,
  homeEmptyText,
  type FilterMarks,
  type SectionId,
} from '@catalogo/shared'
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

const RESERVED_QUERY_KEYS = new Set(['section', 'state', 'audience', 'v', 'seller'])
const resultsEnterClass =
  'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200'

function isSectionId(value: string | null): value is SectionId {
  return value === 'available' || value === 'coming-soon' || value === 'on-order'
}

function tokens(params: URLSearchParams, key: string): string[] {
  return params
    .getAll(key)
    .flatMap((part) => part.split(','))
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
}

function marksFromParams(params: URLSearchParams): FilterMarks {
  const axes: Record<string, string[]> = {}
  for (const key of new Set(params.keys())) {
    if (RESERVED_QUERY_KEYS.has(key)) continue
    const values = tokens(params, key)
    if (values.length > 0) axes[key] = values
  }
  return {
    state: tokens(params, 'state'),
    audience: tokens(params, 'audience'),
    axes,
  }
}

function selectedInGroup(marks: FilterMarks, groupId: string, optionId: string): boolean {
  if (groupId === 'state') return marks.state.includes(optionId)
  if (groupId === 'audience') return marks.audience.includes(optionId)
  return (marks.axes[groupId] ?? []).includes(optionId)
}

export function CatalogPage() {
  const [params, setParams] = useSearchParams()
  const sectionParam = params.get('section')
  const marks = marksFromParams(params)
  const resolved = activeSection(products, sectionParam)
  const groups = filterGroups(products, sectionParam)
  const cards = homeCards(products, sectionParam, marks)
  const emptyText = homeEmptyText(products, sectionParam, marks)

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

  function toggleMark(groupId: string, optionId: string) {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      const current = tokens(next, groupId)
      const updated = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId]
      if (updated.length === 0) next.delete(groupId)
      else next.set(groupId, updated.join(','))
      return next
    })
  }

  return (
    <>
      <TopBar />
      <main className="max-w-full min-w-0 overflow-x-clip">
        <div data-testid="catalog-page-column" className="catalog-column catalog-vitrine py-8">
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
              {groups.length > 0 ? (
                <div className="mb-6 flex flex-col gap-4">
                  {groups.map((group) => (
                    <fieldset key={group.id} className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
                      <legend className="text-sm font-medium text-[var(--ink-primary)]">{group.label}</legend>
                      <div className="flex flex-wrap gap-3">
                        {group.options.map((option) => (
                          <label
                            key={option.id}
                            className="inline-flex items-center gap-2 text-sm text-[var(--ink-primary)]"
                          >
                            <input
                              type="checkbox"
                              checked={selectedInGroup(marks, group.id, option.id)}
                              onChange={() => toggleMark(group.id, option.id)}
                            />
                            {option.label}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                </div>
              ) : null}
              <div
                key={`${resolved}|${params.toString()}`}
                data-testid="catalog-results"
                className={resultsEnterClass}
              >
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
