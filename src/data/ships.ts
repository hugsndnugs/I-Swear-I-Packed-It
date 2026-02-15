export type { ShipProfile, ShipRole, ShipSize, ShipStatus } from './shipTypes'
import type { ShipProfile } from './shipTypes'

/** Legacy curated list; used as fallback and for overrides. */
export const shipsLegacy: ShipProfile[] = [
  { id: 'c2-hercules', name: 'C2 Hercules', roles: ['cargo', 'multi-crew'], storageBehavior: 'ship' },
  { id: 'caterpillar', name: 'Caterpillar', roles: ['cargo', 'multi-crew'], storageBehavior: 'ship' },
  { id: 'cutlass-black', name: 'Cutlass Black', roles: ['cargo', 'combat', 'multi-crew'], storageBehavior: 'both' },
  { id: 'cutlass-red', name: 'Cutlass Red', roles: ['medical', 'multi-crew'], storageBehavior: 'both' },
  { id: 'constellation-andromeda', name: 'Constellation Andromeda', roles: ['cargo', 'combat', 'multi-crew'], storageBehavior: 'both' },
  { id: 'arrow', name: 'Arrow', roles: ['combat'], storageBehavior: 'local' },
  { id: 'gladius', name: 'Gladius', roles: ['combat'], storageBehavior: 'local' },
  { id: 'vanguard-sentinel', name: 'Vanguard Sentinel', roles: ['combat', 'multi-crew'], storageBehavior: 'both' },
  { id: 'hammerhead', name: 'Hammerhead', roles: ['combat', 'multi-crew'], storageBehavior: 'ship' },
  { id: 'carrack', name: 'Carrack', roles: ['multi-crew', 'medical', 'cargo'], storageBehavior: 'ship' },
  { id: '600i-explorer', name: '600i Explorer', roles: ['multi-crew', 'cargo'], storageBehavior: 'ship' },
  { id: 'reclaimer', name: 'Reclaimer', roles: ['multi-crew', 'cargo'], storageBehavior: 'ship' },
  { id: 'vulture', name: 'Vulture', roles: ['cargo'], storageBehavior: 'both' },
  { id: 'prospector', name: 'Prospector', roles: ['mining'], storageBehavior: 'both' },
  { id: 'mole', name: 'MOLE', roles: ['mining', 'multi-crew'], storageBehavior: 'ship' },
  { id: 'avenger-titan', name: 'Avenger Titan', roles: ['cargo', 'combat'], storageBehavior: 'both' },
  { id: 'nomad', name: 'Nomad', roles: ['cargo'], storageBehavior: 'both' },
  { id: 'freelancer', name: 'Freelancer', roles: ['cargo', 'multi-crew'], storageBehavior: 'both' },
  { id: 'msr', name: 'Mercury Star Runner', roles: ['cargo', 'multi-crew'], storageBehavior: 'ship' },
  { id: 'redeemer', name: 'Redeemer', roles: ['combat', 'multi-crew'], storageBehavior: 'both' }
]

// Generated ship list (from scripts/generate-ships.mjs). Re-export merged list.
import { shipsGenerated } from './ships.generated'
import { shipOverrides } from './ships.overrides'

const byId = new Map<string, ShipProfile>()
for (const s of shipsGenerated) {
  byId.set(s.id, s)
}
for (const s of shipOverrides) {
  byId.set(s.id, s)
}
export const ships: ShipProfile[] = Array.from(byId.values()).sort((a, b) =>
  a.name.localeCompare(b.name)
)
