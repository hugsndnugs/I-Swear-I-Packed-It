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
 * Import data from JSON file or file path (Android)
 */
export async function importFromFile(fileOrPath: File | string): Promise<{
  success: boolean
  error?: string
  imported: {
    presets?: number
    runHistory?: number
    checklistProgress?: number
  }
}> {
  try {
    let text: string
    if (typeof fileOrPath === 'string') {
      // Native file path
      const { readFile } = await import('./fileSystem')
      text = await readFile(fileOrPath)
    } else {
      // Browser File object
      text = await fileOrPath.text()
    }
    const data = JSON.parse(text) as unknown

    if (!data || typeof data !== 'object') {
      return { success: false, error: 'Invalid file format', imported: {} }
    }

    const imported: { presets?: number; runHistory?: number; checklistProgress?: number } = {}

    // Import presets
    if ('presets' in data && Array.isArray(data.presets)) {
      const existingPresets = loadPresets()
      const newPresets = data.presets as PresetConfig[]
      const allPresets = [...existingPresets, ...newPresets]
      try {
        localStorage.setItem('preflight-presets', JSON.stringify(allPresets))
        imported.presets = newPresets.length
      } catch {
        return { success: false, error: 'Failed to import presets', imported }
      }
    }

    // Import run history
    if ('runHistory' in data && Array.isArray(data.runHistory)) {
      const existingHistory = loadRunHistory()
      const newHistory = data.runHistory as RunSummary[]
      const allHistory = [...existingHistory, ...newHistory]
      try {
        localStorage.setItem('preflight-run-history', JSON.stringify(allHistory))
        imported.runHistory = newHistory.length
      } catch {
        return { success: false, error: 'Failed to import run history', imported }
      }
    }

    // Import checklist progress (if exists in export)
    if ('checklistProgress' in data && Array.isArray(data.checklistProgress)) {
      const newProgress = data.checklistProgress as ChecklistProgress[]
      try {
        const existingProgressJson = localStorage.getItem('preflight-checklist-progress')
        const existingProgress = existingProgressJson ? JSON.parse(existingProgressJson) : []
        const allProgress = [...existingProgress, ...newProgress]
        localStorage.setItem('preflight-checklist-progress', JSON.stringify(allProgress))
        imported.checklistProgress = newProgress.length
      } catch {
        return { success: false, error: 'Failed to import checklist progress', imported }
      }
    }

    setStorageError(null)
    return { success: true, imported }
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
