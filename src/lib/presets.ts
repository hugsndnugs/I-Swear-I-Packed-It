import {
  type OperationType,
  type CrewRole,
  OPERATION_TYPES,
  CREW_ROLES
} from '../data/contexts'
import { setStorageError } from './storageError'

export interface PresetConfig {
  id: string
  name: string
  shipId: string
  operationType: OperationType
  crewCount: number
  crewRoles: CrewRole[]
  createdAt: number
}

const PRESETS_KEY = 'preflight-presets'
const LAST_RUN_KEY = 'preflight-last-run'

const VALID_OPERATIONS = new Set(OPERATION_TYPES.map((o) => o.id))
const VALID_ROLES = new Set(CREW_ROLES.map((r) => r.id))

function isOperationType(v: unknown): v is OperationType {
  return typeof v === 'string' && VALID_OPERATIONS.has(v as OperationType)
}

function isCrewRole(v: unknown): v is CrewRole {
  return typeof v === 'string' && VALID_ROLES.has(v as CrewRole)
}

function isCrewRoles(v: unknown): v is CrewRole[] {
  return Array.isArray(v) && v.every(isCrewRole)
}

function isValidPreset(item: unknown): item is PresetConfig {
  if (!item || typeof item !== 'object') return false
  const o = item as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    typeof o.shipId === 'string' &&
    isOperationType(o.operationType) &&
    typeof o.crewCount === 'number' &&
    Number.isInteger(o.crewCount) &&
    o.crewCount >= 1 &&
    isCrewRoles(o.crewRoles) &&
    typeof o.createdAt === 'number'
  )
}

export function loadPresets(): PresetConfig[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidPreset)
  } catch {
    return []
  }
}

export function savePreset(preset: Omit<PresetConfig, 'id' | 'createdAt'>): PresetConfig {
  const presets = loadPresets()
  const full: PresetConfig = {
    ...preset,
    id: `preset-${Date.now()}`,
    createdAt: Date.now()
  }
  presets.push(full)
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets))
    setStorageError(null)
  } catch {
    setStorageError('Could not save; check storage or use in normal browsing mode.')
  }
  return full
}

export function deletePreset(id: string): void {
  const presets = loadPresets().filter((p) => p.id !== id)
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets))
    setStorageError(null)
  } catch {
    setStorageError('Could not save; check storage or use in normal browsing mode.')
  }
}

export interface LastRunConfig {
  shipId: string
  operationType: OperationType
  crewCount: number
  crewRoles: CrewRole[]
}

function isValidLastRun(v: unknown): v is LastRunConfig {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return (
    typeof o.shipId === 'string' &&
    isOperationType(o.operationType) &&
    typeof o.crewCount === 'number' &&
    Number.isInteger(o.crewCount) &&
    o.crewCount >= 1 &&
    isCrewRoles(o.crewRoles)
  )
}

export function loadLastRun(): LastRunConfig | null {
  try {
    const raw = localStorage.getItem(LAST_RUN_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    return isValidLastRun(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveLastRun(config: LastRunConfig): void {
  try {
    localStorage.setItem(LAST_RUN_KEY, JSON.stringify(config))
    setStorageError(null)
  } catch {
    setStorageError('Could not save; check storage or use in normal browsing mode.')
  }
}

const CHECKLIST_PROGRESS_KEY = 'preflight-checklist-progress'

export interface ChecklistProgress {
  shipId: string
  operationType: OperationType
  crewRoles: CrewRole[]
  completedIds: string[]
}

export function checklistProgressMatches(
  progress: { shipId: string; operationType: OperationType; crewRoles: CrewRole[] },
  context: { shipId: string; operationType: OperationType; crewRoles: CrewRole[] }
): boolean {
  if (progress.shipId !== context.shipId || progress.operationType !== context.operationType)
    return false
  if (progress.crewRoles.length !== context.crewRoles.length) return false
  const sortedA = [...progress.crewRoles].sort()
  const sortedB = [...context.crewRoles].sort()
  return sortedA.every((r, i) => r === sortedB[i])
}

function isValidChecklistProgress(v: unknown): v is ChecklistProgress {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return (
    typeof o.shipId === 'string' &&
    isOperationType(o.operationType) &&
    isCrewRoles(o.crewRoles) &&
    Array.isArray(o.completedIds) &&
    (o.completedIds as unknown[]).every((id) => typeof id === 'string')
  )
}

export function loadChecklistProgress(): ChecklistProgress | null {
  try {
    const raw = localStorage.getItem(CHECKLIST_PROGRESS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    return isValidChecklistProgress(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveChecklistProgress(data: ChecklistProgress): void {
  try {
    localStorage.setItem(CHECKLIST_PROGRESS_KEY, JSON.stringify(data))
    setStorageError(null)
  } catch {
    setStorageError('Could not save; check storage or use in normal browsing mode.')
  }
}

const LAST_MANIFEST_KEY = 'preflight-last-manifest'

export interface LastManifestConfig {
  shipId: string
  routeId: string | null
  entries: Array<{ commodityId: string; label: string; quantity: number; unit?: string }>
}

function isValidLastManifest(v: unknown): v is LastManifestConfig {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  if (typeof o.shipId !== 'string') return false
  if (o.routeId !== null && typeof o.routeId !== 'string') return false
  if (!Array.isArray(o.entries)) return false
  return (o.entries as unknown[]).every((e) => {
    if (!e || typeof e !== 'object') return false
    const ent = e as Record<string, unknown>
    return (
      typeof ent.commodityId === 'string' &&
      typeof ent.label === 'string' &&
      typeof ent.quantity === 'number'
    )
  })
}

export function loadLastManifest(): LastManifestConfig | null {
  try {
    const raw = localStorage.getItem(LAST_MANIFEST_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    return isValidLastManifest(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveLastManifest(config: LastManifestConfig): void {
  try {
    localStorage.setItem(LAST_MANIFEST_KEY, JSON.stringify(config))
    setStorageError(null)
  } catch {
    setStorageError('Could not save; check storage or use in normal browsing mode.')
  }
}
