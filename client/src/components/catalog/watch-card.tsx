import type { Product } from '@catalogo/shared'
import { Link } from 'react-router-dom'

import { PriceBlock } from './price-block'
import { WantLink } from './want-link'

export type WatchCardProps = {
  product: Product
  phone: string
  sellerSlug: string
}

export function productImageSrc(slug: string, fileName: string): string {
  return `/catalog/products/${slug}/img/${fileName}`
}

export function WatchCard({ product, phone, sellerSlug }: WatchCardProps) {
  const firstImage = product.images[0]
  const watchPath = `/relogio/${product.slug}?seller=${encodeURIComponent(sellerSlug)}`

  return (
    <article className="flex flex-col text-left">
      <Link to={watchPath} data-testid="watch-card-link" className="block text-left">
        <div className="aspect-square w-full">
          <img
            src={productImageSrc(product.slug, firstImage)}
            alt={product.title}
            className="h-full w-full object-contain"
          />
        </div>
        <div data-testid="watch-card-body" className="mt-3 flex flex-col items-start gap-2 text-left">
          <h2 className="m-0 font-display text-xl font-semibold text-ink">{product.title}</h2>
          <PriceBlock price={product.price} listPrice={product.listPrice} />
        </div>
      </Link>
      <div className="mt-2">
        <WantLink phone={phone} title={product.title} />
      </div>
    </article>
  )
}
