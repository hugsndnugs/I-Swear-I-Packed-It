/**
 * Commodity types for cargo manifest. Used by the Cargo Manifest Validator.
 */

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

export const COMMODITIES: CommodityType[] = [
  { id: 'scrap-metal', label: 'Scrap metal', category: 'scrap', scuPerUnit: 1 },
  { id: 'recyclables', label: 'Recyclables', category: 'scrap', scuPerUnit: 1 },
  { id: 'construction-materials', label: 'Construction materials', category: 'scrap', scuPerUnit: 1 },
  { id: 'agricium', label: 'Agricium', category: 'ore', scuPerUnit: 1 },
  { id: 'laranite', label: 'Laranite', category: 'ore', scuPerUnit: 1 },
  { id: 'titanium', label: 'Titanium', category: 'ore', scuPerUnit: 1 },
  { id: 'quantanium', label: 'Quantanium', category: 'ore', scuPerUnit: 1 },
  { id: 'medical-supplies', label: 'Medical supplies', category: 'medical', scuPerUnit: 1 },
  { id: 'stims', label: 'Stims / medpens', category: 'medical', scuPerUnit: 1 },
  { id: 'food-crates', label: 'Food crates', category: 'food', scuPerUnit: 1 },
  { id: 'water', label: 'Water', category: 'food', scuPerUnit: 1 },
  { id: 'general-cargo', label: 'General cargo', category: 'general', scuPerUnit: 1 },
  { id: 'consumer-goods', label: 'Consumer goods', category: 'general', scuPerUnit: 1 },
  { id: 'waste', label: 'Waste', category: 'general', scuPerUnit: 1 },
  { id: 'refined-commodities', label: 'Refined commodities', category: 'high-value', scuPerUnit: 1 },
  { id: 'processed-goods', label: 'Processed goods', category: 'high-value', scuPerUnit: 1 }
]

export interface CargoManifestEntry {
  commodityId: string
  label: string
  quantity: number
  unit?: string
}

export function getCommodityById(id: string): CommodityType | undefined {
  return COMMODITIES.find((c) => c.id === id)
}
