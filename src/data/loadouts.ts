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
    { id: 'pilot-helmet', label: 'Helmet', category: 'survival' },
    { id: 'pilot-medpens', label: 'Medpens / basic meds', category: 'medical' },
    { id: 'pilot-multitool', label: 'Multi-tool + tractor', category: 'tools' },
    { id: 'pilot-ammo', label: 'Ammo / magazines', category: 'ammo' }
  ],
  gunner: [
    { id: 'gunner-helmet', label: 'Helmet', category: 'survival' },
    { id: 'gunner-medpens', label: 'Medpens', category: 'medical' },
    { id: 'gunner-ammo', label: 'Ammo / magazines', category: 'ammo' },
    { id: 'gunner-weapons', label: 'Weapons / sidearm', category: 'tools' }
  ],
  medic: [
    { id: 'medic-helmet', label: 'Helmet', category: 'survival' },
    { id: 'medic-medgun', label: 'Medgun', category: 'medical' },
    { id: 'medic-refills', label: 'Refills', category: 'medical' },
    { id: 'medic-trauma', label: 'Trauma meds', category: 'medical' },
    { id: 'medic-extraction', label: 'Extraction tools', category: 'medical' },
    { id: 'medic-multitool', label: 'Multi-tool', category: 'tools' }
  ],
  escort: [
    { id: 'escort-helmet', label: 'Helmet', category: 'survival' },
    { id: 'escort-medpens', label: 'Medpens', category: 'medical' },
    { id: 'escort-ammo', label: 'Ammo / magazines', category: 'ammo' },
    { id: 'escort-weapons', label: 'Weapons', category: 'tools' }
  ],
  loader: [
    { id: 'loader-helmet', label: 'Helmet', category: 'survival' },
    { id: 'loader-medpens', label: 'Medpens', category: 'medical' },
    { id: 'loader-tractor', label: 'Multi-tool + tractor', category: 'tools' }
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
