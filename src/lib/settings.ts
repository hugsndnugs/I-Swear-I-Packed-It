/**
 * Settings management for user preferences
 */

export type FontSize = 'small' | 'medium' | 'large' | 'extra-large'
export type ThemeMode = 'light' | 'dark' | 'system'
export type HighContrastMode = 'off' | 'on'

const STORAGE_KEY_PREFIX = 'preflight-settings-'

const DEFAULT_SETTINGS = {
  fontSize: 'medium' as FontSize,
  highContrast: 'off' as HighContrastMode,
  soundEffects: true,
  oneHandedMode: false,
}

export interface AppSettings {
  fontSize: FontSize
  highContrast: HighContrastMode
  soundEffects: boolean
  oneHandedMode: boolean
}

/**
 * Get all settings
 */
export function getSettings(): AppSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS
  }

  try {
    const fontSize = (localStorage.getItem(`${STORAGE_KEY_PREFIX}fontSize`) as FontSize) || DEFAULT_SETTINGS.fontSize
    const highContrast = (localStorage.getItem(`${STORAGE_KEY_PREFIX}highContrast`) as HighContrastMode) || DEFAULT_SETTINGS.highContrast
    const soundEffectsRaw = localStorage.getItem(`${STORAGE_KEY_PREFIX}soundEffects`)
    const soundEffects = soundEffectsRaw === 'false' ? false : DEFAULT_SETTINGS.soundEffects
    const oneHandedModeRaw = localStorage.getItem(`${STORAGE_KEY_PREFIX}oneHandedMode`)
    const oneHandedMode = oneHandedModeRaw === 'true'

    return {
      fontSize,
      highContrast,
      soundEffects,
      oneHandedMode,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

/**
 * Save a setting
 */
export function saveSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${key}`, String(value))
    // Dispatch event for settings change
    window.dispatchEvent(new CustomEvent('settings-changed', { detail: { key, value } }))
  } catch (error) {
    console.error('Failed to save setting:', error)
  }
}

/**
 * Get font size multiplier
 */
export function getFontSizeMultiplier(fontSize: FontSize): number {
  switch (fontSize) {
    case 'small':
      return 0.875
    case 'medium':
      return 1
    case 'large':
      return 1.125
    case 'extra-large':
      return 1.25
    default:
      return 1
  }
}

/**
 * Get system font size preference
 */
export function getSystemFontSize(): FontSize {
  if (typeof window === 'undefined') return 'medium'

  // Check if user has system font size preference
  // This is a simplified check - in a real app, you might use matchMedia or other APIs
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize)
  
  // Base font size is typically 16px
  if (rootFontSize < 14) return 'small'
  if (rootFontSize > 18) return 'extra-large'
  if (rootFontSize > 16) return 'large'
  return 'medium'
}
