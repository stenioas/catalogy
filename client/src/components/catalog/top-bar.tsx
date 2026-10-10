import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

import { ThemeToggle } from '../theme-provider'

export const TOP_BAR_TITLE = 'Catálogo'

export type TopBarProps = {
  catalogHref?: string
}

const titleClassName =
  'm-0 min-w-0 truncate font-[family-name:var(--font-sans)] text-xs font-normal tracking-[-0.12px] text-inherit'

export function TopBar({ catalogHref }: TopBarProps) {
  return (
    <header
      data-testid="top-bar"
      className="h-11 w-full bg-[var(--surface-black)] text-[var(--on-primary)]"
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
        <div className="justify-self-end">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
