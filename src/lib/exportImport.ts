import { loadPresets, type PresetConfig } from './presets'
import { loadLastRun, type LastRunConfig } from './presets'
import { loadRunHistory, type RunSummary } from './runHistory'
import { setStorageError } from './storageError'
import { writeToDownloads } from './fileSystem'
import { Capacitor } from '@capacitor/core'

export interface ChecklistProgress {
  shipId: string
  operationType: string
  crewRoles: string[]
  completedIds: string[]
}

/**
 * Export/Import utilities for app data
 */

export interface ExportData {
  version: string
  presets: PresetConfig[]
  lastRun: LastRunConfig | null
  runHistory: RunSummary[]
  checklistProgress: ChecklistProgress[]
  exportedAt: number
}

const EXPORT_VERSION = '1.0'
const BACKUP_PREFIX = 'preflight-backup-'
const BACKUP_KEYS = ['preflight-presets', 'preflight-run-history', 'preflight-checklist-progress']

function isValidPresetItem(v: unknown): v is PresetConfig {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    typeof o.shipId === 'string' &&
    typeof o.operationType === 'string' &&
    (typeof o.crewCount === 'number' || (Array.isArray(o.crewRoles) && o.crewRoles.every((r) => typeof r === 'string'))) &&
    typeof o.createdAt === 'number'
  )
}

function isValidRunSummaryItem(v: unknown): v is RunSummary {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return (
    typeof o.shipId === 'string' &&
    typeof o.operationType === 'string' &&
    Array.isArray(o.crewRoles) &&
    Array.isArray(o.completedIds) &&
    Array.isArray(o.allTaskIds) &&
    typeof o.timestamp === 'number'
  )
}

function isValidChecklistProgressItem(v: unknown): v is ChecklistProgress {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return (
    typeof o.shipId === 'string' &&
    typeof o.operationType === 'string' &&
    Array.isArray(o.crewRoles) &&
    (o.crewRoles as unknown[]).every((r) => typeof r === 'string') &&
    Array.isArray(o.completedIds) &&
    (o.completedIds as unknown[]).every((id) => typeof id === 'string')
  )
}

/**
 * Export all app data to JSON
 */
export function exportAllData(): ExportData {
  let checklistProgress: ChecklistProgress[] = []
  try {
    const progressJson = localStorage.getItem('preflight-checklist-progress')
    if (progressJson) {
      checklistProgress = JSON.parse(progressJson)
    }
  } catch {
    // Ignore errors reading checklist progress
  }

  return {
    version: EXPORT_VERSION,
    presets: loadPresets(),
    lastRun: loadLastRun(),
    runHistory: loadRunHistory(),
    checklistProgress,
    exportedAt: Date.now()
  }
}

/**
 * Export presets only
 */
export function exportPresets(): { presets: PresetConfig[]; exportedAt: number } {
  return {
    presets: loadPresets(),
    exportedAt: Date.now()
  }
}

/**
 * Export run history only
 */
export function exportRunHistory(): { runHistory: RunSummary[]; exportedAt: number } {
  return {
    runHistory: loadRunHistory(),
    exportedAt: Date.now()
  }
}

/**
 * Download data as JSON file
 * Uses native file system on Android, browser download on web
 */
export async function downloadJSON(data: unknown, filename: string): Promise<void> {
  try {
    const json = JSON.stringify(data, null, 2)
    
    if (Capacitor.isNativePlatform()) {
      // Use native file system on Android
      await writeToDownloads(filename, json)
    } else {
      // Fallback to browser download
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  } catch (error) {
    console.error('Failed to download JSON:', error)
    setStorageError('Failed to export data')
  }
}

/**
 * Create a backup of current presets, run history, and checklist progress.
 * Returns the timestamp used for the backup keys.
 */
export function createBackup(): number {
  const ts = Date.now()
  try {
    for (const key of BACKUP_KEYS) {
      const val = localStorage.getItem(key)
      if (val != null) localStorage.setItem(`${BACKUP_PREFIX}${ts}-${key}`, val)
    }
    return ts
  } catch {
    return 0
  }
}

/**
 * List backup timestamps (newest first). Keys are stored as preflight-backup-<ts>-<dataKey>.
 */
export function getBackupTimestamps(): number[] {
  const timestamps = new Set<number>()
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(BACKUP_PREFIX)) {
        const rest = key.slice(BACKUP_PREFIX.length)
        const dash = rest.indexOf('-')
        if (dash > 0) {
          const ts = Number(rest.slice(0, dash))
          if (!Number.isNaN(ts)) timestamps.add(ts)
        }
      }
    }
  } catch {
    // ignore
  }
  return [...timestamps].sort((a, b) => b - a)
}

/**
 * Restore from a backup with the given timestamp. Returns true if restored.
 */
export function restoreBackup(timestamp: number): boolean {
  try {
    for (const key of BACKUP_KEYS) {
      const backupKey = `${BACKUP_PREFIX}${timestamp}-${key}`
      const val = localStorage.getItem(backupKey)
      if (val != null) localStorage.setItem(key, val)
    }
    setStorageError(null)
    return true
  } catch {
    return false
  }
}

export interface ImportResult {
  success: boolean
  error?: string
  imported: { presets?: number; runHistory?: number; checklistProgress?: number }
  skippedInvalid?: { presets?: number; runHistory?: number; checklistProgress?: number }
}

/**
 * Import data from JSON file or file path (Android).
 * Backs up current data before import. Validates each item and skips invalid entries.
 */
export async function importFromFile(fileOrPath: File | string): Promise<ImportResult> {
  try {
    let text: string
    if (typeof fileOrPath === 'string') {
      const { readFile } = await import('./fileSystem')
      text = await readFile(fileOrPath)
    } else {
      text = await fileOrPath.text()
    }
    const data = JSON.parse(text) as unknown

    if (!data || typeof data !== 'object') {
      return { success: false, error: 'Invalid file format', imported: {} }
    }

    createBackup()

    const imported: { presets?: number; runHistory?: number; checklistProgress?: number } = {}
    const skippedInvalid: { presets?: number; runHistory?: number; checklistProgress?: number } = {}

    if ('presets' in data && Array.isArray(data.presets)) {
      const raw = data.presets as unknown[]
      const valid = raw.filter(isValidPresetItem) as PresetConfig[]
      const skipped = raw.length - valid.length
      if (skipped > 0) skippedInvalid.presets = skipped
      const existingPresets = loadPresets()
      const allPresets = [...existingPresets, ...valid]
      try {
        localStorage.setItem('preflight-presets', JSON.stringify(allPresets))
        imported.presets = valid.length
      } catch {
        return { success: false, error: 'Failed to import presets', imported, skippedInvalid }
      }
    }

    if ('runHistory' in data && Array.isArray(data.runHistory)) {
      const raw = data.runHistory as unknown[]
      const valid = raw.filter(isValidRunSummaryItem) as RunSummary[]
      const skipped = raw.length - valid.length
      if (skipped > 0) skippedInvalid.runHistory = skipped
      const existingHistory = loadRunHistory()
      const allHistory = [...existingHistory, ...valid]
      try {
        localStorage.setItem('preflight-run-history', JSON.stringify(allHistory))
        imported.runHistory = valid.length
      } catch {
        return { success: false, error: 'Failed to import run history', imported, skippedInvalid }
      }
    }

    if ('checklistProgress' in data && Array.isArray(data.checklistProgress)) {
      const raw = data.checklistProgress as unknown[]
      const valid = raw.filter(isValidChecklistProgressItem) as ChecklistProgress[]
      const skipped = raw.length - valid.length
      if (skipped > 0) skippedInvalid.checklistProgress = skipped
      try {
        const existingProgressJson = localStorage.getItem('preflight-checklist-progress')
        let existingProgress: ChecklistProgress[] = []
        if (existingProgressJson) {
          try {
            const parsed = JSON.parse(existingProgressJson)
            existingProgress = Array.isArray(parsed) ? parsed.filter(isValidChecklistProgressItem) as ChecklistProgress[] : []
          } catch {
            existingProgress = []
          }
        }
        const allProgress = [...existingProgress, ...valid]
        localStorage.setItem('preflight-checklist-progress', JSON.stringify(allProgress))
        imported.checklistProgress = valid.length
      } catch {
        return { success: false, error: 'Failed to import checklist progress', imported, skippedInvalid }
      }
    }

    setStorageError(null)
    return { success: true, imported, skippedInvalid: Object.keys(skippedInvalid).length > 0 ? skippedInvalid : undefined }
  } catch (error) {
    console.error('Failed to import data:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse file',
      imported: {}
    }
  }
}

/**
 * Validate export data structure
 */
export function validateExportData(data: unknown): data is ExportData {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  return (
    typeof d.version === 'string' &&
    Array.isArray(d.presets) &&
    (d.lastRun === null || typeof d.lastRun === 'object') &&
    Array.isArray(d.runHistory) &&
    Array.isArray(d.checklistProgress) &&
    typeof d.exportedAt === 'number'
  )
}
