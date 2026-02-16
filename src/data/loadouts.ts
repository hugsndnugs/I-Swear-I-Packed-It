import type { CrewRole } from './contexts'

export interface LoadoutItem {
  id: string
  label: string
  category: 'medical' | 'survival' | 'tools' | 'ammo' | 'utility'
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
    { id: 'pilot-helmet', label: 'Flight helmet', category: 'survival' },
    {
      id: 'pilot-medpens',
      label: 'CureLife Med-Pen or ParaMed Medical Device (2–3+ per person)',
      category: 'medical'
    },
    { id: 'pilot-multitool', label: 'Multi-tool with TruHold tractor', category: 'tools' },
    { id: 'pilot-ammo', label: 'Ammo and magazines for FPS weapons; match weapon type', category: 'ammo' }
  ],
  gunner: [
    { id: 'gunner-helmet', label: 'Flight helmet', category: 'survival' },
    {
      id: 'gunner-medpens',
      label: 'CureLife Med-Pen or ParaMed Medical Device (2–3+ per person)',
      category: 'medical'
    },
    { id: 'gunner-ammo', label: 'Ammo and magazines for FPS weapons; match weapon type', category: 'ammo' },
    { id: 'gunner-weapons', label: 'Weapons and turret loadout; ammo topped', category: 'tools' }
  ],
  medic: [
    { id: 'medic-helmet', label: 'Flight helmet', category: 'survival' },
    {
      id: 'medic-medgun',
      label: 'Medgun (PyroMed / CureLife) with LifeGuard attachment',
      category: 'medical'
    },
    { id: 'medic-refills', label: 'Medgun refill canisters (2–3+ charges)', category: 'medical' },
    {
      id: 'medic-trauma',
      label: 'Med pens: Hemozal, AdrenaPen, CorticoPen, OpioPen',
      category: 'medical'
    },
    { id: 'medic-multitool', label: 'Greycat Multi-Tool', category: 'tools' }
  ],
  escort: [
    { id: 'escort-helmet', label: 'Flight helmet', category: 'survival' },
    {
      id: 'escort-medpens',
      label: 'CureLife Med-Pen or ParaMed Medical Device (2–3+ per person)',
      category: 'medical'
    },
    { id: 'escort-ammo', label: 'Ammo and magazines for FPS weapons; match weapon type', category: 'ammo' },
    { id: 'escort-weapons', label: 'Weapons, ammo, medpens, helmet; combat loadout', category: 'tools' }
  ],
  loader: [
    { id: 'loader-helmet', label: 'Flight helmet', category: 'survival' },
    {
      id: 'loader-medpens',
      label: 'CureLife Med-Pen or ParaMed Medical Device (2–3+ per person)',
      category: 'medical'
    },
    { id: 'loader-tractor', label: 'Multi-tool with TruHold tractor; ready for cargo', category: 'tools' }
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
