import {
  createBrowserRouter,
  useLoaderData,
  type LoaderFunctionArgs,
  type RouteObject,
} from 'react-router-dom'

import { CatalogPage } from '../routes/catalog-page'
import { SellerGate } from '../routes/seller-gate'
import { WatchPage } from '../routes/watch-page'

export type CatalogLoaderData = {
  seller: string | null
}

export type WatchLoaderData = {
  seller: string | null
  slug: string
}

function sellerFromRequest(request: Request): string | null {
  return new URL(request.url).searchParams.get('seller')
}

export async function catalogLoader({
  request,
}: LoaderFunctionArgs): Promise<CatalogLoaderData> {
  return { seller: sellerFromRequest(request) }
}

export async function watchLoader({
  request,
  params,
}: LoaderFunctionArgs): Promise<WatchLoaderData> {
  return {
    seller: sellerFromRequest(request),
    slug: params.slug ?? '',
  }
}

function CatalogRoute() {
  const { seller } = useLoaderData() as CatalogLoaderData
  return (
    <SellerGate sellerQuery={seller}>
      {(resolved) => <CatalogPage seller={resolved} />}
    </SellerGate>
  )
}

function WatchRoute() {
  const { seller, slug } = useLoaderData() as WatchLoaderData
  return (
    <SellerGate sellerQuery={seller}>
      {(resolved) => <WatchPage seller={resolved} slug={slug} />}
    </SellerGate>
  )
}

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    loader: catalogLoader,
    element: <CatalogRoute />,
  },
  {
    path: '/relogio/:slug',
    loader: watchLoader,
    element: <WatchRoute />,
  },
]

export function createAppRouter() {
  return createBrowserRouter(appRoutes)
}

export const router = createAppRouter()
