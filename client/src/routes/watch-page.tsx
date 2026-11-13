import { useState, type ReactNode } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import {
  listingByPath,
  listingPath,
  resolveVariant,
  shareMessage,
  type Product,
  type Variant,
} from '@catalogo/shared'

import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'

import { products } from '../catalog/products.generated'
import { AxisSelectors } from '../components/catalog/axis-selectors'
import { ProductMedia } from '../components/catalog/product-media'
import { OnOrderPriceNote, PriceBlock } from '../components/catalog/price-block'
import { OfferRow } from '../components/catalog/product-badges'
import { StickyBar } from '../components/catalog/sticky-bar'
import { TopBar } from '../components/catalog/top-bar'
import { ProductShareButton } from '../components/catalog/want-link'
import { productImageSrc } from '../components/catalog/watch-card'

export const MISSING_WATCH_MESSAGE = 'Este relógio não está no catálogo.'

function readSection(state: unknown): string | undefined {
  if (state === null || typeof state !== 'object' || !('section' in state)) return undefined
  const section = state.section
  if (typeof section !== 'string' || section === '') return undefined
  return section
}

export function catalogReturnHref(state: unknown): string {
  const section = readSection(state)
  if (section === undefined) return '/'
  return `/?section=${encodeURIComponent(section)}`
}

function stateAfterVariantChange(state: unknown): { section: string } | undefined {
  const section = readSection(state)
  return section === undefined ? undefined : { section }
}

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

function ProductTitle({ title }: { title: string }) {
  return (
    <h1 className="m-0 max-md:order-2 max-md:mt-3 min-w-0 break-words font-display text-[15px] font-semibold text-foreground md:text-base">
      {title}
    </h1>
  )
}

function ProductIdentity({
  stateLabel,
  availabilityLabel,
  title,
}: {
  stateLabel: string
  availabilityLabel: string
  title: string
}) {
  return <div data-testid="watch-identity" className="flex w-full min-w-0 flex-col items-start gap-0.5 max-md:contents md:gap-2">
    <div data-testid="watch-metadata" className="max-md:order-3 max-md:mt-2">
      <p data-testid="product-condition" className="m-0 flex flex-wrap items-center gap-1.5 text-xs leading-none text-muted-foreground">
        <span data-testid="state-label">{stateLabel}</span>
        <span data-testid="availability-badge" className="text-xs">{availabilityLabel}</span>
      </p>
    </div>
    <ProductTitle title={title} />
  </div>
}

const offerWithShareClassName = 'flex w-full min-w-0 flex-col items-stretch gap-3'

function ProductCommerce({
  price,
  listPrice,
  offers,
  onOrder,
  commerceRef,
  share,
  beforeShare,
}: {
  price?: number
  listPrice?: number
  offers: NonNullable<Variant['offers']>
  onOrder: boolean
  commerceRef: (element: HTMLDivElement | null) => void
  share?: ReactNode
  beforeShare?: ReactNode
}) {
  const priceNode = onOrder
    ? <OnOrderPriceNote />
    : price !== undefined ? <PriceBlock price={price} listPrice={listPrice} /> : null
  const stacked = (
    <>
      <div className="min-w-0 flex-1">{priceNode}</div>
      {beforeShare}
      {share}
    </>
  )
  return <div ref={commerceRef} data-testid="watch-commerce" className="flex w-full min-w-0 flex-col items-start gap-1 md:gap-2">
    {offers.length > 0 ? <OfferRow offers={offers} /> : null}
    {onOrder ? (
      share === undefined && beforeShare === undefined ? priceNode : (
        <div className={offerWithShareClassName}>{stacked}</div>
      )
    ) : (
      <div data-testid="watch-offer" className={offerWithShareClassName}>
        {stacked}
      </div>
    )}
  </div>
}

function TextSection({ title, value, className }: { title: string; value?: string; className?: string }) {
  if (!hasText(value)) return null
  return <section className={`flex w-full min-w-0 flex-col gap-2${className ? ` ${className}` : ''}`}>
    <h2 className="m-0 font-display text-lg font-semibold text-foreground">{title}</h2>
    <p className="m-0 break-words text-[var(--ink-primary)]">{value}</p>
  </section>
}

function SpecificationSheet({
  title,
  rows,
  className,
}: {
  title: string
  rows: { label: string; value: string }[]
  className?: string
}) {
  const specifications = rows.filter((row) => hasText(row.value))
  if (specifications.length === 0) return null
  return <section className={`w-full min-w-0${className ? ` ${className}` : ''}`}>
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
  className,
}: {
  observations?: string
  productSpecifications: { label: string; value: string }[]
  listingSpecifications: { label: string; value: string }[]
  className?: string
}) {
  return <>
    <TextSection className={className} title="Observações" value={observations} />
    <SpecificationSheet className={className} title="Características do produto" rows={productSpecifications} />
    <SpecificationSheet className={className} title="Características do anúncio" rows={listingSpecifications} />
  </>
}

function WatchColumn({
  slug,
  title,
  stateLabel,
  availabilityLabel,
  availabilityStatus,
  price,
  listPrice,
  offers,
  observations,
  description,
  productSpecifications,
  listingSpecifications,
  images,
  imageIndex,
  shareHref,
  selectors,
  activeV,
  onSelect,
}: {
  slug: string
  title: string
  stateLabel: string
  availabilityLabel: string
  availabilityStatus: 'available' | 'coming_soon' | 'on_order'
  price?: number
  listPrice?: number
  offers: NonNullable<Variant['offers']>
  observations?: string
  description?: string
  productSpecifications: { label: string; value: string }[]
  listingSpecifications: { label: string; value: string }[]
  images: string[]
  imageIndex: number
  shareHref: string
  selectors: Parameters<typeof AxisSelectors>[0]['selectors']
  activeV: string | null
  onSelect: (nextV: string | null) => void
}) {
  const [commerceTarget, setCommerceTarget] = useState<HTMLDivElement | null>(null)
  const onOrder = availabilityStatus === 'on_order'
  const details = <ProductDetails
    observations={observations}
    productSpecifications={productSpecifications}
    listingSpecifications={listingSpecifications}
    className="max-md:order-8 max-md:mt-8"
  />
  const identity = <ProductIdentity stateLabel={stateLabel} availabilityLabel={availabilityLabel} title={title} />
  const axes = selectors.length > 0
    ? <AxisSelectors selectors={selectors} activeV={activeV} onSelect={onSelect} slug={slug} />
    : null
  const share = <ProductShareButton slug={slug} title={title} href={shareHref} />

  return <>
    <ProductMedia
      key={slug}
      images={images.map((file) => productImageSrc(slug, file))}
      alt={title}
      startIndex={imageIndex < 0 ? 0 : imageIndex}
    >
      {({ media, isDesktop }) => {
        const commerce = <ProductCommerce
          price={price}
          listPrice={listPrice}
          offers={offers}
          onOrder={onOrder}
          commerceRef={setCommerceTarget}
          share={isDesktop ? undefined : <div className="pt-2">{share}</div>}
          beforeShare={isDesktop ? undefined : axes}
        />
        return isDesktop ? (
        <div className="grid w-full min-w-0 grid-cols-[fit-content(calc(476px+3.5rem+0.75rem))_minmax(220px,1fr)] items-start gap-6">
          <div data-testid="watch-left-column" className="flex min-w-0 flex-col gap-8">
            {media}
            {details}
          </div>
          <div data-testid="watch-right-column" className="flex min-w-0 flex-col gap-4">
            {identity}
            {commerce}
            {axes}
            <TextSection title="Descrição" value={description} />
            {share}
          </div>
        </div>
      ) : (
        <div className="flex w-full min-w-0 flex-col gap-8 max-md:gap-0">
          <div data-testid="watch-intro" className="contents">
            {identity}
            <div className="max-md:order-1 md:contents">{media}</div>
            <div className="max-md:order-4 max-md:mt-3 md:contents">{commerce}</div>
          </div>
          <TextSection className="max-md:order-7 max-md:mt-8" title="Descrição" value={description} />
          {details}
        </div>
      )
      }}
    </ProductMedia>
    <StickyBar
      price={price}
      listPrice={listPrice}
      availabilityStatus={availabilityStatus}
      availabilityLabel={availabilityLabel}
      offers={offers}
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
  const location = useLocation()
  const catalogHref = catalogReturnHref(location.state)
  const requestedV = params.get('v')
  const resolvedListingId = listingId === undefined || listingId === '' ? null : listingId
  const view = listingByPath(products, slug, resolvedListingId, requestedV)
  const product = products.find((item) => item.slug === slug)
  const listing = view.missing || product === undefined
    ? undefined
    : product.listings.find((item) => item.id === view.listingId)
  if (view.missing || product === undefined || listing === undefined) {
    return (
      <>
        <TopBar catalogHref={catalogHref} />
        <main className="max-w-full min-w-0 overflow-x-clip">
          <div data-testid="watch-page-column" className="catalog-column watch-page-column flex flex-col gap-8 pb-8 text-left md:py-8">
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
  const imageIndex = view.imageIndex

  function selectVariant(nextV: string | null) {
    const valueIds = nextV === null || nextV.trim() === '' ? [] : nextV.split(',')
    navigate(listingPath(product!.slug, listing!.id, valueIds), {
      flushSync: true,
      state: stateAfterVariantChange(location.state),
    })
  }

  return (
    <>
      <TopBar catalogHref={catalogHref} />
      <main className="max-w-full min-w-0 overflow-x-clip">
        <div data-testid="watch-page-column" className="catalog-column watch-page-column flex flex-col gap-8 pb-8 text-left md:py-8">
          <WatchColumn
            slug={product.slug}
            title={product.title}
            stateLabel={view.stateLabel}
            availabilityLabel={view.availabilityLabel}
            availabilityStatus={view.availabilityStatus}
            price={view.price}
            listPrice={view.listPrice}
            offers={view.offers}
            observations={view.observations}
            description={view.description}
            productSpecifications={view.productSpecifications}
            listingSpecifications={view.listingSpecifications}
            images={view.images}
            imageIndex={imageIndex}
            shareHref={shareHref}
            selectors={view.selectors}
            activeV={activeV}
            onSelect={selectVariant}
          />
        </div>
      </main>
    </>
  )
}
