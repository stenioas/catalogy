import {
  createBrowserRouter,
  type LoaderFunctionArgs,
  type RouteObject,
} from 'react-router-dom'

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
  return <div data-testid="catalog-route" />
}

function WatchRoute() {
  return <div data-testid="watch-route" />
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
