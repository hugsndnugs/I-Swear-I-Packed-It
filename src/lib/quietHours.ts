/**
 * Quiet hours / Do Not Disturb: suppress or reduce notifications during a time window.
 */

const KEY_ENABLED = 'preflight-settings-quietHoursEnabled'
const KEY_START = 'preflight-settings-quietHoursStart'
const KEY_END = 'preflight-settings-quietHoursEnd'

const DEFAULT_START = '22:00' // 10 PM
const DEFAULT_END = '07:00'   // 7 AM

export interface QuietHoursConfig {
  enabled: boolean
  start: string  // "HH:mm"
  end: string    // "HH:mm"
}

export function getQuietHours(): QuietHoursConfig {
  if (typeof window === 'undefined') {
    return { enabled: false, start: DEFAULT_START, end: DEFAULT_END }
  }
  try {
    const enabled = localStorage.getItem(KEY_ENABLED) === 'true'
    const start = localStorage.getItem(KEY_START) ?? DEFAULT_START
    const end = localStorage.getItem(KEY_END) ?? DEFAULT_END
    return { enabled, start, end }
  } catch {
    return { enabled: false, start: DEFAULT_START, end: DEFAULT_END }
  }
}

export function setQuietHours(config: Partial<QuietHoursConfig>): void {
  if (typeof window === 'undefined') return
  try {
    if (config.enabled !== undefined) {
      localStorage.setItem(KEY_ENABLED, config.enabled ? 'true' : 'false')
    }
    if (config.start !== undefined) localStorage.setItem(KEY_START, config.start)
    if (config.end !== undefined) localStorage.setItem(KEY_END, config.end)
  } catch {
    /* ignore */
  }
}

/** Parse "HH:mm" to minutes since midnight */
function parseToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return ((h ?? 0) * 60) + (m ?? 0)
}

/**
 * Returns true if the current time is within the configured quiet hours window.
 * Handles overnight ranges (e.g. 22:00–07:00).
 */
export function isInQuietHours(): boolean {
  const { enabled, start, end } = getQuietHours()
  if (!enabled) return false
  const now = new Date()
  const currentMin = now.getHours() * 60 + now.getMinutes()
  const startMin = parseToMinutes(start)
  const endMin = parseToMinutes(end)
  if (startMin <= endMin) {
    return currentMin >= startMin && currentMin < endMin
  }
  // Overnight: e.g. 22:00–07:00 → current in [22:00, 24:00) or [0, 07:00)
  return currentMin >= startMin || currentMin < endMin
}
