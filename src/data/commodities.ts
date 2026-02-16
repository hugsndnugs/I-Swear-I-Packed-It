/**
 * Commodity types for cargo manifest. Used by the Cargo Manifest Validator.
 */

import { COMMODITIES_GENERATED } from './commodities.generated'

export type CommodityCategory = 'scrap' | 'ore' | 'medical' | 'food' | 'general' | 'high-value'

export interface CommodityType {
  id: string
  label: string
  category: CommodityCategory
  /** SCU per unit (box/crate). Default 1 for backward compatibility. */
  scuPerUnit?: number
}

export const COMMODITY_CATEGORIES: Record<CommodityCategory, string> = {
  scrap: 'Scrap / salvage',
  ore: 'Ore / raw minerals',
  medical: 'Medical supplies',
  food: 'Food / provisions',
  general: 'General cargo',
  'high-value': 'High value'
}

/** Full commodity list from generated data (scripts/fetch-commodities.mjs). */
export const COMMODITIES: CommodityType[] = COMMODITIES_GENERATED

export interface CargoManifestEntry {
  commodityId: string
  label: string
  quantity: number
  unit?: string
}

export function getCommodityById(id: string): CommodityType | undefined {
  return COMMODITIES.find((c) => c.id === id)
}
