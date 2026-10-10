import { createContext, use, useEffect, type ReactNode } from 'react'
import { Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'

export const THEME_STORAGE_KEY = 'theme:v1'

export type ThemeChoice = 'light' | 'dark'

export function resolveTheme(): ThemeChoice {
  return 'light'
}

export function applyThemeClass(theme: ThemeChoice): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

interface ThemeContextValue {
  theme: ThemeChoice
  setTheme: (theme: ThemeChoice) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    applyThemeClass('light')
  }, [])

  const setTheme = (next: ThemeChoice) => {
    void next
    applyThemeClass('light')
  }

  const toggleTheme = () => {
    applyThemeClass('light')
  }

  return (
    <ThemeContext value={{ theme: 'light', setTheme, toggleTheme }}>
      {children}
    </ThemeContext>
  )
}

function useTheme(): ThemeContextValue {
  const ctx = use(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return ctx
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const label =
    theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={toggleTheme}
      aria-label={label}
      className="size-11 shrink-0 text-inherit"
    >
      {theme === 'dark' ? (
        <Sun aria-hidden="true" />
      ) : (
        <Moon aria-hidden="true" />
      )}
    </Button>
  )
}
