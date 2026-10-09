import {
  createContext,
  use,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

export const THEME_STORAGE_KEY = 'theme:v1'

export type ThemeChoice = 'light' | 'dark'

/** Card and watch photos use object-fit only; no theme-driven filters (CAT-119). */
export const watchPhotoImgClassName = 'object-contain'

export function readStoredTheme(): ThemeChoice | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    if (value === 'light' || value === 'dark') return value
    return null
  } catch {
    return null
  }
}

function systemPrefersDark(): boolean {
  if (typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function resolveTheme(): ThemeChoice {
  const stored = readStoredTheme()
  if (stored) return stored
  return systemPrefersDark() ? 'dark' : 'light'
}

export function applyThemeClass(theme: ThemeChoice): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

function persistTheme(theme: ThemeChoice): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // private mode / disabled storage
  }
  applyThemeClass(theme)
}

interface ThemeContextValue {
  theme: ThemeChoice
  setTheme: (theme: ThemeChoice) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeChoice>(() => resolveTheme())

  useEffect(() => {
    applyThemeClass(theme)
  }, [theme])

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (readStoredTheme() === null) {
        setThemeState(mq.matches ? 'dark' : 'light')
      }
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const setTheme = (next: ThemeChoice) => {
    persistTheme(next)
    setThemeState(next)
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext value={{ theme, setTheme, toggleTheme }}>
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
    <button type="button" onClick={toggleTheme} aria-label={label}>
      {label}
    </button>
  )
}
