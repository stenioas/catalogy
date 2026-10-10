import { createBrowserRouter, useParams, type RouteObject } from 'react-router-dom'

import { CatalogPage } from '../routes/catalog-page'
import { WatchPage } from '../routes/watch-page'

function WatchRoute() {
  const { slug } = useParams()
  return <WatchPage slug={slug ?? ''} />
}

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <CatalogPage />,
  },
  {
    path: '/product/:slug',
    element: <WatchRoute />,
  },
]

export function createAppRouter() {
  return createBrowserRouter(appRoutes)
}

export const router = createAppRouter()
