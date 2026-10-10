import { ChevronLeft } from 'lucide-react'
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

export function TopBar({ catalogHref }: TopBarProps) {
  return (
    <header
      data-testid="top-bar"
      className="sticky top-0 z-20 h-11 w-full text-[var(--on-primary)]"
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
            <Button asChild variant="ghost" className="size-11 shrink-0 text-inherit">
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
  )
}
