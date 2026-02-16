import { LOCATIONS_GENERATED } from './locations.generated'

export type OperationType =
  | 'cargo-run'
  | 'bounty'
  | 'medical-rescue'
  | 'org-op'
  | 'salvage'
  | 'mining'
  | 'piracy'

export type CrewRole = 'pilot' | 'gunner' | 'medic' | 'escort' | 'loader'

export type LocationType = 'station' | 'city' | 'outpost' | 'none'

export interface Location {
  id: string
  label: string
  type: LocationType
  system?: string
}

export const LOCATION_TYPES: { id: LocationType; label: string }[] = [
  { id: 'station', label: 'Station' },
  { id: 'city', label: 'City' },
  { id: 'outpost', label: 'Outpost' },
  { id: 'none', label: 'None' }
]

export const LOCATIONS: Location[] = LOCATIONS_GENERATED as Location[]

export function getLocationById(id: string): Location | undefined {
  return LOCATIONS.find((l) => l.id === id)
}

export const OPERATION_TYPES: { id: OperationType; label: string }[] = [
  { id: 'cargo-run', label: 'Cargo run' },
  { id: 'bounty', label: 'Bounty' },
  { id: 'medical-rescue', label: 'Medical rescue' },
  { id: 'org-op', label: 'Org op' },
  { id: 'salvage', label: 'Salvage' },
  { id: 'mining', label: 'Mining' },
  { id: 'piracy', label: 'Piracy' }
]

export const CREW_ROLES: { id: CrewRole; label: string }[] = [
  { id: 'pilot', label: 'Pilot' },
  { id: 'gunner', label: 'Gunner' },
  { id: 'medic', label: 'Medic' },
  { id: 'escort', label: 'Escort' },
  { id: 'loader', label: 'Loader' }
]
