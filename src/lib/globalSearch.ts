/**
 * Global search: match ships, presets, equipment, and screens by query.
 */

import { ROUTES } from '../constants/routes'
import type { PresetConfig } from './presets'
import type { ShipProfile } from '../data/shipTypes'
import type { EquipmentItem } from '../data/equipment'

const ROUTE_LABELS: Record<string, string> = {
  [ROUTES.HOME]: 'Pre-Flight Assistant',
  [ROUTES.GENERATE]: 'Generate Checklist',
  [ROUTES.CHECKLIST]: 'Pre-Flight Checklist',
  [ROUTES.MANIFEST]: 'Cargo Manifest',
  [ROUTES.PACK]: 'Pack List',
  [ROUTES.EQUIPMENT]: 'Equipment Reference',
  [ROUTES.OP_MODE]: 'Op Mode',
  [ROUTES.SETTINGS]: 'Settings',
}

export interface ShipSearchHit {
  type: 'ship'
  id: string
  name: string
}

export interface PresetSearchHit {
  type: 'preset'
  id: string
  name: string
  preset: PresetConfig
}

export interface EquipmentSearchHit {
  type: 'equipment'
  id: string
  name: string
  category: string
}

export interface ScreenSearchHit {
  type: 'screen'
  path: string
  label: string
}

export type GlobalSearchHit =
  | ShipSearchHit
  | PresetSearchHit
  | EquipmentSearchHit
  | ScreenSearchHit

export interface GlobalSearchResult {
  ships: ShipSearchHit[]
  presets: PresetSearchHit[]
  equipment: EquipmentSearchHit[]
  screens: ScreenSearchHit[]
}

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, ' ')
}

function matches(queryNorm: string, text: string): boolean {
  if (!queryNorm) return true
  return normalize(text).includes(queryNorm)
}

const MAX_PER_GROUP = 8

export function searchGlobal(
  query: string,
  options: {
    ships: ShipProfile[]
    presets: PresetConfig[]
    equipment: EquipmentItem[]
  }
): GlobalSearchResult {
  const q = normalize(query)
  const result: GlobalSearchResult = {
    ships: [],
    presets: [],
    equipment: [],
    screens: [],
  }

  if (!q) {
    // Empty query: return screens only (quick navigation)
    result.screens = Object.entries(ROUTE_LABELS).map(([path, label]) => ({
      type: 'screen',
      path,
      label,
    }))
    return result
  }

  for (const ship of options.ships) {
    if (result.ships.length >= MAX_PER_GROUP) break
    if (matches(q, ship.name) || matches(q, ship.id)) {
      result.ships.push({ type: 'ship', id: ship.id, name: ship.name })
    }
  }

  for (const preset of options.presets) {
    if (result.presets.length >= MAX_PER_GROUP) break
    if (matches(q, preset.name) || matches(q, preset.shipId)) {
      result.presets.push({
        type: 'preset',
        id: preset.id,
        name: preset.name,
        preset,
      })
    }
  }

  for (const item of options.equipment) {
    if (result.equipment.length >= MAX_PER_GROUP) break
    if (
      matches(q, item.name) ||
      matches(q, item.id) ||
      matches(q, item.category)
    ) {
      result.equipment.push({
        type: 'equipment',
        id: item.id,
        name: item.name,
        category: item.category,
      })
    }
  }

  for (const [path, label] of Object.entries(ROUTE_LABELS)) {
    if (result.screens.length >= MAX_PER_GROUP) break
    if (matches(q, label)) {
      result.screens.push({ type: 'screen', path, label })
    }
  }

  return result
}
