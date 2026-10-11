import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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
import { Spinner } from '../components/ui/spinner'

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

function RouteContent({ delay }: { delay: boolean }) {
  const [ready, setReady] = useState(!delay)

  useEffect(() => {
    if (!delay) return
    const timer = window.setTimeout(() => setReady(true), 1000)
    return () => window.clearTimeout(timer)
  }, [delay])

  if (!ready) {
    return (
      <div
        data-testid="route-loading"
        className="fixed inset-0 z-40 flex items-center justify-center bg-background"
      >
        <Spinner aria-label="Carregando" className="size-8 text-primary" />
      </div>
    )
  }

  return <Outlet />
}

export function AppShell() {
  const location = useLocation()
  const initialKey = useRef(location.key)
  const [hasNavigated, setHasNavigated] = useState(false)

  useEffect(() => {
    if (location.key !== initialKey.current) setHasNavigated(true)
  }, [location.key])

  const delay = hasNavigated || location.pathname.startsWith('/product/') || location.key !== initialKey.current

  return (
    <>
      <ScrollToTop />
      <RouteContent key={location.key} delay={delay} />
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
