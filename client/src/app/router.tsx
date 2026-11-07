import { useLayoutEffect } from 'react'
import {
  createBrowserRouter,
  Outlet,
  useLocation,
  useNavigation,
  useNavigationType,
  useParams,
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

function WatchListingRoute() {
  const { slug, listingId } = useParams()
  return <WatchPage slug={slug ?? ''} listingId={listingId ?? ''} />
}

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <CatalogPage />,
  },
  {
    path: '/product/:slug/:listingId',
    element: <WatchListingRoute />,
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

const routeEnterClass =
  'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200'

export function AppShell() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const navigation = useNavigation()
  const loading = navigation.state === 'loading'

  return (
    <div className="group/route">
      <ScrollToTop pathname={location.pathname} navigationType={navigationType} />
      <div key={location.pathname} aria-busy={loading} data-testid="route-stage" className={routeEnterClass}>
        <Outlet />
      </div>
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
