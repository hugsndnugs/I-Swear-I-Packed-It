import type { ShipProfile } from '../data/shipTypes'
import type { CargoManifestEntry } from '../data/commodities'
import { getCommodityById } from '../data/commodities'
import { getRouteById } from '../data/routes'

export interface ManifestValidationReport {
  requiredTools: string[]
  suggestedBackup: string[]
  warnings: string[]
  risks: string[]
  /** Total SCU used by cargo (for capacity summary). */
  totalScuUsed?: number
  /** Ship cargo capacity SCU (for capacity summary). */
  shipCargoScu?: number
}

/**
 * Validates a cargo manifest for a ship and optional route.
 * Returns required tools, suggested backup gear, capacity note, and risk prompts.
 */
export function validateManifest(
  ship: ShipProfile,
  routeId: string | null,
  entries: CargoManifestEntry[]
): ManifestValidationReport {
  const requiredTools: string[] = []
  const suggestedBackup: string[] = []
  const warnings: string[] = []
  const risks: string[] = []

  const hasCargo = ship.roles.includes('cargo')
  const isMultiCrew = ship.roles.includes('multi-crew')
  const route = routeId ? getRouteById(routeId) : null

  // Required tools
  if (hasCargo && entries.length > 0) {
    requiredTools.push('Tractor beam')
    requiredTools.push('Multi-tool')
  }
  if (ship.roles.includes('mining')) {
    requiredTools.push('Mining tool / attachment')
  }
  if (ship.roles.includes('medical')) {
    requiredTools.push('Medgun')
  }

  // Suggested backup
  suggestedBackup.push('Spare undersuit')
  if (hasCargo) {
    suggestedBackup.push('Spare tractor attachment')
  }
  if (route?.longHaul) {
    suggestedBackup.push('Extra medpens')
    suggestedBackup.push('Food / water')
  }

  // Capacity validation (real SCU per commodity)
  const totalScuUsed =
    entries.length > 0
      ? entries.reduce((sum, e) => {
          const commodity = getCommodityById(e.commodityId)
          const scuPerUnit = commodity?.scuPerUnit ?? 1
          return sum + e.quantity * scuPerUnit
        }, 0)
      : undefined
  if (ship.cargoScu != null && totalScuUsed != null && totalScuUsed > ship.cargoScu) {
    warnings.push(
      `Manifest total (${Math.ceil(totalScuUsed)} SCU) exceeds ship capacity (${ship.cargoScu} SCU). Verify load.`
    )
  }

  // High-value cargo
  const hasHighValueCargo = entries.some((e) => {
    const c = getCommodityById(e.commodityId)
    return c?.category === 'high-value'
  })
  if (hasHighValueCargo || route?.highValue) {
    risks.push('Escort recommended for high-value run.')
  }

  // Multi-crew ship with no crew context (we don't have crew count here; keep simple)
  if (isMultiCrew && ship.crewMax != null && ship.crewMax > 1) {
    risks.push('Multi-crew ship: confirm crew roles and loadout before departure.')
  }

  // Medical cargo without medical role
  const hasMedicalCargo = entries.some((e) => {
    const c = getCommodityById(e.commodityId)
    return c?.category === 'medical'
  })
  if (hasMedicalCargo && !ship.roles.includes('medical')) {
    warnings.push('Medical cargo loaded; consider bringing medgun and refills.')
  }

  return {
    requiredTools: [...new Set(requiredTools)],
    suggestedBackup: [...new Set(suggestedBackup)],
    warnings,
    risks,
    ...(totalScuUsed != null && entries.length > 0 && { totalScuUsed }),
    ...(ship.cargoScu != null && { shipCargoScu: ship.cargoScu }),
  }
}
