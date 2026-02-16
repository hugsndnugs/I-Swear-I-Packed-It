import type { CrewRole } from '../data/contexts'
import { CREW_ROLES } from '../data/contexts'

export type CrewRoleCounts = Record<CrewRole, number>

const ALL_ROLES: CrewRole[] = CREW_ROLES.map((r) => r.id)

/** Default crew: one pilot, others zero. */
export const DEFAULT_CREW_ROLE_COUNTS: CrewRoleCounts = Object.fromEntries(
  ALL_ROLES.map((r) => [r, r === 'pilot' ? 1 : 0])
) as CrewRoleCounts

/** Total number of crew (sum of all role counts). */
export function totalCrew(counts: CrewRoleCounts): number {
  return ALL_ROLES.reduce((sum, role) => sum + counts[role], 0)
}

/** Roles that have count >= 1 (for checklist generation). */
export function roleCountsToRoles(counts: CrewRoleCounts): CrewRole[] {
  return ALL_ROLES.filter((role) => (counts[role] ?? 0) >= 1)
}

/** Convert legacy crewRoles array to role counts (counts occurrences). */
export function rolesToRoleCounts(roles: CrewRole[]): CrewRoleCounts {
  const counts = Object.fromEntries(ALL_ROLES.map((r) => [r, 0])) as CrewRoleCounts
  for (const r of roles) {
    if (ALL_ROLES.includes(r)) counts[r] = (counts[r] ?? 0) + 1
  }
  return counts
}

/** Normalize unknown payload: accept crewRoleCounts (new) or crewRoles + crewCount (legacy). */
export function normalizeToCrewRoleCounts(payload: {
  crewRoleCounts?: CrewRoleCounts
  crewRoles?: CrewRole[]
  crewCount?: number
}): CrewRoleCounts {
  if (payload.crewRoleCounts && isCrewRoleCounts(payload.crewRoleCounts)) {
    return { ...payload.crewRoleCounts }
  }
  if (Array.isArray(payload.crewRoles) && payload.crewRoles.length > 0) {
    return rolesToRoleCounts(payload.crewRoles)
  }
  const count = typeof payload.crewCount === 'number' && payload.crewCount >= 1 ? payload.crewCount : 1
  const pilotOnly: CrewRoleCounts = { ...DEFAULT_CREW_ROLE_COUNTS }
  for (const r of ALL_ROLES) pilotOnly[r] = r === 'pilot' ? count : 0
  return pilotOnly
}

function isCrewRoleCounts(v: unknown): v is CrewRoleCounts {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  for (const role of ALL_ROLES) {
    const n = o[role]
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 0) return false
  }
  return true
}

export function isCrewRoleCountsExport(v: unknown): v is CrewRoleCounts {
  return isCrewRoleCounts(v)
}
