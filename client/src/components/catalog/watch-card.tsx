import type { Product } from '@catalogo/shared'
import { Link } from 'react-router-dom'

import { Card } from '@/components/ui/card'

import { PriceBlock } from './price-block'
import { ProductAvailabilityBadge, ProductStateBadge, UnmissableOfferBadge } from './product-badges'
import { WantIconLink } from './want-link'

export type WatchCardProps = {
  product: Product
}

export function productImageSrc(slug: string, fileName: string): string {
  return `/catalog/products/${slug}/img/${fileName}`
}

export function WatchCard({ product }: WatchCardProps) {
  const firstImage = product.images[0]
  const watchPath = `/product/${product.slug}`

  return (
    <Card className="gap-0 overflow-hidden rounded-none border-0 bg-background p-0 py-0 shadow-none ring-0 md:rounded-[12px] md:border-[1px] md:bg-card">
      <div data-testid="watch-card-row" className="flex w-full items-center gap-2 md:block">
        <Link to={watchPath} className="contents">
          <div
            data-testid="watch-card-image"
            className="relative size-32 shrink-0 md:aspect-square md:size-auto md:w-full"
          >
            <img
              src={productImageSrc(product.slug, firstImage)}
              alt={product.title}
              className="h-full w-full object-contain"
            />
            <ProductStateBadge
              state={product.state}
              className="absolute right-3 bottom-3 hidden md:block"
            />
            {product.unmissableOffer ? (
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
              to={watchPath}
              data-testid="watch-card-link"
              className="flex min-w-0 flex-1 flex-col items-start gap-1 md:gap-2"
            >
              {product.unmissableOffer ? (
                <UnmissableOfferBadge className="md:hidden" />
              ) : null}
              <h2 className="m-0 line-clamp-2 w-full min-w-0 text-[13px] leading-snug font-medium text-foreground md:font-display md:text-xl md:leading-normal md:font-semibold md:line-clamp-none">
                {product.title}
              </h2>
              <div className="flex w-full flex-col items-start gap-1 md:gap-2">
                <PriceBlock
                  price={product.price}
                  listPrice={product.listPrice}
                  showcase
                />
                <div className="flex flex-wrap items-center gap-1">
                  <ProductStateBadge state={product.state} compact className="md:hidden" />
                  <ProductAvailabilityBadge
                    availabilityStatus={product.availabilityStatus}
                    compact
                  />
                </div>
              </div>
            </Link>
            <div data-testid="watch-card-mobile-action" className="shrink-0">
              <WantIconLink slug={product.slug} title={product.title} />
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
