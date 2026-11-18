import type { CatalogCard, Product } from '@catalogo/shared'
import { effectiveState, resolveVariant, shareMessage, STATE_LABEL } from '@catalogo/shared'
import { Link, useLocation } from 'react-router-dom'

import { Card } from '@/components/ui/card'

import { OfferRow, ProductAvailabilityBadge } from './product-badges'
import { OnOrderPriceNote, PriceBlock } from './price-block'
import { WantIconLink } from './want-link'

export type WatchCardProps = {
  product: Product
  card: CatalogCard
  /** `lazy` for covers below the first screen. Defaults to eager. */
  imageLoading?: 'eager' | 'lazy'
}

export function productImageSrc(slug: string, fileName: string): string {
  return `/catalog/products/${slug}/img/${fileName}`
}

/** ~400px file for cards and thumbnails. Gallery and zoom keep `productImageSrc`. */
export function productThumbSrc(slug: string, fileName: string): string {
  return `/catalog/products/${slug}/img/thumbs/${fileName}`
}

export function catalogThumbSrc(src: string): string {
  return src.replace(/\/img\/([^/]+)$/, '/img/thumbs/$1')
}

function listingVariantForCard(product: Product, card: CatalogCard) {
  const listing = product.listings.find((item) => item.id === card.listingId)
  if (listing === undefined) {
    throw new Error(`WatchCard: listing ${card.listingId} not found on product ${product.slug}`)
  }
  const params = new URL(card.path, 'http://localhost').searchParams
  const variant = resolveVariant(listing, {
    v: params.get('v'),
    state: params.get('state'),
    availability: params.get('availability'),
  })
  return { listing, variant }
}

export function WatchCard({ product, card, imageLoading = 'eager' }: WatchCardProps) {
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  const section = params.get('section')
  const filter = params.get('filter')
  const linkState: { fromCatalog: true; section?: string; filter?: string } = { fromCatalog: true }
  if (section !== null && section !== '') linkState.section = section
  if (filter !== null && filter !== '') linkState.filter = filter
  const { listing, variant } = listingVariantForCard(product, card)
  const shareText = shareMessage(product, listing, variant, window.location.origin)
  const condition = effectiveState(variant)
  const isOnOrder = card.availabilityStatus === 'on_order'

  return (
    <Card className="h-full w-full gap-0 overflow-hidden rounded-none border-0 bg-background p-0 py-0 shadow-none ring-0 md:rounded-[12px] md:border-[1px] md:bg-card">
      <div data-testid="watch-card-row" className="flex w-full flex-1 items-start gap-2 md:block">
        <Link to={card.path} state={linkState} className="contents">
          <div
            data-testid="watch-card-image"
            className="relative size-32 shrink-0 md:aspect-square md:size-auto md:w-full"
          >
            <img
              src={productThumbSrc(product.slug, card.image)}
              alt={card.title}
              loading={imageLoading}
              className="h-full w-full object-contain"
            />
            {condition === 'used' || condition === 'openbox' ? (
              <span
                data-testid="card-image-state-badge"
                className="pointer-events-none absolute top-0 right-0 rounded-bl-[4px] bg-orange-600 px-1.5 py-0.5 text-xs font-medium leading-none text-white md:px-2.5 md:py-1 md:text-sm"
              >
                {STATE_LABEL[condition]}
              </span>
            ) : null}
          </div>
        </Link>
        <div
          data-testid="watch-card-body"
          className="relative flex min-w-0 flex-1 flex-col items-start self-stretch gap-1 text-left md:mt-3 md:w-full md:flex-none md:gap-2 md:px-[24px] md:pb-[24px]"
        >
          <div className="flex h-full w-full flex-1 items-start gap-2 md:h-auto md:flex-none md:gap-3">
            <Link
              to={card.path}
              state={linkState}
              data-testid="watch-card-link"
              className="flex min-w-0 flex-1 flex-col items-start self-start gap-1 md:gap-2"
            >
              {!isOnOrder && card.offers.length > 0 ? <OfferRow offers={card.offers} /> : null}
              <p
                data-testid="product-condition"
                className="m-0 flex flex-wrap items-center gap-1.5 text-xs leading-none text-muted-foreground"
              >
                <ProductAvailabilityBadge availabilityStatus={card.availabilityStatus} compact />
              </p>
              <h2 className="m-0 line-clamp-1 w-full min-w-0 truncate overflow-hidden text-ellipsis whitespace-nowrap text-[13px] leading-snug font-medium text-foreground md:font-display md:text-[15px] md:leading-snug md:font-semibold">
                {card.title}
              </h2>
              <div className="flex w-full flex-col items-start gap-1 md:gap-2">
                {isOnOrder ? (
                  <OnOrderPriceNote showcase />
                ) : (
                  <PriceBlock price={card.price!} listPrice={card.listPrice} showcase />
                )}
              </div>
            </Link>
            <div data-testid="watch-card-mobile-action" className="flex h-full shrink-0 flex-col justify-end self-stretch pb-1 pr-1 md:h-auto">
              <WantIconLink slug={product.slug} title={card.title} href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} />
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
