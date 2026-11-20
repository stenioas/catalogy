export const INSTALL_NOTICE_DISMISSED_KEY = 'achavio-install-notice-dismissed'

export type InstallPromptOutcome = 'accepted' | 'dismissed'

export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: InstallPromptOutcome }>
}

export type InstallRunResult = 'prompted' | 'ios' | 'unavailable'

let deferred: InstallPromptEvent | null = null

export function getDeferredInstallPrompt(): InstallPromptEvent | null {
  return deferred
}

export function captureInstallPrompt(event: InstallPromptEvent): void {
  event.preventDefault()
  deferred = event
}

export function mediaMatches(query: string): boolean {
  if (typeof window.matchMedia !== 'function') return false
  return window.matchMedia(query).matches
}

export function subscribeMedia(query: string, listener: () => void): () => void {
  if (typeof window.matchMedia !== 'function') return () => {}
  const media = window.matchMedia(query)
  media.addEventListener('change', listener)
  return () => media.removeEventListener('change', listener)
}

export function isPhoneWidth(): boolean {
  return mediaMatches('(max-width: 767px)')
}

export function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean }
  return mediaMatches('(display-mode: standalone)') || nav.standalone === true
}

export function isIos(): boolean {
  const ua = navigator.userAgent
  const iPadOs = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return /iPad|iPhone|iPod/.test(ua) || iPadOs
}

export function isInstallNoticeDismissed(): boolean {
  try {
    return localStorage.getItem(INSTALL_NOTICE_DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

const listeners = new Set<() => void>()

function emit(): void {
  for (const listener of listeners) listener()
}

export function subscribeInstallPrompt(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function dismissInstallNotice(): void {
  try {
    localStorage.setItem(INSTALL_NOTICE_DISMISSED_KEY, '1')
  } catch {
    // o aviso pode voltar na próxima visita
  }
  emit()
}

export async function runInstallPrompt(): Promise<InstallRunResult> {
  if (deferred) {
    const current = deferred
    deferred = null
    try {
      await current.prompt()
      const choice = await current.userChoice
      if (choice.outcome === 'accepted') dismissInstallNotice()
      return 'prompted'
    } catch {
      return 'unavailable'
    }
  }
  if (isIos() && !isStandalone()) return 'ios'
  return 'unavailable'
}

export function installInstallPromptListener(): () => void {
  const onPrompt = (event: Event) => {
    captureInstallPrompt(event as InstallPromptEvent)
  }
  const onInstalled = () => {
    deferred = null
    dismissInstallNotice()
  }
  window.addEventListener('beforeinstallprompt', onPrompt)
  window.addEventListener('appinstalled', onInstalled)
  return () => {
    window.removeEventListener('beforeinstallprompt', onPrompt)
    window.removeEventListener('appinstalled', onInstalled)
  }
}
