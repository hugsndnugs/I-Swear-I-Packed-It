import { OPERATION_TYPES, CREW_ROLES } from '../data/contexts'
import type { OperationType, CrewRole } from '../data/contexts'
import { isCrewRoleCountsExport, type CrewRoleCounts } from './crewRoleCounts'

/** Payload for sharing a preset via link or code (no id/createdAt). */
export interface SharedPresetPayload {
  shipId: string
  operationType: OperationType
  crewCount?: number
  crewRoles?: CrewRole[]
  crewRoleCounts?: CrewRoleCounts
  name?: string
}

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

function isValidPayload(o: unknown): o is SharedPresetPayload {
  if (!o || typeof o !== 'object') return false
  const r = o as Record<string, unknown>
  const hasCrewRoleCounts = isCrewRoleCountsExport(r.crewRoleCounts)
  const hasLegacyCrew =
    typeof r.crewCount === 'number' &&
    Number.isInteger(r.crewCount) &&
    r.crewCount >= 1 &&
    isCrewRoles(r.crewRoles)
  return (
    typeof r.shipId === 'string' &&
    isOperationType(r.operationType) &&
    (hasCrewRoleCounts || hasLegacyCrew) &&
    (r.name === undefined || typeof r.name === 'string')
  )
}

/** Encode payload to a base64url string for URL or copy-as-code. */
export function encodePreset(payload: SharedPresetPayload): string {
  const json = JSON.stringify(payload)
  const base64 = btoa(unescape(encodeURIComponent(json)))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Maximum length for preset code/URL param to avoid client-side DoS (8 KB). */
export const PRESET_DECODE_MAX_LENGTH = 8192

/** Decode a base64url string to payload, or null if invalid. */
export function decodePreset(encoded: string): SharedPresetPayload | null {
  if (encoded.length > PRESET_DECODE_MAX_LENGTH) return null
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const json = decodeURIComponent(escape(atob(padded)))
    const parsed = JSON.parse(json) as unknown
    return isValidPayload(parsed) ? parsed : null
  } catch {
    return null
  }
}

/** Get shared preset from URL search params (?preset=...). */
export function getPresetFromSearchParams(searchParams: URLSearchParams): SharedPresetPayload | null {
  const preset = searchParams.get('preset')
  if (!preset?.trim()) return null
  return decodePreset(preset.trim())
}

/** Build a shareable URL with preset encoded in query. */
export function buildShareableUrl(payload: SharedPresetPayload, baseUrl?: string): string {
  const base = baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : '')
  const root = base.replace(/\/$/, '')
  return `${root}/generate?preset=${encodePreset(payload)}`
}
