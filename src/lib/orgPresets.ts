import type { OperationType } from '../data/contexts'
import type { CrewRoleCounts } from './crewRoleCounts'
import { setStorageError } from './storageError'

const ORG_PRESETS_KEY = 'preflight-org-presets'
const MAX_ORG_PRESETS = 50

export interface OrgPreset {
  id: string
  name: string
  shipId: string
  operationType: OperationType
  crewRoleCounts: CrewRoleCounts
  locationId?: string
  role?: string // Role-based preset (e.g., 'pilot', 'medic', 'gunner')
  createdAt: number
  updatedAt: number
}

function isValidOrgPreset(v: unknown): v is OrgPreset {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    typeof o.shipId === 'string' &&
    typeof o.operationType === 'string' &&
    typeof o.crewRoleCounts === 'object' &&
    typeof o.createdAt === 'number' &&
    typeof o.updatedAt === 'number' &&
    (o.locationId === undefined || typeof o.locationId === 'string') &&
    (o.role === undefined || typeof o.role === 'string')
  )
}

export function loadOrgPresets(): OrgPreset[] {
  try {
    const raw = localStorage.getItem(ORG_PRESETS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidOrgPreset)
  } catch {
    return []
  }
}

function saveOrgPresets(presets: OrgPreset[]): void {
  try {
    localStorage.setItem(ORG_PRESETS_KEY, JSON.stringify(presets))
    setStorageError(null)
  } catch {
    setStorageError('Could not save org presets; check storage or use in normal browsing mode.')
  }
}

export function saveOrgPreset(
  preset: Omit<OrgPreset, 'id' | 'createdAt' | 'updatedAt'>
): OrgPreset {
  const presets = loadOrgPresets()
  const now = Date.now()
  const newPreset: OrgPreset = {
    ...preset,
    id: `org-${now}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: now,
    updatedAt: now
  }
  presets.push(newPreset)
  if (presets.length > MAX_ORG_PRESETS) {
    presets.splice(0, presets.length - MAX_ORG_PRESETS)
  }
  saveOrgPresets(presets)
  return newPreset
}

export function updateOrgPreset(id: string, updates: Partial<Omit<OrgPreset, 'id' | 'createdAt'>>): OrgPreset | null {
  const presets = loadOrgPresets()
  const index = presets.findIndex((p) => p.id === id)
  if (index === -1) return null
  presets[index] = {
    ...presets[index],
    ...updates,
    updatedAt: Date.now()
  }
  saveOrgPresets(presets)
  return presets[index]
}

export function deleteOrgPreset(id: string): boolean {
  const presets = loadOrgPresets()
  const filtered = presets.filter((p) => p.id !== id)
  if (filtered.length === presets.length) return false
  saveOrgPresets(filtered)
  return true
}

export function getOrgPresetsByRole(role?: string): OrgPreset[] {
  const presets = loadOrgPresets()
  if (!role) return presets
  return presets.filter((p) => p.role === role)
}

export function getOrgPresetsByOperation(operationType: OperationType): OrgPreset[] {
  const presets = loadOrgPresets()
  return presets.filter((p) => p.operationType === operationType)
}
