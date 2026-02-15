import type { ShipProfile } from './shipTypes'

/** Manual overrides for role/storage or ships not in the API. IDs here replace same ID in generated list. */
export const shipOverrides: ShipProfile[] = [
  { id: 'cutlass-black', name: 'Cutlass Black', roles: ['cargo', 'combat', 'multi-crew'], storageBehavior: 'both', manufacturer: 'Drake Interplanetary', size: 'medium', status: 'flight-ready', crewMin: 2, crewMax: 2, cargoScu: 46 },
]
