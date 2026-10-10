import { useRef } from 'react'

import { isProductListed, type Product } from '@catalogo/shared'

import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'

import { products } from '../catalog/products.generated'
import { Carousel } from '../components/catalog/carousel'
import { PriceBlock } from '../components/catalog/price-block'
import { StickyBar } from '../components/catalog/sticky-bar'
import { TopBar } from '../components/catalog/top-bar'
import { WantLink } from '../components/catalog/want-link'
import { productImageSrc } from '../components/catalog/watch-card'

export const MISSING_WATCH_MESSAGE = 'Este relógio não está no catálogo.'

export type WatchPageProps = {
  slug: string
}

function hasText(value: string | undefined): value is string {
  return value !== undefined && value !== ''
}

function isSimilarAdUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://')
}

function SpecificationValue({ value }: { value: string }) {
  if (!isSimilarAdUrl(value)) return value
  return (
    <a
      href={value}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#0066cc] dark:text-[#2997ff]"
    >
      Ver anúncio similar
    </a>
  )
}

function WatchColumn({ product }: { product: Product }) {
  const specifications = product.specifications ?? []
  const wantRef = useRef<HTMLAnchorElement>(null)

  return (
    <>
      <Carousel
        images={product.images.map((file) => productImageSrc(product.slug, file))}
        alt={product.title}
      />
      <h1 className="m-0 font-display text-xl font-semibold text-foreground">{product.title}</h1>
      <div
        data-testid="watch-offer"
        className="flex w-full flex-col gap-4 md:flex-row md:items-center"
      >
        <div className="min-w-0 md:flex-1">
          <PriceBlock price={product.price} listPrice={product.listPrice} />
        </div>
        <div className="w-full min-w-0 md:flex-1">
          <WantLink ref={wantRef} slug={product.slug} title={product.title} />
        </div>
      </div>
      {hasText(product.description) ? (
        <section>
          <h2 className="m-0 font-display text-lg font-semibold text-foreground">Descrição</h2>
          <p className="m-0 text-[var(--ink-primary)]">{product.description}</p>
        </section>
      ) : null}
      {specifications.length > 0 ? (
        <section className="w-full min-w-0">
          <h2 className="m-0 font-display text-lg font-semibold text-foreground">Especificações</h2>
          <Table className="table-fixed text-left">
            <TableBody>
              {specifications.map((row) => (
                <TableRow key={`${row.label}:${row.value}`}>
                  <TableCell className="whitespace-normal break-words align-top">
                    {row.label}
                  </TableCell>
                  <TableCell className="whitespace-normal break-words align-top">
                    <SpecificationValue value={row.value} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      ) : null}
      {hasText(product.observations) ? (
        <section>
          <h2 className="m-0 font-display text-lg font-semibold text-foreground">Observações</h2>
          <p className="m-0 text-[var(--ink-primary)]">{product.observations}</p>
        </section>
      ) : null}
      <StickyBar
        price={product.price}
        listPrice={product.listPrice}
        slug={product.slug}
        title={product.title}
        targetRef={wantRef}
      />
    </>
  )
}

export function WatchPage({ slug }: WatchPageProps) {
  const product =
    products.find((item) => item.slug === slug && isProductListed(item)) ?? null
  const catalogHref = '/'

  return (
    <>
      <TopBar catalogHref={catalogHref} />
      <main className="max-w-full min-w-0 overflow-x-clip">
        <div data-testid="watch-page-column" className="catalog-column flex flex-col items-start gap-8 py-8 text-left">
          {product ? (
            <WatchColumn product={product} />
          ) : (
            <p className="m-0 text-[var(--ink-primary)]">{MISSING_WATCH_MESSAGE}</p>
          )}
        </div>
      </main>
    </>
  )
}
