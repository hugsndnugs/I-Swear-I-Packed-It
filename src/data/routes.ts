/**
 * Route presets for cargo manifest validation. Optional context for risk rules.
 * Built-in presets plus optional "best routes" from data/best-routes.json (see scripts/update-routes.mjs).
 */

import { BEST_ROUTES } from './routes.generated'

export interface RoutePreset {
  id: string
  label: string
  /** Long-haul routes may suggest spare gear / provisions. */
  longHaul?: boolean
  /** High-value routes may suggest escort. */
  highValue?: boolean
}

const STATIC_PRESETS: RoutePreset[] = [
  { id: 'none', label: 'No route (generic)' },
  { id: 'stanton-loop', label: 'Stanton loop', longHaul: true },
  { id: 'lyria-mining', label: 'Lyria mining run' },
  { id: 'pyro-hop', label: 'Stanton – Pyro hop', longHaul: true, highValue: true },
  { id: 'outpost-resupply', label: 'Outpost resupply', longHaul: true },
  { id: 'city-trade', label: 'City trade route' }
]

const best = (BEST_ROUTES as unknown) as RoutePreset[]
const bestDeduped = best.filter((r) => !STATIC_PRESETS.some((s) => s.id === r.id))

export const ROUTE_PRESETS: RoutePreset[] = [...STATIC_PRESETS, ...bestDeduped]

export function getRouteById(id: string): RoutePreset | undefined {
  return ROUTE_PRESETS.find((r) => r.id === id)
}
