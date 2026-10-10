import type { Product } from '@catalogo/shared'
import { Link } from 'react-router-dom'

import { Card } from '@/components/ui/card'

import { PriceBlock } from './price-block'
import { WantLink } from './want-link'

export type WatchCardProps = {
  product: Product
}

export function productImageSrc(slug: string, fileName: string): string {
  return `/catalog/products/${slug}/img/${fileName}`
}

export function WatchCard({ product }: WatchCardProps) {
  const firstImage = product.images[0]
  const watchPath = `/relogio/${product.slug}`

  return (
    <Card className="gap-0 overflow-hidden rounded-[18px] border-[1px] bg-card p-0 py-0 shadow-none ring-0">
      <Link to={watchPath} data-testid="watch-card-link" className="block text-left">
        <div className="aspect-square w-full">
          <img
            src={productImageSrc(product.slug, firstImage)}
            alt={product.title}
            className="h-full w-full object-contain"
          />
        </div>
        <div
          data-testid="watch-card-body"
          className="mt-3 flex flex-col items-start gap-2 px-[24px] text-left"
        >
          <h2 className="m-0 font-display text-xl font-semibold text-foreground">
            {product.title}
          </h2>
          <PriceBlock price={product.price} listPrice={product.listPrice} />
        </div>
      </Link>
      <div data-testid="watch-card-actions" className="px-[24px] pb-[24px]">
        <div className="mt-2">
          <WantLink slug={product.slug} title={product.title} />
        </div>
      </div>
    </Card>
  )
}
