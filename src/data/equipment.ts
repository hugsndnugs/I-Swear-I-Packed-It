import type { CrewRole } from './contexts'

export type EquipmentCategory =
  | 'medical'
  | 'survival'
  | 'tools'
  | 'ammo'
  | 'utility'
  | 'weapon'
  | 'armor'

export interface EquipmentItem {
  id: string
  name: string
  category: EquipmentCategory
  subCategory?: string
  roles?: CrewRole[]
  taskIds?: string[]
}

export const EQUIPMENT_CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  medical: 'Medical',
  survival: 'Survival',
  tools: 'Tools',
  ammo: 'Ammo',
  utility: 'Utility',
  weapon: 'Weapon',
  armor: 'Armor',
}

/** Canonical equipment catalog (multi-tool attachments, medical, gadgets). */
export const equipmentCatalog: EquipmentItem[] = [
  // Multi-tool attachments (Greycat)
  {
    id: 'orebit-mining',
    name: 'OreBit Mining Attachment',
    category: 'tools',
    subCategory: 'multi-tool-attachment',
    taskIds: ['mining-tool'],
  },
  {
    id: 'oxytorch-cutter',
    name: 'OxyTorch Cutter Attachment',
    category: 'tools',
    subCategory: 'multi-tool-attachment',
  },
  {
    id: 'truhold-tractor',
    name: 'TruHold Tractor Beam Attachment',
    category: 'tools',
    subCategory: 'multi-tool-attachment',
    taskIds: ['multitool-tractor', 'tractor-ready', 'loader-tractor'],
  },
  {
    id: 'lifeguard-medical',
    name: 'LifeGuard Medical Attachment',
    category: 'medical',
    subCategory: 'multi-tool-attachment',
    roles: ['medic'],
    taskIds: ['medgun'],
  },
  {
    id: 'cambio-lite-srt',
    name: 'Cambio-Lite SRT Attachment',
    category: 'tools',
    subCategory: 'multi-tool-attachment',
  },
  // Medical
  {
    id: 'medpen',
    name: 'CureLife Med-Pen',
    category: 'medical',
    subCategory: 'medpen',
    taskIds: ['medpens'],
  },
  {
    id: 'dynapak',
    name: 'CureLife DYNAPAK',
    category: 'medical',
    subCategory: 'medpen',
    taskIds: ['medpens'],
  },
  {
    id: 'hemozal',
    name: 'Hemozal',
    category: 'medical',
    subCategory: 'revive',
  },
  {
    id: 'paramed-device',
    name: 'ParaMed Medical Device',
    category: 'medical',
    subCategory: 'diagnostic',
  },
  {
    id: 'medgun',
    name: 'Medgun',
    category: 'medical',
    roles: ['medic'],
    taskIds: ['medgun'],
  },
  {
    id: 'medgun-refills',
    name: 'Medgun refills',
    category: 'medical',
    roles: ['medic'],
    taskIds: ['refills'],
  },
  {
    id: 'trauma-meds',
    name: 'Trauma meds',
    category: 'medical',
    roles: ['medic'],
    taskIds: ['trauma-meds'],
  },
  {
    id: 'extraction-tools',
    name: 'Extraction tools',
    category: 'medical',
    roles: ['medic'],
    taskIds: ['extraction-tools'],
  },
  // Survival
  {
    id: 'helmet',
    name: 'Helmet',
    category: 'survival',
    taskIds: ['helmet'],
  },
  {
    id: 'spare-undersuit',
    name: 'Spare undersuit',
    category: 'survival',
    taskIds: ['spare-undersuit'],
  },
  // Tools (general)
  {
    id: 'personal-multitool',
    name: 'Greycat Personal Multi-Tool',
    category: 'tools',
    taskIds: ['multitool-tractor'],
  },
  {
    id: 'industrial-cutting-tool',
    name: 'Industrial Cutting Tool',
    category: 'tools',
    subCategory: 'gadget',
  },
  // Gadgets (utility)
  {
    id: 'door-breach-charge',
    name: 'Door Breach Charge',
    category: 'utility',
    subCategory: 'gadget',
  },
  {
    id: 'doubletime-hologram',
    name: 'Doubletime Personal Hologram',
    category: 'utility',
    subCategory: 'gadget',
  },
  {
    id: 'qdb-12-shield',
    name: 'QDB-12 QuiKCade',
    category: 'utility',
    subCategory: 'gadget',
  },
  {
    id: 'pk-1-sweeper',
    name: 'PK-1 Sweeper',
    category: 'utility',
    subCategory: 'gadget',
  },
  {
    id: 'xdl-rangefinder',
    name: 'XDL Monocular Rangefinder',
    category: 'utility',
    subCategory: 'gadget',
  },
  // Ammo
  {
    id: 'ammo-magazines',
    name: 'Ammo / magazines',
    category: 'ammo',
    taskIds: ['ammo'],
  },
]

const EQUIPMENT_ORDER: EquipmentCategory[] = [
  'medical',
  'survival',
  'tools',
  'ammo',
  'utility',
  'weapon',
  'armor',
]

/** Return equipment grouped by category in display order. */
export function getEquipmentByCategory(): Map<EquipmentCategory, EquipmentItem[]> {
  const map = new Map<EquipmentCategory, EquipmentItem[]>()
  for (const item of equipmentCatalog) {
    const list = map.get(item.category) ?? []
    list.push(item)
    map.set(item.category, list)
  }
  return map
}

/** Return equipment in display order (by category then name). */
export function getEquipmentSorted(): EquipmentItem[] {
  const byCategory = getEquipmentByCategory()
  const result: EquipmentItem[] = []
  for (const cat of EQUIPMENT_ORDER) {
    const items = byCategory.get(cat) ?? []
    result.push(...[...items].sort((a, b) => a.name.localeCompare(b.name)))
  }
  return result
}
