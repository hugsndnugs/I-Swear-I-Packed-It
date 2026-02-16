import { Capacitor } from '@capacitor/core'
import { saveSetting } from './settings'

export type ThemePreference = 'light' | 'dark' | 'system'

/** Color palette / accent theme (default, high contrast, Star Citizen–style, or system/Material You) */
export type ThemePalette = 'default' | 'high-contrast' | 'star-citizen' | 'material-you'

const THEME_KEY = 'preflight-theme'
const OLED_KEY = 'preflight-theme-oled'
const PALETTE_KEY = 'preflight-theme-palette'

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function resolveTheme(pref: ThemePreference): 'light' | 'dark' {
  if (pref === 'system') return getSystemTheme()
  return pref
}

function applyPalette() {
  if (typeof document === 'undefined') return
  const palette = getStoredThemePalette()
  document.documentElement.setAttribute('data-theme-palette', palette)
}

function applyTheme(resolved: 'light' | 'dark') {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', resolved)
  const oled = getStoredOledDark()
  document.documentElement.setAttribute('data-oled', resolved === 'dark' && oled ? 'true' : 'false')
  applyPalette()
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

export function getStoredOledDark(): boolean {
  try {
    return localStorage.getItem(OLED_KEY) === 'true'
  } catch {
    return false
  }
}

export function setStoredOledDark(value: boolean): void {
  try {
    localStorage.setItem(OLED_KEY, value ? 'true' : 'false')
  } catch {
    /* ignore */
  }
  applyTheme(getResolvedTheme())
}

export function getStoredThemePalette(): ThemePalette {
  try {
    const raw = localStorage.getItem(PALETTE_KEY)
    if (raw === 'default' || raw === 'high-contrast' || raw === 'star-citizen' || raw === 'material-you') return raw
  } catch {
    /* ignore */
  }
  return 'default'
}

export function setStoredThemePalette(palette: ThemePalette): void {
  try {
    localStorage.setItem(PALETTE_KEY, palette)
    // Keep Settings high-contrast in sync so App.tsx applies data-high-contrast
    if (typeof window !== 'undefined') {
      saveSetting('highContrast', palette === 'high-contrast' ? 'on' : 'off')
    }
  } catch {
    /* ignore */
  }
  applyPalette()
  if (palette === 'material-you') applyMaterialYouAccent()
}

/** Fetch Android 12+ system accent and set CSS vars for Material You palette */
export function applyMaterialYouAccent(): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (getStoredThemePalette() !== 'material-you') {
    root.style.removeProperty('--system-accent')
    root.style.removeProperty('--system-accent-hover')
    root.style.removeProperty('--system-accent-muted')
    return
  }
  if (!Capacitor.isNativePlatform()) return
  const plugin = (Capacitor as unknown as { Plugins?: { DynamicColor?: { getSystemAccentColor: () => Promise<{ primary?: string | null }> } } }).Plugins?.DynamicColor
  if (!plugin?.getSystemAccentColor) return
  plugin.getSystemAccentColor().then((result) => {
    const primary = result?.primary
    if (primary && typeof primary === 'string') {
      root.style.setProperty('--system-accent', primary)
      root.style.setProperty('--system-accent-hover', primary)
      root.style.setProperty('--system-accent-muted', `${primary}26`)
    } else {
      root.style.removeProperty('--system-accent')
      root.style.removeProperty('--system-accent-hover')
      root.style.removeProperty('--system-accent-muted')
    }
  }).catch(() => {
    root.style.removeProperty('--system-accent')
    root.style.removeProperty('--system-accent-hover')
    root.style.removeProperty('--system-accent-muted')
  })
}

export function initTheme(): void {
  applyTheme(getResolvedTheme())
  if (getStoredThemePalette() === 'material-you') applyMaterialYouAccent()
  if (typeof window !== 'undefined' && window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
      if (getStoredTheme() === 'system') applyTheme(getSystemTheme())
    })
  }
}
