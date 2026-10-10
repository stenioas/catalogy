import { Link } from 'react-router-dom'

import { ThemeToggle } from '../theme-provider'

export const TOP_BAR_TITLE = 'Catálogo'

export type TopBarProps = {
  catalogHref?: string
}

const titleClassName =
  'm-0 min-w-0 truncate font-[family-name:var(--font-sans)] text-xs font-normal tracking-[-0.12px] text-inherit'

function BackIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path
        d="M15 6 L9 12 L15 18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function TopBar({ catalogHref }: TopBarProps) {
  return (
    <header data-testid="top-bar" className="w-full bg-[var(--surface-black)] text-[var(--on-primary)]">
      <div
        data-testid="top-bar-inner"
        className="catalog-column flex items-center justify-between gap-4 py-2.5"
      >
        <div className="flex min-w-0 items-center gap-1">
          {catalogHref ? (
            <Link
              to={catalogHref}
              aria-label="Voltar"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-inherit"
            >
              <BackIcon />
            </Link>
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
