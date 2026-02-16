import { useState, useEffect } from 'react'
import { getStoredTheme, setStoredTheme, type ThemePreference } from '../lib/theme'
import './ThemeToggle.css'

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' }
]

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemePreference>(() => getStoredTheme())

  useEffect(() => {
    setTheme(getStoredTheme())
  }, [])

  const handleChange = (pref: ThemePreference) => {
    setStoredTheme(pref)
    setTheme(pref)
  }

  return (
    <div className="theme-toggle" role="group" aria-label="Theme">
      <span className="theme-toggle-label">Theme</span>
      <div className="theme-toggle-options">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={'theme-toggle-btn' + (theme === opt.value ? ' active' : '')}
            onClick={() => handleChange(opt.value)}
            aria-pressed={theme === opt.value}
            aria-label={`Theme: ${opt.label}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
