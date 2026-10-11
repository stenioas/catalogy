import { useEffect, useLayoutEffect, useState } from 'react'
import {
  createBrowserRouter,
  useLocation,
  useNavigationType,
  useParams,
  useRoutes,
  type NavigationType,
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

function ScrollToTop({ pathname, navigationType }: { pathname: string; navigationType: NavigationType }) {
  useLayoutEffect(() => {
    if (navigationType === 'POP') return
    window.scrollTo(0, 0)
  }, [pathname, navigationType])

  return null
}

export function AppShell() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const [displayed, setDisplayed] = useState({ location, navigationType })
  const [initialReady, setInitialReady] = useState(!location.pathname.startsWith('/product/'))
  const loading = !initialReady || location !== displayed.location
  const page = useRoutes(appRoutes, displayed.location)

  useEffect(() => {
    if (!loading) return
    const timer = window.setTimeout(() => {
      setDisplayed({ location, navigationType })
      setInitialReady(true)
    }, 500)
    return () => window.clearTimeout(timer)
  }, [location, navigationType, loading])

  return (
    <div className="group/route">
      <ScrollToTop pathname={displayed.location.pathname} navigationType={displayed.navigationType} />
      <div aria-busy={loading}>{page}</div>
      {loading ? (
        <div
          data-testid="route-loading"
          className="fixed inset-x-0 top-16 bottom-0 z-10 flex items-center justify-center bg-background/30 backdrop-blur-sm group-has-[header[inert]]/route:top-0"
        >
          <Spinner aria-label="Carregando" className="size-8 text-primary" />
        </div>
      ) : null}
    </div>
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
