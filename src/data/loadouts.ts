import type { CrewRole } from './contexts'
import type { CrewRoleCounts } from '../lib/crewRoleCounts'
import { totalCrew } from '../lib/crewRoleCounts'

export interface LoadoutItem {
  id: string
  label: string
  category: 'medical' | 'survival' | 'tools' | 'ammo' | 'utility'
  /** Groups items across roles for quantity tally (e.g. "helmet"). */
  mergeId?: string
  /** Quantity per person for this role; default 1. */
  quantityPerPerson?: number
}

export interface LoadoutLineWithQuantity {
  id: string
  quantity: number
  label: string
  category: LoadoutItem['category']
}

export const LOADOUT_CATEGORY_LABELS: Record<LoadoutItem['category'], string> = {
  medical: 'Medical',
  survival: 'Survival',
  tools: 'Tools',
  ammo: 'Ammo',
  utility: 'Utility'
}

const loadoutByRole: Record<CrewRole, LoadoutItem[]> = {
  pilot: [
    { id: 'pilot-helmet', label: 'Flight helmet', category: 'survival', mergeId: 'helmet' },
    {
      id: 'pilot-medpens',
      label: 'CureLife Med-Pen or ParaMed Medical Device (2–3+ per person)',
      category: 'medical',
      mergeId: 'medpens',
      quantityPerPerson: 3
    },
    {
      id: 'pilot-multitool',
      label: 'Multi-tool with TruHold tractor',
      category: 'tools',
      mergeId: 'multitool-tractor'
    },
    {
      id: 'pilot-ammo',
      label: 'Ammo and magazines for FPS weapons; match weapon type',
      category: 'ammo',
      mergeId: 'ammo'
    }
  ],
  gunner: [
    { id: 'gunner-helmet', label: 'Flight helmet', category: 'survival', mergeId: 'helmet' },
    {
      id: 'gunner-medpens',
      label: 'CureLife Med-Pen or ParaMed Medical Device (2–3+ per person)',
      category: 'medical',
      mergeId: 'medpens',
      quantityPerPerson: 3
    },
    {
      id: 'gunner-ammo',
      label: 'Ammo and magazines for FPS weapons; match weapon type',
      category: 'ammo',
      mergeId: 'ammo'
    },
    {
      id: 'gunner-weapons',
      label: 'Weapons and turret loadout; ammo topped',
      category: 'tools',
      mergeId: 'gunner-weapons'
    }
  ],
  medic: [
    { id: 'medic-helmet', label: 'Flight helmet', category: 'survival', mergeId: 'helmet' },
    {
      id: 'medic-medgun',
      label: 'Medgun (PyroMed / CureLife) with LifeGuard attachment',
      category: 'medical',
      mergeId: 'medgun'
    },
    {
      id: 'medic-refills',
      label: 'Medgun refill canisters (2–3+ charges)',
      category: 'medical',
      mergeId: 'medgun-refills'
    },
    {
      id: 'medic-trauma',
      label: 'Med pens: Hemozal, AdrenaPen, CorticoPen, OpioPen',
      category: 'medical',
      mergeId: 'trauma-meds'
    },
    {
      id: 'medic-multitool',
      label: 'Greycat Multi-Tool',
      category: 'tools',
      mergeId: 'medic-multitool'
    }
  ],
  escort: [
    { id: 'escort-helmet', label: 'Flight helmet', category: 'survival', mergeId: 'helmet' },
    {
      id: 'escort-medpens',
      label: 'CureLife Med-Pen or ParaMed Medical Device (2–3+ per person)',
      category: 'medical',
      mergeId: 'medpens',
      quantityPerPerson: 3
    },
    {
      id: 'escort-ammo',
      label: 'Ammo and magazines for FPS weapons; match weapon type',
      category: 'ammo',
      mergeId: 'ammo'
    },
    {
      id: 'escort-weapons',
      label: 'Weapons, ammo, medpens, helmet; combat loadout',
      category: 'tools',
      mergeId: 'escort-weapons'
    }
  ],
  loader: [
    { id: 'loader-helmet', label: 'Flight helmet', category: 'survival', mergeId: 'helmet' },
    {
      id: 'loader-medpens',
      label: 'CureLife Med-Pen or ParaMed Medical Device (2–3+ per person)',
      category: 'medical',
      mergeId: 'medpens',
      quantityPerPerson: 3
    },
    {
      id: 'loader-tractor',
      label: 'Multi-tool with TruHold tractor; ready for cargo',
      category: 'tools',
      mergeId: 'multitool-tractor'
    }
  ]
}

export function getLoadoutForRoles(roles: CrewRole[]): LoadoutItem[] {
  const seen = new Set<string>()
  const result: LoadoutItem[] = []
  for (const role of roles) {
    const items = loadoutByRole[role] ?? []
    for (const item of items) {
      if (!seen.has(item.id)) {
        seen.add(item.id)
        result.push(item)
      }
    }
  }
  if (result.length === 0) {
    return loadoutByRole.pilot
  }
  return result
}

function aggregateByMergeId(
  roleCounts: CrewRoleCounts
): Map<string, { label: string; category: LoadoutItem['category']; quantity: number }> {
  const byMergeId = new Map<string, { label: string; category: LoadoutItem['category']; quantity: number }>()
  const roleOrder: CrewRole[] = ['pilot', 'gunner', 'medic', 'escort', 'loader']
  for (const role of roleOrder) {
    const n = roleCounts[role] ?? 0
    if (n <= 0) continue
    const items = loadoutByRole[role] ?? []
    for (const item of items) {
      const key = item.mergeId ?? item.id
      const qty = n * (item.quantityPerPerson ?? 1)
      const existing = byMergeId.get(key)
      if (existing) existing.quantity += qty
      else byMergeId.set(key, { label: item.label, category: item.category, quantity: qty })
    }
  }
  return byMergeId
}

/** Quantity-aware pack list: merge by mergeId and sum (role count × quantityPerPerson). */
export function getLoadoutWithQuantities(roleCounts: CrewRoleCounts): LoadoutLineWithQuantity[] {
  const total = totalCrew(roleCounts)
  const counts = total === 0 ? ({ pilot: 1, gunner: 0, medic: 0, escort: 0, loader: 0 } as CrewRoleCounts) : roleCounts
  const byMergeId = aggregateByMergeId(counts)
  const order: (keyof typeof LOADOUT_CATEGORY_LABELS)[] = ['medical', 'survival', 'tools', 'ammo', 'utility']
  const result: LoadoutLineWithQuantity[] = []
  for (const cat of order) {
    for (const [id, entry] of byMergeId) {
      if (entry.category === cat) result.push({ id, quantity: entry.quantity, label: entry.label, category: cat })
    }
  }
  if (result.length === 0) {
    return getLoadoutWithQuantities({ pilot: 1, gunner: 0, medic: 0, escort: 0, loader: 0 } as CrewRoleCounts)
  }
  return result
}
