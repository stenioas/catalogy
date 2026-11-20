import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { runInstallPrompt } from '@/pwa/install-prompt'

import { useInstallChrome } from './install-notice'

const SAFARI_HELP =
  'No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início.'
const UNAVAILABLE_HELP = 'Este navegador não permite criar o atalho.'

export function InstallMenu() {
  const { standalone } = useInstallChrome()
  const [open, setOpen] = useState(false)
  const [help, setHelp] = useState<string | null>(null)

  if (standalone) return null

  const onInstall = async () => {
    setOpen(false)
    const result = await runInstallPrompt()
    if (result === 'ios') setHelp(SAFARI_HELP)
    else if (result === 'unavailable') setHelp(UNAVAILABLE_HELP)
    else setHelp(null)
  }

  return (
    <div className="relative flex flex-col items-start gap-2">
      <Button
        type="button"
        variant="ghost"
        aria-label="Menu"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="size-11 shrink-0 rounded-full text-inherit hover:bg-[color-mix(in_srgb,var(--ink)_8%,transparent)] hover:text-inherit"
      >
        Menu
      </Button>
      {open ? (
        <div
          role="menu"
          className="absolute top-full left-0 z-30 min-w-[14rem] rounded-lg border border-[rgba(0,0,0,0.08)] bg-[var(--canvas-parchment)] py-1 shadow-md"
        >
          <button
            type="button"
            role="menuitem"
            className="w-full px-3 py-2 text-left text-sm hover:bg-[color-mix(in_srgb,var(--ink)_8%,transparent)]"
            onClick={() => void onInstall()}
          >
            Adicionar à tela inicial
          </button>
        </div>
      ) : null}
      {help ? (
        <p
          data-testid="install-menu-help"
          className="absolute top-full left-0 z-30 mt-2 max-w-xs rounded-lg border border-[rgba(0,0,0,0.08)] bg-[var(--canvas-parchment)] px-3 py-2 text-sm shadow-md"
        >
          {help}
        </p>
      ) : null}
    </div>
  )
}