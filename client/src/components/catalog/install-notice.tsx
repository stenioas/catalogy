import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

import {
  dismissInstallNotice,
  isInstallNoticeDismissed,
  isPhoneWidth,
  isStandalone,
  subscribeInstallPrompt,
  subscribeMedia,
} from '@/pwa/install-prompt'

export function useInstallChrome() {
  const [, bump] = useState(0)

  useEffect(() => {
    const unsubscribe = subscribeInstallPrompt(() => bump((value) => value + 1))
    const stopPhone = subscribeMedia('(max-width: 767px)', () => bump((value) => value + 1))
    const stopStandalone = subscribeMedia('(display-mode: standalone)', () =>
      bump((value) => value + 1),
    )
    return () => {
      unsubscribe()
      stopPhone()
      stopStandalone()
    }
  }, [])

  const standalone = isStandalone()
  return {
    standalone,
    showNotice: !standalone && isPhoneWidth() && !isInstallNoticeDismissed(),
  }
}

export function InstallNotice() {
  const { showNotice } = useInstallChrome()
  if (!showNotice) return null

  return (
    <div
      data-testid="install-notice"
      className="border-b border-[rgba(0,0,0,0.08)] bg-[var(--canvas-parchment)] text-[var(--ink)]"
    >
      <div className="catalog-column flex items-start gap-3 py-3 text-sm">
        <p className="m-0 min-w-0 flex-1">
          Adicione o Achavio à tela inicial para ver o catálogo sem a barra do navegador. Use o menu.
        </p>
        <button
          type="button"
          aria-label="Dispensar"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-[color-mix(in_srgb,var(--ink)_8%,transparent)]"
          onClick={dismissInstallNotice}
        >
          <X aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
