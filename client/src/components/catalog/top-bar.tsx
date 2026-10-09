import { ThemeToggle } from '../theme-provider'

export type TopBarProps = {
  sellerName: string
}

export function TopBar({ sellerName }: TopBarProps) {
  return (
    <header data-testid="top-bar" className="w-full bg-[var(--surface-black)] text-[var(--on-primary)]">
      <div
        data-testid="top-bar-inner"
        className="catalog-column flex items-center justify-between gap-4 py-2.5"
      >
        <p className="m-0 min-w-0 truncate font-[family-name:var(--font-sans)] text-xs font-normal tracking-[-0.12px]">
          Catálogo {sellerName}
        </p>
        <ThemeToggle />
      </div>
    </header>
  )
}
