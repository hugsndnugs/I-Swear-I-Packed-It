import type { CrewRole } from './contexts'

export type TaskSection =
  | 'ship-readiness'
  | 'critical'
  | 'flight'
  | 'tools'
  | 'cargo'
  | 'medical'
  | 'crew'

export interface TaskDefinition {
  id: string
  label: string
  section: TaskSection
  roles?: CrewRole[]
  tags?: string[]
}

const SECTION_ORDER: TaskSection[] = [
  'ship-readiness',
  'critical',
  'flight',
  'tools',
  'cargo',
  'medical',
  'crew'
]

export const SECTION_LABELS: Record<TaskSection, string> = {
  'ship-readiness': 'Ship readiness',
  critical: 'Critical',
  flight: 'Flight',
  tools: 'Tools',
  cargo: 'Cargo',
  medical: 'Medical',
  crew: 'Crew'
}

export const SECTION_ORDER_LIST = SECTION_ORDER

export const tasks: TaskDefinition[] = [
  // Ship readiness (always included)
  {
    id: 'insurance-status',
    label: 'Insurance valid; check expiry if needed',
    section: 'ship-readiness'
  },
  {
    id: 'claim-timer',
    label: 'Ship retrieved or claim timer OK; expedite if needed',
    section: 'ship-readiness'
  },
  // Critical (always included)
  { id: 'helmet', label: 'Helmet equipped', section: 'critical' },
  {
    id: 'medpens',
    label: 'CureLife Med-Pen or ParaMed Medical Device (2–3+ per person)',
    section: 'critical'
  },
  { id: 'multitool-tractor', label: 'Multi-tool + tractor', section: 'critical' },
  {
    id: 'ammo',
    label: 'Ammo and magazines for FPS weapons; match weapon type',
    section: 'critical'
  },
  // Flight
  { id: 'quantum-fuel', label: 'Quantum fuel check', section: 'flight' },
  { id: 'spawn', label: 'Set spawn / imprint', section: 'flight' },
  { id: 'route', label: 'Route confirmed', section: 'flight' },
  // Tools
  {
    id: 'tractor-ready',
    label: 'TruHold tractor attachment equipped on multi-tool',
    section: 'tools'
  },
  {
    id: 'mining-tool',
    label: 'OreBit mining attachment on multi-tool',
    section: 'tools',
    tags: ['mining']
  },
  {
    id: 'salvage-tool',
    label: 'OxyTorch cutter or Cambio-Lite SRT for salvage',
    section: 'tools',
    tags: ['salvage']
  },
  // Cargo
  { id: 'boxes', label: 'Cargo crates (1–32 SCU); count and stow', section: 'cargo' },
  { id: 'destination', label: 'Destination confirmed', section: 'cargo' },
  { id: 'landing-zone', label: 'Landing zone reviewed', section: 'cargo' },
  // Medical
  {
    id: 'medgun',
    label: 'Medgun (PyroMed / CureLife) with LifeGuard attachment',
    section: 'medical',
    roles: ['medic']
  },
  {
    id: 'refills',
    label: 'Medgun refill canisters (2–3+ charges)',
    section: 'medical',
    roles: ['medic']
  },
  {
    id: 'trauma-meds',
    label: 'Med pens: Hemozal, AdrenaPen, CorticoPen, OpioPen',
    section: 'medical',
    roles: ['medic']
  },
  // Crew
  { id: 'crew-comms', label: 'Crew comms check', section: 'crew' },
  { id: 'crew-roles', label: 'Roles assigned', section: 'crew' },
  {
    id: 'gunner-weapons',
    label: 'Weapons and turret loadout; ammo topped',
    section: 'crew',
    roles: ['gunner']
  },
  {
    id: 'escort-kit',
    label: 'Weapons, ammo, medpens, helmet; combat loadout',
    section: 'crew',
    roles: ['escort']
  },
  {
    id: 'loader-tractor',
    label: 'Multi-tool with TruHold tractor; ready for cargo',
    section: 'crew',
    roles: ['loader']
  }
]
