import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

import { router } from './app/router'
import './index.css'

export function AppRoot() {
  return (
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  )
}

const rootEl = document.getElementById('root')
if (rootEl) {
  createRoot(rootEl).render(<AppRoot />)
}
