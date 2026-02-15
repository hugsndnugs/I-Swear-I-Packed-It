import type { ShipProfile } from '../data/shipTypes'
import type { OperationType, CrewRole } from '../data/contexts'

export interface ContextWarningsResult {
  warnings: string[]
  alerts: string[]
}

/**
 * Returns context-based warnings (yellow) and alerts (red/critical)
 * for the given ship, operation type, crew count, and crew roles.
 */
export function getContextWarnings(
  ship: ShipProfile,
  operationType: OperationType,
  crewCount: number,
  crewRoles: CrewRole[]
): ContextWarningsResult {
  const warnings: string[] = []
  const alerts: string[] = []

  const isMultiCrew = ship.roles.includes('multi-crew')
  const hasMedic = crewRoles.includes('medic')

  // Multi-crew ship + solo crew → warning
  if (isMultiCrew && crewCount === 1) {
    warnings.push('Multi-crew ship with solo crew. Consider bringing crew or confirm you can operate alone.')
  }

  // Medical op + no medic role → red alert
  if (operationType === 'medical-rescue' && !hasMedic) {
    alerts.push('Medical rescue op: medgun and medical tasks expected but no Medic role selected. Add Medic or confirm loadout.')
  }

  // Long-haul cargo run → suggest food/water (operation-based; no route on Generator yet)
  if (operationType === 'cargo-run' && ship.roles.includes('cargo')) {
    warnings.push('Long cargo runs: consider extra medpens and food/water.')
  }

  return { warnings, alerts }
}
