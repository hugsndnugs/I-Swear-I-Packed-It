import type { ShipProfile } from '../data/shipTypes'

const STORAGE_KEY = 'preflight-pirate-settings'

export interface PirateSettings {
  unlocked?: boolean
  theme: boolean
  shipFilter: boolean
  pirateSpeak: boolean
  pirateOpMode: boolean
}

const DEFAULTS: PirateSettings = {
  theme: false,
  shipFilter: false,
  pirateSpeak: false,
  pirateOpMode: false
}

function parse(stored: string | null): PirateSettings {
  if (!stored) return { ...DEFAULTS }
  try {
    const raw = JSON.parse(stored) as Partial<PirateSettings>
    return {
      unlocked: raw.unlocked ?? DEFAULTS.unlocked,
      theme: Boolean(raw.theme),
      shipFilter: Boolean(raw.shipFilter),
      pirateSpeak: Boolean(raw.pirateSpeak),
      pirateOpMode: Boolean(raw.pirateOpMode)
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export function getPirateSettings(): PirateSettings {
  if (typeof localStorage === 'undefined') return { ...DEFAULTS }
  return parse(localStorage.getItem(STORAGE_KEY))
}

export function setPirateSettings(partial: Partial<PirateSettings>): void {
  if (typeof localStorage === 'undefined') return
  const current = getPirateSettings()
  const next: PirateSettings = {
    ...current,
    ...partial
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function isPirateShip(ship: ShipProfile): boolean {
  return (
    ship.id.toLowerCase().includes('pirate') ||
    ship.name.toLowerCase().includes('pirate')
  )
}
