import { useState } from 'react'

import { isProductListed, type Product } from '@catalogo/shared'

import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'

import { products } from '../catalog/products.generated'
import { ProductMedia } from '../components/catalog/product-media'
import { PriceBlock } from '../components/catalog/price-block'
import { ProductAvailabilityBadge, ProductStateBadge } from '../components/catalog/product-badges'
import { StickyBar } from '../components/catalog/sticky-bar'
import { TopBar } from '../components/catalog/top-bar'
import { WantLink } from '../components/catalog/want-link'
import { productImageSrc } from '../components/catalog/watch-card'

export const MISSING_WATCH_MESSAGE = 'Este relógio não está no catálogo.'

export type WatchPageProps = {
  slug: string
}

function hasText(value: string | undefined): value is string {
  return value !== undefined && value.trim().length > 0
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

function ProductTitle({ product }: { product: Product }) {
  return <h1 className="m-0 min-w-0 break-words font-display text-xl font-semibold text-foreground">{product.title}</h1>
}

function ProductOffer({ product }: { product: Product }) {
  return <div data-testid="watch-offer" className="flex w-full min-w-0 flex-col gap-4">
    <PriceBlock price={product.price} listPrice={product.listPrice} />
    <div data-testid="watch-metadata" className="flex flex-col items-start gap-2">
      <ProductStateBadge state={product.state} />
      <ProductAvailabilityBadge availabilityStatus={product.availabilityStatus} className="text-xs" />
      {hasText(product.color) ? <p data-testid="watch-color" className="m-0 break-words text-[var(--ink-primary)]">Cor: {product.color}</p> : null}
    </div>
  </div>
}

function TextSection({ title, value }: { title: string; value?: string }) {
  if (!hasText(value)) return null
  return <section className="flex w-full min-w-0 flex-col gap-2">
    <h2 className="m-0 font-display text-lg font-semibold text-foreground">{title}</h2>
    <p className="m-0 break-words text-[var(--ink-primary)]">{value}</p>
  </section>
}

function Specifications({ product }: { product: Product }) {
  const specifications = (product.specifications ?? []).filter((row) => hasText(row.value))
  if (specifications.length === 0) return null
  return <section className="w-full min-w-0">
    <h2 className="m-0 font-display text-lg font-semibold text-foreground">Características do produto</h2>
    <Table className="table-fixed text-left">
      <TableBody>
        {specifications.map((row, index) => (
          <TableRow key={`${index}:${row.label}:${row.value}`}>
            <TableCell className="whitespace-normal break-words align-top">{row.label}</TableCell>
            <TableCell className="whitespace-normal break-words align-top"><SpecificationValue value={row.value} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </section>
}

function WatchColumn({ product }: { product: Product }) {
  const [wantTarget, setWantTarget] = useState<HTMLAnchorElement | null>(null)

  return <>
    <ProductMedia key={product.slug} images={product.images.map((file) => productImageSrc(product.slug, file))} alt={product.title}>
      {({ media, isDesktop }) => isDesktop ? (
        <div className="grid w-full min-w-0 grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start gap-6">
          <div data-testid="watch-left-column" className="flex min-w-0 flex-col gap-8">
            {media}
            <TextSection title="Descrição" value={product.description} />
            <TextSection title="Observações" value={product.observations} />
            <Specifications product={product} />
          </div>
          <div data-testid="watch-right-column" className="flex min-w-0 flex-col gap-8">
            <ProductTitle product={product} />
            <ProductOffer product={product} />
            <WantLink ref={setWantTarget} slug={product.slug} title={product.title} />
          </div>
        </div>
      ) : (
        <div className="flex w-full min-w-0 flex-col gap-8">
          <ProductTitle product={product} />
          {media}
          <ProductOffer product={product} />
          <Specifications product={product} />
          <TextSection title="Descrição" value={product.description} />
          <TextSection title="Observações" value={product.observations} />
          <WantLink ref={setWantTarget} slug={product.slug} title={product.title} />
        </div>
      )}
    </ProductMedia>
    <StickyBar price={product.price} listPrice={product.listPrice} slug={product.slug} title={product.title} target={wantTarget} />
  </>
}

export function WatchPage({ slug }: WatchPageProps) {
  const product =
    products.find((item) => item.slug === slug && isProductListed(item)) ?? null
  const catalogHref = '/'

  return (
    <>
      <TopBar catalogHref={catalogHref} />
      <main className="max-w-full min-w-0 overflow-x-clip">
        <div data-testid="watch-page-column" className="catalog-column flex flex-col gap-8 py-8 text-left">
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
