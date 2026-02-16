export type ThemePreference = 'light' | 'dark' | 'system'

const THEME_KEY = 'preflight-theme'

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function resolveTheme(pref: ThemePreference): 'light' | 'dark' {
  if (pref === 'system') return getSystemTheme()
  return pref
}

function applyTheme(resolved: 'light' | 'dark') {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', resolved)
}

export function getStoredTheme(): ThemePreference {
  try {
    const raw = localStorage.getItem(THEME_KEY)
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
  } catch {
    /* ignore */
  }
  return 'system'
}

export function setStoredTheme(pref: ThemePreference): void {
  try {
    localStorage.setItem(THEME_KEY, pref)
  } catch {
    /* ignore */
  }
  applyTheme(resolveTheme(pref))
}

export function getResolvedTheme(): 'light' | 'dark' {
  return resolveTheme(getStoredTheme())
}

export function initTheme(): void {
  applyTheme(getResolvedTheme())
  if (typeof window !== 'undefined' && window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
      if (getStoredTheme() === 'system') applyTheme(getSystemTheme())
    })
  }
}
