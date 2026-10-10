import { ChevronLeft } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export const TOP_BAR_TITLE = 'Catálogo de Produtos'

export type TopBarProps = {
  catalogHref?: string
}

const titleClassName =
  'm-0 min-w-0 truncate font-[family-name:var(--font-sans)] text-base font-normal tracking-[-0.12px] text-inherit'

const frostedBarStyle =
  'background-color: color-mix(in srgb, var(--surface-black) 80%, transparent); -webkit-backdrop-filter: saturate(180%) blur(20px); backdrop-filter: saturate(180%) blur(20px);'

const SCROLL_DELTA = 8

function useHideOnScrollDown() {
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    lastY.current = window.scrollY

    const onScroll = () => {
      const y = window.scrollY
      const delta = y - lastY.current
      if (y < 48) {
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
      <div aria-hidden="true" className="h-11 w-full" data-testid="top-bar-spacer" />
      <header
        data-testid="top-bar"
        inert={hidden}
        className={`fixed inset-x-0 top-0 z-20 h-11 w-full text-[var(--on-primary)] motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out ${hidden ? '-translate-y-full' : 'translate-y-0'}`}
        ref={(node) => {
          node?.setAttribute('style', frostedBarStyle)
        }}
      >
        <div
          data-testid="top-bar-inner"
          className="catalog-column grid h-full grid-cols-[1fr_auto_1fr] items-center"
        >
          <div className="justify-self-start">
            {catalogHref ? (
              <Button
                asChild
                variant="ghost"
                className="size-11 shrink-0 rounded-full text-inherit hover:bg-[#3a3a3c] hover:text-inherit"
              >
                <Link to={catalogHref} aria-label="Voltar">
                  <ChevronLeft aria-hidden="true" />
                </Link>
              </Button>
            ) : null}
          </div>
          {catalogHref ? (
            <Link to={catalogHref} className={`${titleClassName} justify-self-center text-center`}>
              {TOP_BAR_TITLE}
            </Link>
          ) : (
            <p className={`${titleClassName} justify-self-center text-center`}>{TOP_BAR_TITLE}</p>
          )}
          <div className="justify-self-end" />
        </div>
      </header>
    </>
  )
}
