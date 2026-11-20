import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

import { router } from './app/router'
import { ThemeProvider } from './components/theme-provider'
import { installInstallPromptListener } from './pwa/install-prompt'
import './index.css'

installInstallPromptListener()

if ('serviceWorker' in navigator) {
  try {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  } catch {
    // lançamento síncrono não derruba a vitrine
  }
}

export function AppRoot() {
  return (
    <StrictMode>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </StrictMode>
  )
}

const rootEl = document.getElementById('root')
if (rootEl) {
  createRoot(rootEl).render(<AppRoot />)
}
