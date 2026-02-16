/**
 * Recent routes (screens) and helpers for Recent Items quick access.
 * Persists last N visited routes with labels for display.
 */

import { setStorageError } from './storageError'
import { ROUTES } from '../constants/routes'

const RECENT_ROUTES_KEY = 'preflight-recent-routes'
const RECENT_ROUTES_MAX = 5

export interface RecentRouteEntry {
  path: string
  label: string
  timestamp: number
}

const PATH_LABELS: Record<string, string> = {
  [ROUTES.HOME]: 'Pre-Flight Assistant',
  [ROUTES.GENERATE]: 'Generate Checklist',
  [ROUTES.CHECKLIST]: 'Pre-Flight Checklist',
  [ROUTES.MANIFEST]: 'Cargo Manifest',
  [ROUTES.PACK]: 'Pack List',
  [ROUTES.EQUIPMENT]: 'Equipment Reference',
  [ROUTES.OP_MODE]: 'Op Mode',
  [ROUTES.SETTINGS]: 'Settings',
}

function getLabelForPath(path: string): string {
  if (PATH_LABELS[path]) return PATH_LABELS[path]
  for (const [route, label] of Object.entries(PATH_LABELS)) {
    if (route !== ROUTES.HOME && path.startsWith(route)) return label
  }
  return 'App'
}

function loadRecentRoutes(): RecentRouteEntry[] {
  try {
    const raw = localStorage.getItem(RECENT_ROUTES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (e): e is RecentRouteEntry =>
        e != null &&
        typeof e === 'object' &&
        typeof (e as RecentRouteEntry).path === 'string' &&
        typeof (e as RecentRouteEntry).label === 'string' &&
        typeof (e as RecentRouteEntry).timestamp === 'number'
    )
  } catch {
    return []
  }
}

function saveRecentRoutes(entries: RecentRouteEntry[]): void {
  try {
    localStorage.setItem(RECENT_ROUTES_KEY, JSON.stringify(entries))
    setStorageError(null)
  } catch {
    setStorageError('Could not save; check storage or use in normal browsing mode.')
  }
}

/**
 * Push a route onto the recent list (most recent first, max RECENT_ROUTES_MAX).
 * Skips Settings to avoid cluttering recent with settings visits.
 */
export function pushRecentRoute(path: string): void {
  if (path === ROUTES.SETTINGS) return
  const label = getLabelForPath(path)
  const entries = loadRecentRoutes()
  const filtered = entries.filter((e) => e.path !== path)
  const next: RecentRouteEntry[] = [{ path, label, timestamp: Date.now() }, ...filtered].slice(
    0,
    RECENT_ROUTES_MAX
  )
  saveRecentRoutes(next)
}

/**
 * Get recent route entries for display (most recent first).
 */
export function getRecentRoutes(): RecentRouteEntry[] {
  return loadRecentRoutes()
}
