export type OperationType =
  | 'cargo-run'
  | 'bounty'
  | 'medical-rescue'
  | 'org-op'
  | 'salvage'
  | 'mining'

export type CrewRole = 'pilot' | 'gunner' | 'medic' | 'escort' | 'loader'

export const OPERATION_TYPES: { id: OperationType; label: string }[] = [
  { id: 'cargo-run', label: 'Cargo run' },
  { id: 'bounty', label: 'Bounty' },
  { id: 'medical-rescue', label: 'Medical rescue' },
  { id: 'org-op', label: 'Org op' },
  { id: 'salvage', label: 'Salvage' },
  { id: 'mining', label: 'Mining' }
]

export const CREW_ROLES: { id: CrewRole; label: string }[] = [
  { id: 'pilot', label: 'Pilot' },
  { id: 'gunner', label: 'Gunner' },
  { id: 'medic', label: 'Medic' },
  { id: 'escort', label: 'Escort' },
  { id: 'loader', label: 'Loader' }
]
