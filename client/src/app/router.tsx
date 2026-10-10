import { useLayoutEffect } from 'react'
import {
  createBrowserRouter,
  Outlet,
  useLocation,
  useNavigationType,
  useParams,
  type RouteObject,
} from 'react-router-dom'

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

function ScrollToTop() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()

  useLayoutEffect(() => {
    if (navigationType === 'POP') return
    window.scrollTo(0, 0)
  }, [pathname, navigationType])

  return null
}

function AppShell() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  )
}

export function createAppRouter() {
  return createBrowserRouter([
    {
      element: <AppShell />,
      children: appRoutes,
    },
  ])
}

export const router = createAppRouter()
