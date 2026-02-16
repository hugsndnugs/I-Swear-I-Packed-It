import { setStorageError } from './storageError'

const RECENT_SHIPS_KEY = 'preflight-recent-ships'
const FAVORITE_SHIPS_KEY = 'preflight-favorite-ships'
const RECENT_MAX = 5

function loadStringArray(key: string): string[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is string => typeof id === 'string')
  } catch {
    return []
  }
}

function saveStringArray(key: string, arr: string[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(arr))
    setStorageError(null)
  } catch {
    setStorageError('Could not save; check storage or use in normal browsing mode.')
  }
}

/** Push a ship ID to the recent list (most recent first, max RECENT_MAX). */
export function pushRecentShip(shipId: string): void {
  const recent = loadStringArray(RECENT_SHIPS_KEY)
  const next = [shipId, ...recent.filter((id) => id !== shipId)].slice(0, RECENT_MAX)
  saveStringArray(RECENT_SHIPS_KEY, next)
}

export function getRecentShipIds(): string[] {
  return loadStringArray(RECENT_SHIPS_KEY)
}

export function getFavoriteShipIds(): string[] {
  return loadStringArray(FAVORITE_SHIPS_KEY)
}

export function isFavorite(shipId: string): boolean {
  return getFavoriteShipIds().includes(shipId)
}

export function toggleFavorite(shipId: string): void {
  const fav = getFavoriteShipIds()
  const next = fav.includes(shipId) ? fav.filter((id) => id !== shipId) : [...fav, shipId]
  saveStringArray(FAVORITE_SHIPS_KEY, next)
}
