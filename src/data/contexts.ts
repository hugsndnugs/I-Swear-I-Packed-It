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

export const LOCATIONS: Location[] = [
  // Stations
  { id: 'port-tressler', label: 'Port Tressler', type: 'station', system: 'Stanton' },
  { id: 'everus-harbor', label: 'Everus Harbor', type: 'station', system: 'Stanton' },
  { id: 'seraphim-station', label: 'Seraphim Station', type: 'station', system: 'Stanton' },
  { id: 'baijini-point', label: 'Baijini Point', type: 'station', system: 'Stanton' },
  { id: 'cru-l1', label: 'CRU-L1', type: 'station', system: 'Stanton' },
  { id: 'cru-l4', label: 'CRU-L4', type: 'station', system: 'Stanton' },
  { id: 'cru-l5', label: 'CRU-L5', type: 'station', system: 'Stanton' },
  { id: 'hurl-l1', label: 'HUR-L1', type: 'station', system: 'Stanton' },
  { id: 'hurl-l2', label: 'HUR-L2', type: 'station', system: 'Stanton' },
  { id: 'hurl-l3', label: 'HUR-L3', type: 'station', system: 'Stanton' },
  { id: 'hurl-l4', label: 'HUR-L4', type: 'station', system: 'Stanton' },
  { id: 'hurl-l5', label: 'HUR-L5', type: 'station', system: 'Stanton' },
  // Cities
  { id: 'lorville', label: 'Lorville', type: 'city', system: 'Stanton' },
  { id: 'new-babbage', label: 'New Babbage', type: 'city', system: 'Stanton' },
  { id: 'area18', label: 'Area18', type: 'city', system: 'Stanton' },
  { id: 'orison', label: 'Orison', type: 'city', system: 'Stanton' },
  // Outposts
  { id: 'shubin-mining', label: 'Shubin Mining Facility', type: 'outpost', system: 'Stanton' },
  { id: 'microtech-outpost', label: 'MicroTech Outpost', type: 'outpost', system: 'Stanton' },
  { id: 'hurston-outpost', label: 'Hurston Outpost', type: 'outpost', system: 'Stanton' },
  { id: 'crusader-outpost', label: 'Crusader Outpost', type: 'outpost', system: 'Stanton' },
  // None option
  { id: 'none', label: 'None', type: 'none' }
]

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
