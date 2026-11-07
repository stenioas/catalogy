import type { CatalogCard, Product } from '@catalogo/shared'
import { resolveVariant, shareMessage } from '@catalogo/shared'
import { Link, useLocation } from 'react-router-dom'

import { Card } from '@/components/ui/card'

import { PriceBlock } from './price-block'
import { ProductConditionLine, UnmissableOfferBadge } from './product-badges'
import { WantIconLink } from './want-link'

export type WatchCardProps = {
  product: Product
  card: CatalogCard
}

export function productImageSrc(slug: string, fileName: string): string {
  return `/catalog/products/${slug}/img/${fileName}`
}

function listingVariantForCard(product: Product, card: CatalogCard) {
  const listing = product.listings.find((item) => item.id === card.listingId)
  if (listing === undefined) {
    throw new Error(`WatchCard: listing ${card.listingId} not found on product ${product.slug}`)
  }
  const vParam = new URL(card.path, 'http://localhost').searchParams.get('v')
  const variant = resolveVariant(listing, vParam)
  return { listing, variant }
}

export function WatchCard({ product, card }: WatchCardProps) {
  const { search } = useLocation()
  const section = new URLSearchParams(search).get('section')
  const linkState = section === null ? undefined : { section }
  const { listing, variant } = listingVariantForCard(product, card)
  const shareText = shareMessage(product, listing, variant, window.location.origin)

  return (
    <Card className="h-full w-full gap-0 overflow-hidden rounded-none border-0 bg-background p-0 py-0 shadow-none ring-0 md:rounded-[12px] md:border-[1px] md:bg-card">
      <div data-testid="watch-card-row" className="flex w-full items-center gap-2 md:block">
        <Link to={card.path} state={linkState} className="contents">
          <div
            data-testid="watch-card-image"
            className="relative size-32 shrink-0 md:aspect-square md:size-auto md:w-full"
          >
            <img
              src={productImageSrc(product.slug, card.image)}
              alt={card.title}
              className="h-full w-full object-contain"
            />
            {card.unmissableOffer ? (
              <UnmissableOfferBadge className="absolute bottom-3 left-3 hidden md:inline-flex" />
            ) : null}
          </div>
        </Link>
        <div
          data-testid="watch-card-body"
          className="relative flex min-w-0 flex-1 flex-col items-start gap-1 text-left md:mt-3 md:w-full md:flex-none md:gap-2 md:px-[24px] md:pb-[24px]"
        >
          <div className="flex w-full items-end gap-2 md:gap-3">
            <Link
              to={card.path}
              state={linkState}
              data-testid="watch-card-link"
              className="flex min-w-0 flex-1 flex-col items-start gap-1 md:gap-2"
            >
              {card.unmissableOffer ? <UnmissableOfferBadge className="md:hidden" /> : null}
              <ProductConditionLine state={listing.state} availabilityStatus={listing.availabilityStatus} />
              <h2 className="m-0 line-clamp-2 w-full min-w-0 text-[13px] leading-snug font-medium text-foreground md:font-display md:text-base md:leading-snug md:font-semibold md:line-clamp-none">
                {card.title}
              </h2>
              <div className="flex w-full flex-col items-start gap-1 md:gap-2">
                <PriceBlock
                  price={card.price}
                  listPrice={card.listPrice}
                  showcase
                  unmissableOffer={card.unmissableOffer}
                />
              </div>
            </Link>
            <div data-testid="watch-card-mobile-action" className="shrink-0">
              <WantIconLink slug={product.slug} title={card.title} href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} />
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
