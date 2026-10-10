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
        className="catalog-column flex h-full items-center justify-between gap-4"
      >
        <div className="flex min-w-0 items-center gap-1">
          {catalogHref ? (
            <Button asChild variant="ghost" className="size-11 shrink-0 text-inherit">
              <Link to={catalogHref} aria-label="Voltar">
                <ChevronLeft aria-hidden="true" />
              </Link>
            </Button>
          ) : null}
          {catalogHref ? (
            <Link to={catalogHref} className={titleClassName}>
              {TOP_BAR_TITLE}
            </Link>
          ) : (
            <p className={titleClassName}>{TOP_BAR_TITLE}</p>
          )}
        </div>
        <ThemeToggle />
      </div>
    </header>
  )
}
