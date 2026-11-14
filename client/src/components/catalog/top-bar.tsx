import { ArrowLeft } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export const TOP_BAR_LOGO_ALT = 'Achavio'
export const TOP_BAR_LOGO_SRC = '/achavio_logo.webp'

export type TopBarProps = {
  catalogHref?: string
}

const logoSlotClassName = 'm-0 flex min-w-0 items-center justify-self-center'

const logo = (
  <img
    src={TOP_BAR_LOGO_SRC}
    alt={TOP_BAR_LOGO_ALT}
    width={136}
    height={20}
    className="block h-5 w-auto max-w-full"
  />
)

const SCROLL_DELTA = 8

function useHideOnScrollDown() {
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    lastY.current = window.scrollY

    const onScroll = () => {
      const y = window.scrollY
      const delta = y - lastY.current
      if (y < 64) {
        setHidden(false)
      } else if (delta > SCROLL_DELTA) {
        setHidden(true)
      } else if (delta < -SCROLL_DELTA) {
        setHidden(false)
      }
      lastY.current = y
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return hidden
}

export function TopBar({ catalogHref }: TopBarProps) {
  const hidden = useHideOnScrollDown()

  return (
    <>
      <div aria-hidden="true" className="h-16 w-full" data-testid="top-bar-spacer" />
      <header
        data-testid="top-bar"
        inert={hidden}
        className={`fixed inset-x-0 top-0 z-20 h-16 w-full border-b border-[rgba(0,0,0,0.08)] bg-[color-mix(in_srgb,var(--canvas-parchment)_80%,transparent)] text-[var(--ink)] [-webkit-backdrop-filter:saturate(180%)_blur(20px)] [backdrop-filter:saturate(180%)_blur(20px)] motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out ${hidden ? '-translate-y-full' : 'translate-y-0'}`}
      >
        <div
          data-testid="top-bar-inner"
          className={`catalog-column grid h-full grid-cols-[1fr_auto_1fr] items-center${catalogHref ? ' watch-page-column' : ''}`}
        >
          <div className="justify-self-start">
            {catalogHref ? (
              <Button
                asChild
                variant="ghost"
                className="size-11 shrink-0 rounded-full text-inherit hover:bg-[color-mix(in_srgb,var(--ink)_8%,transparent)] hover:text-inherit"
              >
                <Link to={catalogHref} aria-label="Voltar">
                  <ArrowLeft aria-hidden="true" />
                </Link>
              </Button>
            ) : null}
          </div>
          {catalogHref ? (
            <Link to={catalogHref} className={logoSlotClassName}>
              {logo}
            </Link>
          ) : (
            <p className={logoSlotClassName}>{logo}</p>
          )}
          <div className="justify-self-end" />
        </div>
      </header>
    </>
  )
}
