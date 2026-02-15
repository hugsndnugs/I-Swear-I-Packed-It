import type { CrewRole } from './contexts'

export type TaskSection = 'critical' | 'flight' | 'tools' | 'cargo' | 'medical' | 'crew'

export interface TaskDefinition {
  id: string
  label: string
  section: TaskSection
  roles?: CrewRole[]
  tags?: string[]
}

const SECTION_ORDER: TaskSection[] = ['critical', 'flight', 'tools', 'cargo', 'medical', 'crew']

export const SECTION_LABELS: Record<TaskSection, string> = {
  critical: 'Critical',
  flight: 'Flight',
  tools: 'Tools',
  cargo: 'Cargo',
  medical: 'Medical',
  crew: 'Crew'
}

export const SECTION_ORDER_LIST = SECTION_ORDER

export const tasks: TaskDefinition[] = [
  // Critical (always included)
  { id: 'helmet', label: 'Helmet equipped', section: 'critical' },
  { id: 'medpens', label: 'Medpens / basic meds', section: 'critical' },
  { id: 'multitool-tractor', label: 'Multi-tool + tractor', section: 'critical' },
  { id: 'ammo', label: 'Ammo / magazines', section: 'critical' },
  { id: 'spare-undersuit', label: 'Spare undersuit (optional)', section: 'critical' },
  // Flight
  { id: 'quantum-fuel', label: 'Quantum fuel check', section: 'flight' },
  { id: 'insurance', label: 'Insurance / claim timer check', section: 'flight' },
  { id: 'spawn', label: 'Set spawn / imprint', section: 'flight' },
  { id: 'route', label: 'Route confirmed', section: 'flight' },
  // Tools
  { id: 'tractor-ready', label: 'Tractor ready', section: 'tools' },
  { id: 'mining-tool', label: 'Mining tool / attachment', section: 'tools', tags: ['mining'] },
  { id: 'salvage-tool', label: 'Salvage tool / attachment', section: 'tools', tags: ['salvage'] },
  // Cargo
  { id: 'boxes', label: 'Boxes accounted for', section: 'cargo' },
  { id: 'destination', label: 'Destination confirmed', section: 'cargo' },
  { id: 'landing-zone', label: 'Landing zone reviewed', section: 'cargo' },
  // Medical
  { id: 'medgun', label: 'Medgun equipped', section: 'medical', roles: ['medic'] },
  { id: 'refills', label: 'Refills loaded', section: 'medical', roles: ['medic'] },
  { id: 'trauma-meds', label: 'Trauma meds stocked', section: 'medical', roles: ['medic'] },
  { id: 'extraction-tools', label: 'Extraction tools ready', section: 'medical', roles: ['medic'] },
  // Crew
  { id: 'crew-comms', label: 'Crew comms check', section: 'crew' },
  { id: 'crew-roles', label: 'Roles assigned', section: 'crew' },
  { id: 'gunner-weapons', label: 'Weapons / turret ready', section: 'crew', roles: ['gunner'] },
  { id: 'escort-kit', label: 'Escort kit ready', section: 'crew', roles: ['escort'] },
  { id: 'loader-tractor', label: 'Loader tractor ready', section: 'crew', roles: ['loader'] }
]
