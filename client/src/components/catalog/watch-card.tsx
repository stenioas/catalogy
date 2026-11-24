import type { CatalogCard, Product } from '@catalogo/shared'
import { AVAILABILITY_LABEL, resolveVariant, shareMessage } from '@catalogo/shared'
import { Link, useLocation } from 'react-router-dom'

import { Card } from '@/components/ui/card'

import { availabilityToneClassName, CampaignBadge, OfferRow } from './product-badges'
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
  const isOnOrder = card.availabilityStatus === 'on_order'

  const showAvailability = card.availabilityStatus !== 'available'

  return (
    <Card className="w-full gap-0 overflow-visible rounded-none border-0 bg-transparent p-0 py-0 shadow-none ring-0">
      <div data-testid="watch-card-row" className="flex w-full flex-col">
        <div data-testid="watch-card-image" className="relative aspect-square w-full overflow-hidden rounded-[12px]">
          <Link to={card.path} state={linkState} className="contents">
            <img
              src={productThumbSrc(product.slug, card.image)}
              alt={card.title}
              loading={imageLoading}
              className="h-full w-full object-contain"
            />
          </Link>
          <div data-testid="watch-card-mobile-action" className="absolute top-1 right-1">
            <WantIconLink
              slug={product.slug}
              title={card.title}
              label="share"
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            />
          </div>
          {!isOnOrder && card.campaign ? (
            <div data-testid="watch-card-campaign" className="pointer-events-none absolute bottom-0 left-0 z-10 flex">
              <CampaignBadge campaign={card.campaign} />
            </div>
          ) : null}
        </div>
        <div
          data-testid="watch-card-body"
          className="flex w-full flex-col items-start gap-1 px-2 pt-2 pb-2 text-left"
        >
          {!isOnOrder && card.offers.length > 0 ? <OfferRow offers={card.offers} /> : null}
          {showAvailability ? (
            <span
              data-testid="availability-badge"
              className={`rounded-[4px] px-1.5 py-0.5 text-xs font-medium leading-none ${availabilityToneClassName[card.availabilityStatus]}`}
            >
              {AVAILABILITY_LABEL[card.availabilityStatus]}
            </span>
          ) : null}
          <Link
            to={card.path}
            state={linkState}
            data-testid="watch-card-link"
            className="flex w-full min-w-0 flex-col items-start gap-1"
          >
            <h2 className="m-0 line-clamp-1 w-full min-w-0 truncate overflow-hidden text-ellipsis whitespace-nowrap text-[13px] leading-snug font-medium text-foreground">
              {card.title}
            </h2>
            {isOnOrder ? (
              <OnOrderPriceNote showcase />
            ) : (
              <PriceBlock price={card.price!} listPrice={card.listPrice} showcase />
            )}
          </Link>
        </div>
      </div>
    </Card>
  )
}
