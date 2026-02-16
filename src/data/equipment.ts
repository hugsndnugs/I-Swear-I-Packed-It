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
  /** Short in-world or gameplay clarification. Optional. */
  description?: string
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

/** Human-readable labels for subcategories. */
export const SUB_CATEGORY_LABELS: Record<string, string> = {
  'multi-tool-attachment': 'Multi-tool attachment',
  medpen: 'Med pen',
  diagnostic: 'Diagnostic',
  revive: 'Revive',
  gadget: 'Gadget',
}

/** Star Citizen equipment catalog (multi-tool attachments, medical, survival, gadgets). */
export const equipmentCatalog: EquipmentItem[] = [
  // Multi-tool attachments (Greycat)
  {
    id: 'orebit-mining',
    name: 'OreBit Mining Attachment',
    category: 'tools',
    description: 'Attaches to Greycat Multi-Tool for mining ore and gem deposits.',
    taskIds: ['mining-tool'],
  },
  {
    id: 'oxytorch-cutter',
    name: 'OxyTorch Cutter Attachment',
    category: 'tools',
    description: 'Multi-tool attachment for cutting and salvage operations.',
    taskIds: ['salvage-tool'],
  },
  {
    id: 'truhold-tractor',
    name: 'TruHold Tractor Beam Attachment',
    category: 'tools',
    description: 'Attaches to Greycat Multi-Tool for moving cargo crates (1–32 SCU) and boxes.',
    taskIds: ['multitool-tractor', 'tractor-ready', 'loader-tractor'],
  },
  {
    id: 'lifeguard-medical',
    name: 'LifeGuard Medical Attachment',
    category: 'medical',
    description: 'Multi-tool attachment for field healing. Medic role.',
    roles: ['medic'],
    taskIds: ['medgun'],
  },
  {
    id: 'cambio-lite-srt',
    name: 'Cambio-Lite SRT Attachment',
    category: 'tools',
    description: 'Specialized multi-tool attachment for repair and salvage.',
    taskIds: ['salvage-tool'],
  },
  // Medical
  {
    id: 'medpen',
    name: 'CureLife Med-Pen',
    category: 'medical',
    description: 'Single-use quick heal. Essential for every crew member.',
    taskIds: ['medpens'],
  },
  {
    id: 'dynapak',
    name: 'ParaMed Medical Device',
    category: 'medical',
    description: 'Handheld device for sustained healing in the field; alternative to Med-Pen.',
    taskIds: ['medpens'],
  },
  {
    id: 'hemozal',
    name: 'MedPen (Hemozal)',
    category: 'medical',
    description: 'Health, stops bleeding, recovers from incapacitated. One of four trauma med pens.',
    taskIds: ['trauma-meds'],
  },
  {
    id: 'adrenapen',
    name: 'AdrenaPen (Demexatrine)',
    category: 'medical',
    description: 'Reduces concussion symptoms, normalizes weapon handling and movement speed.',
    taskIds: ['trauma-meds'],
  },
  {
    id: 'corticopen',
    name: 'CorticoPen (Sterogen)',
    category: 'medical',
    description: 'Reduces vision and hearing symptoms, normalizes stamina.',
    taskIds: ['trauma-meds'],
  },
  {
    id: 'opiopen',
    name: 'OpioPen (Roxaphen)',
    category: 'medical',
    description: 'Reduces pain symptoms, normalizes movement ability.',
    taskIds: ['trauma-meds'],
  },
  {
    id: 'paramed-device',
    name: 'ParaMed Medical Device (diagnostic)',
    category: 'medical',
    description: 'Handheld diagnostic tool for reading patient vitals.',
    taskIds: ['medgun'],
  },
  {
    id: 'medgun',
    name: 'Medgun (PyroMed / CureLife)',
    category: 'medical',
    description: 'Handheld healing device; use with LifeGuard attachment for field healing. Medic role.',
    roles: ['medic'],
    taskIds: ['medgun'],
  },
  {
    id: 'medgun-refills',
    name: 'Medgun refill canisters',
    category: 'medical',
    description: 'Ammo canisters for medgun healing charges. Bring 2–3+ charges. Medic role.',
    roles: ['medic'],
    taskIds: ['refills'],
  },
  // Survival
  {
    id: 'helmet',
    name: 'Flight helmet',
    category: 'survival',
    description: 'Standard EVA/flight helmet; required for life support in vacuum.',
    taskIds: ['helmet'],
  },
  {
    id: 'spare-undersuit',
    name: 'Spare undersuit',
    category: 'survival',
    description: 'Backup EVA undersuit in case of damage or loss.',
  },
  // Tools (general)
  {
    id: 'personal-multitool',
    name: 'Greycat Personal Multi-Tool',
    category: 'tools',
    description: 'Base multi-tool; use with tractor, mining, or cutting attachments.',
    taskIds: ['multitool-tractor'],
  },
  // Gadgets (utility)
  {
    id: 'xdl-rangefinder',
    name: 'XDL Monocular Rangefinder',
    category: 'utility',
    description: 'Rangefinding monocular for distance and targeting.',
    taskIds: ['Gadget'],
  },
  // Ammo
  {
    id: 'ammo-magazines',
    name: 'Ammo and magazines',
    category: 'ammo',
    description: 'FPS weapon magazines; match weapon type. Ship weapon ammo as needed.',
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
