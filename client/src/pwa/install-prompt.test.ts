import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterEach, describe, expect, it, vi } from 'vitest'

import type { InstallPromptEvent } from './install-prompt'

const sourcePath = join(dirname(fileURLToPath(import.meta.url)), 'install-prompt.ts')

let uninstall = () => {}

async function load() {
  vi.resetModules()
  return import('./install-prompt')
}

function promptEvent(outcome: 'accepted' | 'dismissed'): InstallPromptEvent {
  const event = new Event('beforeinstallprompt') as InstallPromptEvent
  event.prompt = vi.fn(async () => {})
  event.userChoice = Promise.resolve({ outcome })
  return event
}

afterEach(() => {
  uninstall()
  uninstall = () => {}
  localStorage.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  Reflect.deleteProperty(navigator, 'maxTouchPoints')
})

describe('install prompt', () => {
  it('adia o beforeinstallprompt e impede o banner automático do navegador', async () => {
    const mod = await load()
    uninstall = mod.installInstallPromptListener()
    const event = promptEvent('dismissed')
    const preventDefault = vi.spyOn(event, 'preventDefault')
    window.dispatchEvent(event)
    expect(preventDefault).toHaveBeenCalledOnce()
    expect(mod.getDeferredInstallPrompt()).toBe(event)
  })

  it('grava o aviso como dispensado quando a instalação é aceita', async () => {
    const mod = await load()
    uninstall = mod.installInstallPromptListener()
    window.dispatchEvent(promptEvent('accepted'))
    expect(await mod.runInstallPrompt()).toBe('prompted')
    expect(localStorage.getItem(mod.INSTALL_NOTICE_DISMISSED_KEY)).toBe('1')
    expect(mod.getDeferredInstallPrompt()).toBeNull()
  })

  it('não grava a chave quando a pessoa recusa o diálogo nativo', async () => {
    const mod = await load()
    uninstall = mod.installInstallPromptListener()
    window.dispatchEvent(promptEvent('dismissed'))
    expect(await mod.runInstallPrompt()).toBe('prompted')
    expect(localStorage.getItem(mod.INSTALL_NOTICE_DISMISSED_KEY)).toBeNull()
    expect(mod.getDeferredInstallPrompt()).toBeNull()
  })

  it('dispensa o aviso no appinstalled', async () => {
    const mod = await load()
    uninstall = mod.installInstallPromptListener()
    window.dispatchEvent(promptEvent('dismissed'))
    window.dispatchEvent(new Event('appinstalled'))
    expect(localStorage.getItem(mod.INSTALL_NOTICE_DISMISSED_KEY)).toBe('1')
    expect(mod.getDeferredInstallPrompt()).toBeNull()
  })

  it('pede a instrução do Safari no iPhone quando não há evento', async () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    )
    const mod = await load()
    expect(mod.isIos()).toBe(true)
    expect(await mod.runInstallPrompt()).toBe('ios')
  })

  it('trata iPadOS que se anuncia como Mac como iPhone', async () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    )
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('MacIntel')
    Object.defineProperty(navigator, 'maxTouchPoints', {
      configurable: true,
      value: 5,
    })
    const mod = await load()
    expect(mod.isIos()).toBe(true)
  })

  it('informa que o navegador não cria o atalho fora do iPhone e sem evento', async () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    )
    const mod = await load()
    expect(await mod.runInstallPrompt()).toBe('unavailable')
  })

  it('trata falha de leitura do localStorage como aviso ainda visível', async () => {
    const mod = await load()
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(mod.isInstallNoticeDismissed()).toBe(false)
  })

  it('não propaga falha ao gravar a dispensa', async () => {
    const mod = await load()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => mod.dismissInstallNotice()).not.toThrow()
  })

  it('grava a chave fixa 1 sem identificador de build', async () => {
    const source = readFileSync(sourcePath, 'utf8')
    expect(source).not.toMatch(/buildId|BUILD_ID|__BUILD/)
    const mod = await load()
    mod.dismissInstallNotice()
    expect(localStorage.getItem('achavio-install-notice-dismissed')).toBe('1')
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        addEventListener() {},
        removeEventListener() {},
      })),
    )
    const standalone = await load()
    expect(standalone.isStandalone()).toBe(true)
    expect(standalone.isPhoneWidth()).toBe(false)
  })
})
