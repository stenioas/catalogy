import { Menu } from 'lucide-react'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { runInstallPrompt } from '@/pwa/install-prompt'

import { useInstallChrome } from './install-notice'

const SAFARI_HELP =
  'No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início.'
const UNAVAILABLE_HELP = 'Este navegador não permite criar o atalho.'
const INSTALL_TOAST_ID = 'install-help'

export function InstallMenu() {
  const { standalone } = useInstallChrome()

  useEffect(() => {
    const dismiss = (event: Event) => {
      const target = event.target
      if (target instanceof Element && target.closest('[data-sonner-toaster]')) return
      toast.dismiss(INSTALL_TOAST_ID)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') toast.dismiss(INSTALL_TOAST_ID)
    }
    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  if (standalone) return null

  const onInstall = async () => {
    const result = await runInstallPrompt()
    if (result === 'ios') toast(SAFARI_HELP, { id: INSTALL_TOAST_ID })
    else if (result === 'unavailable') toast(UNAVAILABLE_HELP, { id: INSTALL_TOAST_ID })
    else toast.dismiss(INSTALL_TOAST_ID)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          aria-label="Menu"
          className="size-11 shrink-0 rounded-full text-inherit hover:bg-[color-mix(in_srgb,var(--ink)_8%,transparent)] hover:text-inherit"
        >
          <Menu aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem onSelect={() => void onInstall()}>
          Adicionar à tela inicial
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
