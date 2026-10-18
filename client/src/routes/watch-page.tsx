import { useState } from 'react'

import { isProductListed, type Product } from '@catalogo/shared'

import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'

import { products } from '../catalog/products.generated'
import { ProductMedia } from '../components/catalog/product-media'
import { PriceBlock } from '../components/catalog/price-block'
import { ProductConditionLine, UnmissableOfferBadge } from '../components/catalog/product-badges'
import { StickyBar } from '../components/catalog/sticky-bar'
import { TopBar } from '../components/catalog/top-bar'
import { ProductShareButton } from '../components/catalog/want-link'
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
  return <h1 className="m-0 min-w-0 break-words font-display text-base font-semibold text-foreground">{product.title}</h1>
}

function ProductIdentity({ product }: { product: Product }) {
  return <div data-testid="watch-identity" className="flex w-full min-w-0 flex-col items-start gap-0.5 md:gap-2">
    <div data-testid="watch-metadata">
      <ProductConditionLine state={product.state} availabilityStatus={product.availabilityStatus} />
    </div>
    <ProductTitle product={product} />
  </div>
}

function ProductCommerce({
  product,
  wantRef,
  share,
}: {
  product: Product
  wantRef: (element: HTMLAnchorElement | null) => void
  share: 'beside-price' | 'below-description'
}) {
  return <div data-testid="watch-commerce" className="flex w-full min-w-0 flex-col items-start gap-1 md:gap-2">
    {hasText(product.color) ? <p data-testid="watch-color" className="m-0 break-words text-[var(--ink-primary)]">Cor: {product.color}</p> : null}
    {product.unmissableOffer ? <UnmissableOfferBadge /> : null}
    <ProductPriceShare product={product} wantRef={wantRef} share={share} />
  </div>
}

function ProductPriceShare({
  product,
  wantRef,
  share,
}: {
  product: Product
  wantRef: (element: HTMLAnchorElement | null) => void
  share: 'beside-price' | 'below-description'
}) {
  return <div data-testid="watch-offer" className="flex w-full min-w-0 flex-col items-stretch gap-3 md:max-[919px]:grid md:max-[919px]:grid-cols-2 md:max-[919px]:items-end">
    <div className="min-w-0 flex-1">
      <PriceBlock price={product.price} listPrice={product.listPrice} unmissableOffer={product.unmissableOffer} />
    </div>
    {share === 'beside-price' ? <ProductShareButton ref={wantRef} slug={product.slug} title={product.title} /> : null}
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

function ProductDetails({ product }: { product: Product }) {
  return <>
    <TextSection title="Observações" value={product.observations} />
    <Specifications product={product} />
  </>
}

function WatchColumn({ product }: { product: Product }) {
  const [wantTarget, setWantTarget] = useState<HTMLAnchorElement | null>(null)

  return <>
    <ProductMedia key={product.slug} images={product.images.map((file) => productImageSrc(product.slug, file))} alt={product.title}>
      {({ media, isDesktop }) => isDesktop ? (
        <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_minmax(220px,280px)] items-start gap-6">
          <div data-testid="watch-left-column" className="flex min-w-0 flex-col gap-8">
            {media}
            <ProductDetails product={product} />
          </div>
          <div data-testid="watch-right-column" className="flex min-w-0 flex-col gap-4">
            <ProductIdentity product={product} />
            <ProductCommerce product={product} wantRef={setWantTarget} share="below-description" />
            <TextSection title="Descrição" value={product.description} />
            <ProductShareButton ref={setWantTarget} slug={product.slug} title={product.title} />
          </div>
        </div>
      ) : (
        <div className="flex w-full min-w-0 flex-col gap-8">
          <div data-testid="watch-intro" className="flex w-full min-w-0 flex-col gap-2 md:contents">
            <ProductIdentity product={product} />
            {media}
            <ProductCommerce product={product} wantRef={setWantTarget} share="beside-price" />
          </div>
          <TextSection title="Descrição" value={product.description} />
          <ProductDetails product={product} />
        </div>
      )}
    </ProductMedia>
    <StickyBar price={product.price} listPrice={product.listPrice} unmissableOffer={product.unmissableOffer} slug={product.slug} title={product.title} target={wantTarget} />
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
        <div data-testid="watch-page-column" className="catalog-column watch-page-column flex flex-col gap-8 pt-2 pb-8 text-left md:py-8">
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
