import type { Location } from 'react-router-dom'
import type {
  GeneratorLocationState,
  ChecklistLocationState,
  PackListLocationState
} from '../types/navigation'

/**
 * Type-safe helper to extract and validate location.state.
 * Returns null if state is invalid or missing.
 */
export function getGeneratorState(
  location: Location
): GeneratorLocationState | null {
  const state = location.state as GeneratorLocationState | null | undefined
  if (!state || typeof state !== 'object') return null
  return state
}

/**
 * Type-safe helper to extract and validate Checklist location.state.
 * Returns null if state is invalid or missing.
 */
export function getChecklistState(
  location: Location
): ChecklistLocationState | null {
  const state = location.state as ChecklistLocationState | null | undefined
  if (!state || typeof state !== 'object') return null
  return state
}

/**
 * Type-safe helper to extract and validate PackList location.state.
 * Returns null if state is invalid or missing.
 */
export function getPackListState(
  location: Location
): PackListLocationState | null {
  const state = location.state as PackListLocationState | null | undefined
  if (!state || typeof state !== 'object') return null
  return state
}

/**
 * Type guard to check if state has required Generator fields.
 */
export function isValidGeneratorState(
  state: unknown
): state is GeneratorLocationState {
  if (!state || typeof state !== 'object') return false
  return true // Basic validation - can be extended with stricter checks
}

/**
 * Type guard to check if state has required Checklist fields.
 */
export function isValidChecklistState(
  state: unknown
): state is ChecklistLocationState {
  if (!state || typeof state !== 'object') return false
  const s = state as ChecklistLocationState
  // Checklist state should have checklist or shipId/operationType
  return !!(s.checklist || (s.shipId && s.operationType))
}
