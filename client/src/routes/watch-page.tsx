import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import {
  listingByPath,
  listingPath,
  resolveVariant,
  shareMessage,
  SPECIFICATION_LABELS,
  type Product,
  type Variant,
} from '@catalogo/shared'

import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'

import { products } from '../catalog/products.generated'
import { AxisSelectors } from '../components/catalog/axis-selectors'
import { ProductMedia } from '../components/catalog/product-media'
import { PriceBlock } from '../components/catalog/price-block'
import { UnmissableOfferBadge } from '../components/catalog/product-badges'
import { StickyBar } from '../components/catalog/sticky-bar'
import { TopBar } from '../components/catalog/top-bar'
import { buildVariantStripItems, VariantStrip } from '../components/catalog/variant-strip'
import { ProductShareButton } from '../components/catalog/want-link'
import { productImageSrc } from '../components/catalog/watch-card'

export const MISSING_WATCH_MESSAGE = 'Este relógio não está no catálogo.'

export type WatchPageProps = {
  slug: string
  /** Empty means `/product/:slug` and lets the catalog choose the listing. */
  listingId?: string
}

function hasText(value: string | undefined): value is string {
  return value !== undefined && value.trim().length > 0
}

function isSimilarAdUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://')
}

const specificationLabelRank = new Map(
  SPECIFICATION_LABELS.map((label, index) => [label, index]),
)

function orderSpecificationRows<T extends { label: string; value: string }>(rows: T[]): T[] {
  const canonical: T[] = []
  const outside: T[] = []
  for (const row of rows) {
    if (specificationLabelRank.has(row.label)) {
      canonical.push(row)
    } else {
      outside.push(row)
    }
  }
  canonical.sort(
    (left, right) =>
      (specificationLabelRank.get(left.label) ?? 0) -
      (specificationLabelRank.get(right.label) ?? 0),
  )
  return [...canonical, ...outside]
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

function activeValueId(variant: Variant, axisId: string): string | undefined {
  return variant.axes.find((selection) => selection.axisId === axisId)?.valueId
}

function variantQuery(product: Product, variant: Variant): string | null {
  if (product.axes.length === 0) return null
  return product.axes
    .map((axis) => activeValueId(variant, axis.id) ?? '')
    .join(',')
}

function variantName(product: Product, variant: Variant): string | null {
  if (product.axes.length === 0) return null
  const parts = product.axes.flatMap((axis) => {
    const selected = axis.values.find((item) => item.id === activeValueId(variant, axis.id))
    if (selected === undefined) return []
    return [selected.alias ?? selected.value]
  })
  if (parts.length === 0) return null
  return parts.join(' ')
}

function axisLines(product: Product, variant: Variant): { axisId: string; label: string; value: string }[] {
  if (product.axes.length === 0) return []
  return product.axes.flatMap((axis) => {
    const selected = axis.values.find((item) => item.id === activeValueId(variant, axis.id))
    if (selected === undefined) return []
    return [{ axisId: axis.id, label: axis.label, value: selected.value }]
  })
}

function ProductTitle({ title }: { title: string }) {
  return <h1 className="m-0 min-w-0 break-words font-display text-base font-semibold text-foreground">{title}</h1>
}

function ProductIdentity({
  stateLabel,
  availabilityLabel,
  title,
  name,
}: {
  stateLabel: string
  availabilityLabel: string
  title: string
  name: string | null
}) {
  return <div data-testid="watch-identity" className="flex w-full min-w-0 flex-col items-start gap-0.5 md:gap-2">
    <div data-testid="watch-metadata">
      <p data-testid="product-condition" className="m-0 flex flex-wrap items-center gap-1.5 text-xs leading-none text-muted-foreground">
        <span data-testid="state-label">{stateLabel}</span>
        <span data-testid="availability-badge" className="text-xs">{availabilityLabel}</span>
      </p>
    </div>
    <ProductTitle title={title} />
    {name !== null ? <p data-testid="variant-name" className="m-0 break-words text-[var(--ink-primary)]">{name}</p> : null}
  </div>
}

function AxisLines({ lines }: { lines: { axisId: string; label: string; value: string }[] }) {
  if (lines.length === 0) return null
  return <>
    {lines.map((line) => (
      <p key={line.axisId} data-testid="axis-line" className="m-0 break-words text-[var(--ink-primary)]">
        {line.label}: {line.value}
      </p>
    ))}
  </>
}

function ProductCommerce({
  lines,
  price,
  listPrice,
  unmissableOffer,
  shareHref,
  commerceRef,
  share,
}: {
  lines: { axisId: string; label: string; value: string }[]
  price: number
  listPrice?: number
  unmissableOffer: boolean
  shareHref: string
  commerceRef: (element: HTMLDivElement | null) => void
  share: 'beside-price' | 'below-description'
}) {
  return <div ref={commerceRef} data-testid="watch-commerce" className="flex w-full min-w-0 flex-col items-start gap-1 md:gap-2">
    <AxisLines lines={lines} />
    {unmissableOffer ? <UnmissableOfferBadge /> : null}
    <div data-testid="watch-offer" className="flex w-full min-w-0 flex-col items-stretch gap-3 md:max-[919px]:grid md:max-[919px]:grid-cols-2 md:max-[919px]:items-end">
      <div className="min-w-0 flex-1">
        <PriceBlock price={price} listPrice={listPrice} unmissableOffer={unmissableOffer} />
      </div>
      {share === 'beside-price' ? <ProductShareButton slug="" title="" href={shareHref} /> : null}
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

function SpecificationSheet({ title, rows }: { title: string; rows: { label: string; value: string }[] }) {
  const specifications = orderSpecificationRows(rows.filter((row) => hasText(row.value)))
  if (specifications.length === 0) return null
  return <section className="w-full min-w-0">
    <h2 className="m-0 font-display text-lg font-semibold text-foreground">{title}</h2>
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

function ProductDetails({
  observations,
  productSpecifications,
  listingSpecifications,
}: {
  observations?: string
  productSpecifications: { label: string; value: string }[]
  listingSpecifications: { label: string; value: string }[]
}) {
  return <>
    <TextSection title="Observações" value={observations} />
    <SpecificationSheet title="Características do produto" rows={productSpecifications} />
    <SpecificationSheet title="Características do anúncio" rows={listingSpecifications} />
  </>
}

function WatchColumn({
  slug,
  title,
  stateLabel,
  availabilityLabel,
  name,
  lines,
  price,
  listPrice,
  unmissableOffer,
  observations,
  description,
  productSpecifications,
  listingSpecifications,
  images,
  imageIndex,
  shareHref,
  strip,
  selectors,
  activeV,
  onSelect,
}: {
  slug: string
  title: string
  stateLabel: string
  availabilityLabel: string
  name: string | null
  lines: { axisId: string; label: string; value: string }[]
  price: number
  listPrice?: number
  unmissableOffer: boolean
  observations?: string
  description?: string
  productSpecifications: { label: string; value: string }[]
  listingSpecifications: { label: string; value: string }[]
  images: string[]
  imageIndex: number
  shareHref: string
  strip: ReturnType<typeof buildVariantStripItems>
  selectors: Parameters<typeof AxisSelectors>[0]['selectors']
  activeV: string | null
  onSelect: (nextV: string | null) => void
}) {
  const [commerceTarget, setCommerceTarget] = useState<HTMLDivElement | null>(null)
  const details = <ProductDetails
    observations={observations}
    productSpecifications={productSpecifications}
    listingSpecifications={listingSpecifications}
  />

  return <>
    <ProductMedia
      key={slug}
      images={images.map((file) => productImageSrc(slug, file))}
      alt={title}
      startIndex={imageIndex < 0 ? 0 : imageIndex}
    >
      {({ media, isDesktop }) => isDesktop ? (
        <div className="grid w-full min-w-0 grid-cols-[fit-content(calc(476px+3.5rem+0.75rem))_minmax(220px,1fr)] items-start gap-6">
          <div data-testid="watch-left-column" className="flex min-w-0 flex-col gap-8">
            {media}
            {details}
          </div>
          <div data-testid="watch-right-column" className="flex min-w-0 flex-col gap-4">
            <ProductIdentity stateLabel={stateLabel} availabilityLabel={availabilityLabel} title={title} name={name} />
            <ProductCommerce
              lines={lines}
              price={price}
              listPrice={listPrice}
              unmissableOffer={unmissableOffer}
              shareHref={shareHref}
              commerceRef={setCommerceTarget}
              share="below-description"
            />
            {selectors.length > 0 ? <AxisSelectors selectors={selectors} activeV={activeV} onSelect={onSelect} /> : null}
            <TextSection title="Descrição" value={description} />
            <ProductShareButton slug={slug} title={title} href={shareHref} />
          </div>
        </div>
      ) : (
        <div className="flex w-full min-w-0 flex-col gap-8">
          <div data-testid="watch-intro" className="flex w-full min-w-0 flex-col gap-2 md:contents">
            <ProductIdentity stateLabel={stateLabel} availabilityLabel={availabilityLabel} title={title} name={name} />
            {media}
            <VariantStrip slug={slug} items={strip} onSelect={onSelect} />
            <ProductCommerce
              lines={lines}
              price={price}
              listPrice={listPrice}
              unmissableOffer={unmissableOffer}
              shareHref={shareHref}
              commerceRef={setCommerceTarget}
              share="beside-price"
            />
          </div>
          <TextSection title="Descrição" value={description} />
          {details}
        </div>
      )}
    </ProductMedia>
    <StickyBar
      price={price}
      listPrice={listPrice}
      unmissableOffer={unmissableOffer}
      slug={slug}
      title={title}
      shareHref={shareHref}
      target={commerceTarget}
    />
  </>
}

export function WatchPage({ slug, listingId }: WatchPageProps) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const requestedV = params.get('v')
  const resolvedListingId = listingId === undefined || listingId === '' ? null : listingId
  const view = listingByPath(products, slug, resolvedListingId, requestedV)
  const product = products.find((item) => item.slug === slug)
  const listing = view.missing || product === undefined
    ? undefined
    : product.listings.find((item) => item.id === view.listingId)
  const catalogHref = '/'

  if (view.missing || product === undefined || listing === undefined) {
    return (
      <>
        <TopBar catalogHref={catalogHref} />
        <main className="max-w-full min-w-0 overflow-x-clip">
          <div data-testid="watch-page-column" className="catalog-column watch-page-column flex flex-col gap-8 pt-2 pb-8 text-left md:py-8">
            <p className="m-0 text-[var(--ink-primary)]">{MISSING_WATCH_MESSAGE}</p>
          </div>
        </main>
      </>
    )
  }

  const variant = resolveVariant(listing, requestedV)
  const activeV = variantQuery(product, variant)
  const message = shareMessage(product, listing, variant, window.location.origin)
  const shareHref = `https://wa.me/?text=${encodeURIComponent(message)}`
  const name = variantName(product, variant)
  const lines = axisLines(product, variant)

  function selectVariant(nextV: string | null) {
    const valueIds = nextV === null || nextV.trim() === '' ? [] : nextV.split(',')
    navigate(listingPath(product!.slug, listing!.id, valueIds))
  }

  return (
    <>
      <TopBar catalogHref={catalogHref} />
      <main className="max-w-full min-w-0 overflow-x-clip">
        <div data-testid="watch-page-column" className="catalog-column watch-page-column flex flex-col gap-8 pt-2 pb-8 text-left md:py-8">
          <WatchColumn
            slug={product.slug}
            title={product.title}
            stateLabel={view.stateLabel}
            availabilityLabel={view.availabilityLabel}
            name={name}
            lines={lines}
            price={view.price}
            listPrice={view.listPrice}
            unmissableOffer={view.unmissableOffer}
            observations={view.observations}
            description={view.description}
            productSpecifications={view.productSpecifications}
            listingSpecifications={view.listingSpecifications}
            images={view.images}
            imageIndex={view.imageIndex}
            shareHref={shareHref}
            strip={buildVariantStripItems(product, listing, activeV)}
            selectors={view.selectors}
            activeV={activeV}
            onSelect={selectVariant}
          />
        </div>
      </main>
    </>
  )
}
