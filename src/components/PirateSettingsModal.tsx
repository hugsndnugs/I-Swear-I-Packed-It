import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { getPirateSettings, setPirateSettings, type PirateSettings } from '../lib/pirateSettings'
import './PirateSettingsModal.css'

interface PirateSettingsModalProps {
  onClose: () => void
  onSettingsChange?: () => void
}

export default function PirateSettingsModal({ onClose, onSettingsChange }: PirateSettingsModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const firstFocusRef = useRef<HTMLButtonElement>(null)
  const settings = getPirateSettings()

  useEffect(() => {
    firstFocusRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  const handleToggle = (key: keyof PirateSettings, value: boolean) => {
    setPirateSettings({ [key]: value })
    onSettingsChange?.()
  }

  return (
    <div
      className="pirate-modal-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pirate-modal-title"
    >
      <div
        className="pirate-modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
        <div className="pirate-modal-header">
          <h2 id="pirate-modal-title" className="pirate-modal-title">
            Pirate settings
          </h2>
          <button
            ref={firstFocusRef}
            type="button"
            className="pirate-modal-close"
            onClick={onClose}
            aria-label="Close pirate settings"
          >
            <X size={24} aria-hidden />
          </button>
        </div>
        <div className="pirate-modal-body">
          <label className="pirate-toggle">
            <span className="pirate-toggle-row">
              <input
                type="checkbox"
                checked={settings.theme}
                onChange={(e) => handleToggle('theme', e.target.checked)}
                aria-describedby="pirate-theme-desc"
              />
              <span className="pirate-toggle-label">Pirate theme</span>
            </span>
            <span id="pirate-theme-desc" className="pirate-toggle-desc">
              Amber accent and pirate styling
            </span>
          </label>
          <label className="pirate-toggle">
            <span className="pirate-toggle-row">
              <input
                type="checkbox"
                checked={settings.shipFilter}
                onChange={(e) => handleToggle('shipFilter', e.target.checked)}
                aria-describedby="pirate-ship-desc"
              />
              <span className="pirate-toggle-label">Show only pirate ships</span>
            </span>
            <span id="pirate-ship-desc" className="pirate-toggle-desc">
              Ship picker shows only pirate variants
            </span>
          </label>
          <label className="pirate-toggle">
            <span className="pirate-toggle-row">
              <input
                type="checkbox"
                checked={settings.pirateSpeak}
                onChange={(e) => handleToggle('pirateSpeak', e.target.checked)}
                aria-describedby="pirate-speak-desc"
              />
              <span className="pirate-toggle-label">Pirate speak</span>
            </span>
            <span id="pirate-speak-desc" className="pirate-toggle-desc">
              Fun pirate labels (e.g. Weigh Anchor)
            </span>
          </label>
          <label className="pirate-toggle">
            <span className="pirate-toggle-row">
              <input
                type="checkbox"
                checked={settings.pirateOpMode}
                onChange={(e) => handleToggle('pirateOpMode', e.target.checked)}
                aria-describedby="pirate-op-desc"
              />
              <span className="pirate-toggle-label">Pirate operation mode</span>
            </span>
            <span id="pirate-op-desc" className="pirate-toggle-desc">
              Show Piracy operation type in generator
            </span>
          </label>
        </div>
        <div className="pirate-modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
