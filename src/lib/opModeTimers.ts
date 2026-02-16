const STORAGE_KEY = 'preflight-opmode'
const TICK_MS = 10_000 // check every 10s

export type ReminderType = 'restock' | 'hydrate' | 'refuel'

export interface OpModeIntervals {
  restockIntervalMin: number
  hydrateIntervalMin: number
  refuelIntervalMin: number
}

export interface OpModeLastFired {
  restock?: number
  hydrate?: number
  refuel?: number
}

export interface OpModeState {
  restockIntervalMin: number
  hydrateIntervalMin: number
  refuelIntervalMin: number
  startedAt: number
  lastFired: OpModeLastFired
  notificationsEnabled?: boolean
}

const DEFAULT_INTERVALS: OpModeIntervals = {
  restockIntervalMin: 45,
  hydrateIntervalMin: 30,
  refuelIntervalMin: 60
}

export interface NextReminder {
  type: ReminderType
  label: string
  nextAt: number
  inMs: number
}

let tickTimer: ReturnType<typeof setInterval> | null = null
let onFire: ((type: ReminderType) => void) | null = null

function loadRaw(): OpModeState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const o = parsed as Record<string, unknown>
    if (
      typeof o.startedAt !== 'number' ||
      typeof o.restockIntervalMin !== 'number' ||
      typeof o.hydrateIntervalMin !== 'number' ||
      typeof o.refuelIntervalMin !== 'number' ||
      !o.lastFired ||
      typeof o.lastFired !== 'object'
    ) {
      return null
    }
    const lf = o.lastFired as Record<string, unknown>
    return {
      restockIntervalMin: o.restockIntervalMin,
      hydrateIntervalMin: o.hydrateIntervalMin,
      refuelIntervalMin: o.refuelIntervalMin,
      startedAt: o.startedAt,
      lastFired: {
        restock: typeof lf.restock === 'number' ? lf.restock : undefined,
        hydrate: typeof lf.hydrate === 'number' ? lf.hydrate : undefined,
        refuel: typeof lf.refuel === 'number' ? lf.refuel : undefined
      },
      notificationsEnabled: o.notificationsEnabled === true
    }
  } catch {
    return null
  }
}

function persist(state: OpModeState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

function getIntervalMin(state: OpModeState, type: ReminderType): number {
  if (type === 'restock') return state.restockIntervalMin
  if (type === 'hydrate') return state.hydrateIntervalMin
  return state.refuelIntervalMin
}

function nextFireTime(state: OpModeState, type: ReminderType): number {
  const last = state.lastFired[type]
  const intervalMin = getIntervalMin(state, type)
  const base = last ?? state.startedAt
  return base + intervalMin * 60 * 1000
}

function maybeShowNotification(type: ReminderType, enabled: boolean): void {
  if (!enabled || typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  const messages: Record<ReminderType, string> = {
    restock: 'Time to restock supplies.',
    hydrate: 'Time to hydrate.',
    refuel: 'Time to refuel.'
  }
  new Notification('Pre-Flight', { body: messages[type] })
}

function tick(): void {
  const state = loadRaw()
  if (!state || !onFire) return
  const now = Date.now()
  const types: ReminderType[] = ['restock', 'hydrate', 'refuel']
  let updated = false
  const nextLastFired = { ...state.lastFired }
  for (const type of types) {
    const nextAt = nextFireTime(state, type)
    if (now >= nextAt) {
      nextLastFired[type] = now
      updated = true
      onFire(type)
      maybeShowNotification(type, state.notificationsEnabled === true)
    }
  }
  if (updated) {
    const nextState: OpModeState = { ...state, lastFired: nextLastFired }
    persist(nextState)
  }
}

export function getState(): OpModeState | null {
  return loadRaw()
}

export function getNextReminders(): NextReminder[] {
  const state = loadRaw()
  if (!state) return []
  const now = Date.now()
  const types: ReminderType[] = ['restock', 'hydrate', 'refuel']
  const labels: Record<ReminderType, string> = {
    restock: 'Restock',
    hydrate: 'Hydrate',
    refuel: 'Refuel'
  }
  return types
    .map((type) => ({
      type,
      label: labels[type],
      nextAt: nextFireTime(state, type),
      inMs: nextFireTime(state, type) - now
    }))
    .filter((r) => r.inMs > 0)
    .sort((a, b) => a.nextAt - b.nextAt)
}

export function resumeOpMode(): void {
  if (tickTimer || !loadRaw()) return
  tickTimer = setInterval(tick, TICK_MS)
}

export function startOpMode(
  intervals: Partial<OpModeIntervals> = {},
  options?: { notificationsEnabled?: boolean }
): OpModeState {
  stopOpMode()
  const state: OpModeState = {
    restockIntervalMin: intervals.restockIntervalMin ?? DEFAULT_INTERVALS.restockIntervalMin,
    hydrateIntervalMin: intervals.hydrateIntervalMin ?? DEFAULT_INTERVALS.hydrateIntervalMin,
    refuelIntervalMin: intervals.refuelIntervalMin ?? DEFAULT_INTERVALS.refuelIntervalMin,
    startedAt: Date.now(),
    lastFired: {},
    notificationsEnabled: options?.notificationsEnabled
  }
  persist(state)
  onFire = null
  tickTimer = setInterval(tick, TICK_MS)
  tick() // run once immediately in case already due
  return state
}

export function updateOpModeNotifications(enabled: boolean): void {
  const state = loadRaw()
  if (!state) return
  persist({ ...state, notificationsEnabled: enabled })
}

export function stopOpMode(): void {
  if (tickTimer) {
    clearInterval(tickTimer)
    tickTimer = null
  }
  onFire = null
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function setOnReminderFire(callback: ((type: ReminderType) => void) | null): void {
  onFire = callback
}

export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof Notification === 'undefined') return Promise.resolve('denied')
  return Notification.requestPermission()
}

export function getDefaultIntervals(): OpModeIntervals {
  return { ...DEFAULT_INTERVALS }
}
