import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings as SettingsIcon, ArrowLeft, Type, Contrast, Download, Upload, Database, Fingerprint, HardDrive, Volume2 } from 'lucide-react'
import { getSettings, saveSetting, type FontSize, type HighContrastMode } from '../lib/settings'
import { getPirateSettings } from '../lib/pirateSettings'
import { pirateSpeak } from '../lib/pirateSpeak'
import { hapticButtonPress } from '../lib/haptics'
import { exportAllData, exportPresets, exportRunHistory, downloadJSON, importFromFile } from '../lib/exportImport'
import { checkBiometricAvailability, getBiometricEnabled, setBiometricEnabled, authenticateBiometric } from '../lib/biometric'
import { getStorageStats, formatBytes, clearPwaCaches, type StorageStats } from '../lib/storageStats'
import { getBackupTimestamps, restoreBackup } from '../lib/exportImport'
import { Capacitor } from '@capacitor/core'
import Tooltip from '../components/Tooltip'
import './Settings.css'

export default function Settings() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState(getSettings())
  const [, setTick] = useState(0)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)
  const [biometricEnabled, setBiometricEnabledState] = useState(getBiometricEnabled())
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null)
  const [cacheClearing, setCacheClearing] = useState(false)
  const [backupTimestamps, setBackupTimestamps] = useState<number[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const ps = getPirateSettings().pirateSpeak

  const refreshStorageStats = useCallback(async () => {
    const stats = await getStorageStats()
    setStorageStats(stats)
  }, [])

  useEffect(() => {
    refreshStorageStats()
  }, [refreshStorageStats])

  useEffect(() => {
    setBackupTimestamps(getBackupTimestamps())
  }, [importSuccess])

  useEffect(() => {
    // Check biometric availability on mount
    if (Capacitor.isNativePlatform()) {
      checkBiometricAvailability().then((result) => {
        setBiometricAvailable(result.isAvailable)
      })
    }
  }, [])

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

  const handleExportAll = async () => {
    hapticButtonPress()
    const data = exportAllData()
    await downloadJSON(data, `preflight-export-${new Date().toISOString().split('T')[0]}.json`)
  }

  const handleExportPresets = async () => {
    hapticButtonPress()
    const data = exportPresets()
    await downloadJSON(data, `preflight-presets-${new Date().toISOString().split('T')[0]}.json`)
  }

  const handleExportHistory = async () => {
    hapticButtonPress()
    const data = exportRunHistory()
    await downloadJSON(data, `preflight-history-${new Date().toISOString().split('T')[0]}.json`)
  }

  const handleImportClick = () => {
    hapticButtonPress()
    fileInputRef.current?.click()
  }

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportError(null)
    setImportSuccess(null)

    const result = await importFromFile(file)
    if (result.success) {
      const parts: string[] = []
      if (result.imported.presets != null) parts.push(`${result.imported.presets} presets`)
      if (result.imported.runHistory != null) parts.push(`${result.imported.runHistory} history entries`)
      if (result.imported.checklistProgress != null) parts.push(`${result.imported.checklistProgress} progress items`)
      if (result.skippedInvalid) {
        const skipParts: string[] = []
        if (result.skippedInvalid.presets) skipParts.push(`${result.skippedInvalid.presets} invalid presets`)
        if (result.skippedInvalid.runHistory) skipParts.push(`${result.skippedInvalid.runHistory} invalid history`)
        if (result.skippedInvalid.checklistProgress) skipParts.push(`${result.skippedInvalid.checklistProgress} invalid progress`)
        if (skipParts.length) parts.push(`(${skipParts.join(', ')} skipped)`)
      }
      setImportSuccess(`Imported: ${parts.join('; ')}`)
      setBackupTimestamps(getBackupTimestamps())
      setTimeout(() => setImportSuccess(null), 5000)
      setTick((t) => t + 1)
    } else {
      setImportError(result.error || 'Import failed')
      setTimeout(() => setImportError(null), 5000)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleBiometricToggle = async () => {
    if (!biometricEnabled) {
      // Enable biometric - require authentication first
      const result = await authenticateBiometric('Enable biometric authentication for app access')
      if (result.success) {
        setBiometricEnabled(true)
        setBiometricEnabledState(true)
        hapticButtonPress()
      } else {
        setImportError(result.error || 'Biometric authentication failed')
        setTimeout(() => setImportError(null), 5000)
      }
    } else {
      // Disable biometric
      hapticButtonPress()
      setBiometricEnabled(false)
      setBiometricEnabledState(false)
    }
  }

  const handleClearCache = async () => {
    hapticButtonPress()
    setCacheClearing(true)
    try {
      await clearPwaCaches()
      await refreshStorageStats()
    } finally {
      setCacheClearing(false)
    }
  }

  const handleRestoreBackup = () => {
    const latest = backupTimestamps[0]
    if (latest == null) return
    hapticButtonPress()
    if (restoreBackup(latest)) {
      setImportSuccess('Restored from backup.')
      setBackupTimestamps(getBackupTimestamps())
      setTick((t) => t + 1)
      setTimeout(() => setImportSuccess(null), 5000)
    } else {
      setImportError('Failed to restore backup')
      setTimeout(() => setImportError(null), 5000)
    }
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
          <Tooltip content="Adjust the text size throughout the app for better readability." position="bottom">
            <h2 className="settings-section-title">
              <Type size={20} aria-hidden />
              {pirateSpeak('Font Size', ps)}
            </h2>
          </Tooltip>
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

        <section className="settings-section card">
          <h2 className="settings-section-title">
            <Volume2 size={20} aria-hidden />
            {pirateSpeak('Sound effects', ps)}
          </h2>
          <p className="settings-section-description">
            Play sounds for task completion, Op Mode reminders, and errors.
          </p>
          <div className="settings-toggle">
            <label className="settings-toggle-label">
              <input
                type="checkbox"
                checked={settings.soundEffects}
                onChange={() => {
                  const next = !settings.soundEffects
                  saveSetting('soundEffects', next)
                  setSettings((prev) => ({ ...prev, soundEffects: next }))
                  hapticButtonPress()
                }}
                className="settings-toggle-input"
                aria-label="Sound effects on or off"
              />
              <span className="settings-toggle-slider" />
              <span className="settings-toggle-text">
                {settings.soundEffects ? 'On' : 'Off'}
              </span>
            </label>
          </div>
        </section>

        {storageStats && (
          <section className="settings-section card" aria-label="Storage and cache">
            <h2 className="settings-section-title">
              <HardDrive size={20} aria-hidden />
              {pirateSpeak('Storage', ps)}
            </h2>
            <p className="settings-section-description">
              Data and cache usage. Clearing cache frees space but does not delete your presets or history.
            </p>
            <dl className="settings-storage-stats">
              <div className="settings-storage-row">
                <dt>App data (localStorage)</dt>
                <dd>{formatBytes(storageStats.localStorageBytes)}</dd>
              </div>
              {storageStats.cacheBytes != null && (
                <div className="settings-storage-row">
                  <dt>Cache</dt>
                  <dd>{formatBytes(storageStats.cacheBytes)}</dd>
                </div>
              )}
              <div className="settings-storage-row">
                <dt>Presets</dt>
                <dd>{storageStats.presetsCount}</dd>
              </div>
              <div className="settings-storage-row">
                <dt>Run history entries</dt>
                <dd>{storageStats.runHistoryCount}</dd>
              </div>
              <div className="settings-storage-row">
                <dt>Checklist progress entries</dt>
                <dd>{storageStats.checklistProgressCount}</dd>
              </div>
            </dl>
            <button
              type="button"
              className="settings-clear-cache-btn btn-secondary"
              onClick={handleClearCache}
              disabled={cacheClearing}
              aria-label="Clear cache to free space"
            >
              {cacheClearing ? 'Clearing…' : 'Clear cache'}
            </button>
          </section>
        )}

        <section className="settings-section card">
          <Tooltip content="Export your data for backup or import previously exported data." position="bottom">
            <h2 className="settings-section-title">
              <Database size={20} aria-hidden />
              {pirateSpeak('Data Management', ps)}
            </h2>
          </Tooltip>
          <p className="settings-section-description">
            Export your data for backup or import previously exported data.
          </p>
          
          <div className="settings-export-actions">
            <button
              className="settings-export-btn btn-secondary"
              onClick={handleExportAll}
              aria-label="Export all data"
            >
              <Download size={18} aria-hidden />
              Export All
            </button>
            <button
              className="settings-export-btn btn-secondary"
              onClick={handleExportPresets}
              aria-label="Export presets only"
            >
              <Download size={18} aria-hidden />
              Export Presets
            </button>
            <button
              className="settings-export-btn btn-secondary"
              onClick={handleExportHistory}
              aria-label="Export run history"
            >
              <Download size={18} aria-hidden />
              Export History
            </button>
          </div>

          <div className="settings-import">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileImport}
              style={{ display: 'none' }}
              aria-label="Import file"
            />
            <button
              className="settings-import-btn btn-primary"
              onClick={handleImportClick}
              aria-label="Import data from file"
            >
              <Upload size={18} aria-hidden />
              Import Data
            </button>
            {backupTimestamps.length > 0 && (
              <button
                type="button"
                className="settings-restore-backup-btn btn-secondary"
                onClick={handleRestoreBackup}
                aria-label="Restore from last backup"
              >
                Restore last backup
              </button>
            )}
            {importError && (
              <p className="settings-import-error" role="alert">
                {importError}
              </p>
            )}
            {importSuccess && (
              <p className="settings-import-success" role="status">
                {importSuccess}
              </p>
            )}
          </div>
        </section>

        {biometricAvailable && (
          <section className="settings-section card">
            <h2 className="settings-section-title">
              <Fingerprint size={20} aria-hidden />
              {pirateSpeak('Biometric Authentication', ps)}
            </h2>
            <p className="settings-section-description">
              Use fingerprint or face recognition to protect app access.
            </p>
            <div className="settings-toggle">
              <label className="settings-toggle-label">
                <input
                  type="checkbox"
                  checked={biometricEnabled}
                  onChange={handleBiometricToggle}
                  className="settings-toggle-input"
                />
                <span className="settings-toggle-slider" />
                <span className="settings-toggle-text">
                  {biometricEnabled ? 'On' : 'Off'}
                </span>
              </label>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
