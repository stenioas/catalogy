import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { INSTALL_NOTICE_DISMISSED_KEY } from '@/pwa/install-prompt'

import { InstallNotice } from './install-notice'

const NOTICE =
  'Adicione o Achavio à tela inicial para ver o catálogo sem a barra do navegador. Use o menu.'

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

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
  Reflect.deleteProperty(navigator, 'standalone')
})

describe('InstallNotice', () => {
  it('mostra o texto e o botão Dispensar abaixo de 768px', () => {
    mockMedia((query) => query === '(max-width: 767px)')
    render(<InstallNotice />)
    expect(screen.getByText(NOTICE)).toBeDefined()
    expect(screen.getByRole('button', { name: 'Dispensar' })).toBeDefined()
  })

  it('grava a chave e esconde o aviso ao dispensar', () => {
    mockMedia((query) => query === '(max-width: 767px)')
    const view = render(<InstallNotice />)
    fireEvent.click(screen.getByRole('button', { name: 'Dispensar' }))
    expect(localStorage.getItem(INSTALL_NOTICE_DISMISSED_KEY)).toBe('1')
    expect(screen.queryByTestId('install-notice')).toBeNull()
    view.unmount()
    render(<InstallNotice />)
    expect(screen.queryByTestId('install-notice')).toBeNull()
  })

  it('não mostra o aviso a partir de 768px', () => {
    mockMedia(() => false)
    render(<InstallNotice />)
    expect(screen.queryByTestId('install-notice')).toBeNull()
  })

  it('não mostra o aviso em display-mode standalone', () => {
    mockMedia(
      (query) =>
        query === '(max-width: 767px)' || query === '(display-mode: standalone)',
    )
    render(<InstallNotice />)
    expect(screen.queryByTestId('install-notice')).toBeNull()
  })

  it('não mostra o aviso quando o Safari já abriu pelo atalho', () => {
    Object.defineProperty(navigator, 'standalone', { configurable: true, value: true })
    mockMedia((query) => query === '(max-width: 767px)')
    render(<InstallNotice />)
    expect(screen.queryByTestId('install-notice')).toBeNull()
  })
})
