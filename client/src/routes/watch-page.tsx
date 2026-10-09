import type { Product, Seller } from '@catalogo/shared'

import { products } from '../catalog/products.generated'
import { Carousel } from '../components/catalog/carousel'
import { PriceBlock } from '../components/catalog/price-block'
import { TopBar } from '../components/catalog/top-bar'
import { WantLink } from '../components/catalog/want-link'
import { productImageSrc } from '../components/catalog/watch-card'

export const MISSING_WATCH_MESSAGE = 'Este relógio não está no catálogo.'

export type WatchPageProps = {
  seller: Seller
  slug: string
}

function hasText(value: string | undefined): value is string {
  return value !== undefined && value !== ''
}

function WatchColumn({ product, phone }: { product: Product; phone: string }) {
  const specifications = product.specifications ?? []

  return (
    <>
      <Carousel
        images={product.images.map((file) => productImageSrc(product.slug, file))}
        alt={product.title}
      />
      <h1 className="m-0 font-display text-xl font-semibold text-ink">{product.title}</h1>
      <PriceBlock price={product.price} listPrice={product.listPrice} />
      <WantLink phone={phone} title={product.title} />
      {hasText(product.details) ? (
        <section>
          <h2 className="m-0 font-display text-lg font-semibold text-ink">Detalhes</h2>
          <p className="m-0 text-[var(--ink-primary)]">{product.details}</p>
        </section>
      ) : null}
      {specifications.length > 0 ? (
        <section>
          <h2 className="m-0 font-display text-lg font-semibold text-ink">Especificações</h2>
          <table className="w-full text-left">
            <tbody>
              {specifications.map((row) => (
                <tr key={`${row.label}:${row.value}`}>
                  <td>{row.label}</td>
                  <td>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
      {hasText(product.observations) ? (
        <section>
          <h2 className="m-0 font-display text-lg font-semibold text-ink">Observações</h2>
          <p className="m-0 text-[var(--ink-primary)]">{product.observations}</p>
        </section>
      ) : null}
    </>
  )
}

export function WatchPage({ seller, slug }: WatchPageProps) {
  const product = products.find((item) => item.slug === slug) ?? null
  const catalogHref = `/?seller=${seller.slug}`

  return (
    <>
      <TopBar sellerName={seller.name} catalogHref={catalogHref} />
      <div data-testid="watch-page-column" className="catalog-column flex flex-col items-start gap-4 py-8 text-left">
        {product ? (
          <WatchColumn product={product} phone={seller.phone} />
        ) : (
          <p className="m-0 text-[var(--ink-primary)]">{MISSING_WATCH_MESSAGE}</p>
        )}
      </div>
    </>
  )
}
