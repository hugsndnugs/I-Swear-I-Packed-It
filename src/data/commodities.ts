/**
 * Commodity types for cargo manifest. Used by the Cargo Manifest Validator.
 */

export type CommodityCategory = 'scrap' | 'ore' | 'medical' | 'food' | 'general' | 'high-value'

export interface CommodityType {
  id: string
  label: string
  category: CommodityCategory
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
  { id: 'scrap-metal', label: 'Scrap metal', category: 'scrap' },
  { id: 'recyclables', label: 'Recyclables', category: 'scrap' },
  { id: 'construction-materials', label: 'Construction materials', category: 'scrap' },
  { id: 'agricium', label: 'Agricium', category: 'ore' },
  { id: 'laranite', label: 'Laranite', category: 'ore' },
  { id: 'titanium', label: 'Titanium', category: 'ore' },
  { id: 'quantanium', label: 'Quantanium', category: 'ore' },
  { id: 'medical-supplies', label: 'Medical supplies', category: 'medical' },
  { id: 'stims', label: 'Stims / medpens', category: 'medical' },
  { id: 'food-crates', label: 'Food crates', category: 'food' },
  { id: 'water', label: 'Water', category: 'food' },
  { id: 'general-cargo', label: 'General cargo', category: 'general' },
  { id: 'consumer-goods', label: 'Consumer goods', category: 'general' },
  { id: 'waste', label: 'Waste', category: 'general' },
  { id: 'refined-commodities', label: 'Refined commodities', category: 'high-value' },
  { id: 'processed-goods', label: 'Processed goods', category: 'high-value' }
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
