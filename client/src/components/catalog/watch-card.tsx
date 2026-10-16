import type { Product } from '@catalogo/shared'
import { Link } from 'react-router-dom'

import { Card } from '@/components/ui/card'

import { PriceBlock } from './price-block'
import { ProductAvailabilityBadge, ProductStateBadge } from './product-badges'
import { WantIconLink, WantLink } from './want-link'

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
    <Card className="gap-0 overflow-hidden rounded-[12px] border-0 bg-card p-0 py-0 shadow-none ring-0 md:border-[1px]">
      <div className="relative">
        <Link
          to={watchPath}
          data-testid="watch-card-link"
          className="flex w-full items-start gap-3 text-left md:block"
        >
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
          </div>
          <div
            data-testid="watch-card-body"
            className="flex min-w-0 flex-1 flex-col items-start gap-2 text-left md:mt-3 md:w-full md:flex-none md:px-[24px]"
          >
            <ProductStateBadge state={product.state} className="md:hidden" />
            <h2 className="m-0 line-clamp-2 w-full min-w-0 font-display text-xl font-semibold text-foreground md:line-clamp-none">
              {product.title}
            </h2>
            <div className="flex w-full flex-col items-start gap-2">
              <PriceBlock
                price={product.price}
                listPrice={product.listPrice}
                wrapListPriceOnMobile
              />
              <ProductAvailabilityBadge
                availabilityStatus={product.availabilityStatus}
                className="text-xs"
              />
            </div>
          </div>
        </Link>
        <div data-testid="watch-card-mobile-action" className="absolute top-0 left-0 z-10 flex w-32 justify-end md:hidden">
          <WantIconLink slug={product.slug} title={product.title} />
        </div>
      </div>
      <div data-testid="watch-card-actions" className="hidden px-[24px] pb-[24px] md:block">
        <div className="mt-2">
          <WantLink slug={product.slug} title={product.title} />
        </div>
      </div>
    </Card>
  )
}
