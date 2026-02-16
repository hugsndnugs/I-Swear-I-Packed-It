import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings as SettingsIcon, ArrowLeft, Type, Contrast } from 'lucide-react'
import { getSettings, saveSetting, type FontSize, type HighContrastMode } from '../lib/settings'
import { getPirateSettings } from '../lib/pirateSettings'
import { pirateSpeak } from '../lib/pirateSpeak'
import { hapticButtonPress } from '../lib/haptics'
import './Settings.css'

export default function Settings() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState(getSettings())
  const [, setTick] = useState(0)
  const ps = getPirateSettings().pirateSpeak

  useEffect(() => {
    const handler = () => {
      setSettings(getSettings())
      setTick((t) => t + 1)
    }
    window.addEventListener('settings-changed', handler)
    return () => window.removeEventListener('settings-changed', handler)
  }, [])

  const handleFontSizeChange = (size: FontSize) => {
    saveSetting('fontSize', size)
    setSettings((prev) => ({ ...prev, fontSize: size }))
    hapticButtonPress()
  }

  const handleHighContrastToggle = () => {
    const newValue: HighContrastMode = settings.highContrast === 'on' ? 'off' : 'on'
    saveSetting('highContrast', newValue)
    setSettings((prev) => ({ ...prev, highContrast: newValue }))
    hapticButtonPress()
  }

  return (
    <div className="settings">
      <div className="settings-header">
        <button
          className="settings-back btn-icon"
          onClick={() => {
            hapticButtonPress()
            navigate(-1)
          }}
          aria-label="Go back"
        >
          <ArrowLeft size={20} aria-hidden />
        </button>
        <h1 className="settings-title">
          <SettingsIcon size={24} aria-hidden />
          {pirateSpeak('Settings', ps)}
        </h1>
      </div>

      <div className="settings-content">
        <section className="settings-section card">
          <h2 className="settings-section-title">
            <Type size={20} aria-hidden />
            {pirateSpeak('Font Size', ps)}
          </h2>
          <p className="settings-section-description">
            Adjust the text size throughout the app for better readability.
          </p>
          <div className="settings-options">
            {(['small', 'medium', 'large', 'extra-large'] as FontSize[]).map((size) => (
              <button
                key={size}
                className={`settings-option ${settings.fontSize === size ? 'settings-option--active' : ''}`}
                onClick={() => handleFontSizeChange(size)}
                aria-pressed={settings.fontSize === size}
              >
                <span className="settings-option-label">
                  {size.charAt(0).toUpperCase() + size.slice(1).replace('-', ' ')}
                </span>
                {settings.fontSize === size && (
                  <span className="settings-option-check" aria-hidden>✓</span>
                )}
              </button>
            ))}
          </div>
        </section>

        <section className="settings-section card">
          <h2 className="settings-section-title">
            <Contrast size={20} aria-hidden />
            {pirateSpeak('High Contrast', ps)}
          </h2>
          <p className="settings-section-description">
            Increase contrast for better visibility, especially in low-light conditions.
          </p>
          <div className="settings-toggle">
            <label className="settings-toggle-label">
              <input
                type="checkbox"
                checked={settings.highContrast === 'on'}
                onChange={handleHighContrastToggle}
                className="settings-toggle-input"
              />
              <span className="settings-toggle-slider" />
              <span className="settings-toggle-text">
                {settings.highContrast === 'on' ? 'On' : 'Off'}
              </span>
            </label>
          </div>
        </section>
      </div>
    </div>
  )
}
