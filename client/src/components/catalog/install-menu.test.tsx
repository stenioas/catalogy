import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  captureInstallPrompt,
  installInstallPromptListener,
  type InstallPromptEvent,
} from '@/pwa/install-prompt'

import { InstallMenu } from './install-menu'

const SAFARI_HELP =
  'No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início.'
const UNAVAILABLE_HELP = 'Este navegador não permite criar o atalho.'

function mockMedia(matches: (query: string) => boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: matches(query),
      media: query,
      addEventListener() {},
      removeEventListener() {},
    })),
  )
}

function promptEvent(
  outcome: 'accepted' | 'dismissed',
  promptImpl?: () => Promise<void>,
): InstallPromptEvent {
  const event = new Event('beforeinstallprompt') as InstallPromptEvent
  event.prompt = vi.fn(promptImpl ?? (async () => {}))
  event.userChoice = Promise.resolve({ outcome })
  return event
}

let uninstall = () => {}

afterEach(() => {
  cleanup()
  uninstall()
  uninstall = () => {}
  localStorage.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  Reflect.deleteProperty(navigator, 'standalone')
})

describe('InstallMenu', () => {
  it('abre um único item Adicionar à tela inicial ao acionar Menu', () => {
    mockMedia(() => false)
    uninstall = installInstallPromptListener()
    render(<InstallMenu />)
    expect(screen.queryByRole('menuitem', { name: 'Adicionar à tela inicial' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))
    expect(screen.getByRole('menuitem', { name: 'Adicionar à tela inicial' })).toBeDefined()
    expect(screen.getAllByRole('menuitem')).toHaveLength(1)
  })

  it('chama prompt e fecha o menu com evento adiado', async () => {
    mockMedia(() => false)
    uninstall = installInstallPromptListener()
    const event = promptEvent('dismissed')
    captureInstallPrompt(event)
    render(<InstallMenu />)
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Adicionar à tela inicial' }))
    await waitFor(() => expect(event.prompt).toHaveBeenCalledOnce())
    expect(screen.queryByRole('menuitem', { name: 'Adicionar à tela inicial' })).toBeNull()
  })

  it('mostra a instrução do Safari no iPhone sem evento adiado', async () => {
    mockMedia(() => false)
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    )
    uninstall = installInstallPromptListener()
    render(<InstallMenu />)
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Adicionar à tela inicial' }))
    await waitFor(() => expect(screen.getByText(SAFARI_HELP)).toBeDefined())
  })

  it('mostra o texto sem atalho fora do iOS sem evento ou quando prompt rejeita', async () => {
    mockMedia(() => false)
    uninstall = installInstallPromptListener()
    render(<InstallMenu />)
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Adicionar à tela inicial' }))
    await waitFor(() => expect(screen.getByText(UNAVAILABLE_HELP)).toBeDefined())

    cleanup()
    const rejectEvent = promptEvent('dismissed', async () => {
      throw new Error('prompt failed')
    })
    captureInstallPrompt(rejectEvent)
    render(<InstallMenu />)
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Adicionar à tela inicial' }))
    await waitFor(() => expect(screen.getByText(UNAVAILABLE_HELP)).toBeDefined())
  })

  it('não renderiza o botão Menu em standalone', () => {
    mockMedia((query) => query === '(display-mode: standalone)')
    uninstall = installInstallPromptListener()
    render(<InstallMenu />)
    expect(screen.queryByRole('button', { name: 'Menu' })).toBeNull()
  })
})