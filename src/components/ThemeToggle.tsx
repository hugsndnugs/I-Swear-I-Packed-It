import { useState, useEffect } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { getStoredTheme, setStoredTheme, type ThemePreference } from '../lib/theme'
import './ThemeToggle.css'

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor }
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
      <div className="theme-toggle-options">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon
          return (
            <button
              key={opt.value}
              type="button"
              className={'theme-toggle-btn' + (theme === opt.value ? ' active' : '')}
              onClick={() => handleChange(opt.value)}
              aria-pressed={theme === opt.value}
              aria-label={`Theme: ${opt.label}`}
              title={opt.label}
            >
              <Icon size={18} aria-hidden />
            </button>
          )
        })}
      </div>
    </div>
  )
}
