/**
 * Storage and cache statistics and management for the Settings UI.
 */

import { loadPresets } from './presets'
import { loadRunHistory } from './runHistory'

const PREFIX = 'preflight-'

export interface StorageStats {
  /** Approximate localStorage size in bytes (heuristic: sum of key+value lengths). */
  localStorageBytes: number
  /** Approximate PWA cache size in bytes, or null if Cache API unavailable. */
  cacheBytes: number | null
  /** Number of saved presets. */
  presetsCount: number
  /** Number of run history entries. */
  runHistoryCount: number
  /** Number of checklist progress entries. */
  checklistProgressCount: number
}

/**
 * Estimate localStorage size (keys + values) for keys starting with preflight-.
 */
function estimateLocalStorageBytes(): number {
  if (typeof localStorage === 'undefined') return 0
  let total = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(PREFIX)) {
      const val = localStorage.getItem(key)
      total += (key.length + (val?.length ?? 0)) * 2 // UTF-16
    }
  }
  return total
}

/**
 * Get approximate cache size from Cache API (all caches).
 */
async function getCacheStorageBytes(): Promise<number | null> {
  if (typeof caches === 'undefined') return null
  try {
    const names = await caches.keys()
    let total = 0
    for (const name of names) {
      const cache = await caches.open(name)
      const keys = await cache.keys()
      for (const req of keys) {
        const res = await cache.match(req)
        if (res) {
          const blob = await res.blob()
          total += blob.size
        }
      }
    }
    return total
  } catch {
    return null
  }
}

/**
 * Get storage and data statistics.
 */
export async function getStorageStats(): Promise<StorageStats> {
  const presets = loadPresets()
  const runHistory = loadRunHistory()
  let checklistProgressCount = 0
  try {
    const raw = localStorage.getItem('preflight-checklist-progress')
    if (raw) {
      const arr = JSON.parse(raw)
      checklistProgressCount = Array.isArray(arr) ? arr.length : 0
    }
  } catch {
    // ignore
  }

  const cacheBytes = await getCacheStorageBytes()

  return {
    localStorageBytes: estimateLocalStorageBytes(),
    cacheBytes,
    presetsCount: presets.length,
    runHistoryCount: runHistory.length,
    checklistProgressCount
  }
}

/**
 * Format bytes for display.
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Clear PWA caches (does not clear localStorage).
 */
export async function clearPwaCaches(): Promise<void> {
  if (typeof caches === 'undefined') return
  const names = await caches.keys()
  await Promise.all(names.map((name) => caches.delete(name)))
}
