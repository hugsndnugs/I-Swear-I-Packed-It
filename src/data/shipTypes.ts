export type ShipRole = 'cargo' | 'combat' | 'multi-crew' | 'medical' | 'mining'

export type ShipSize = 'small' | 'medium' | 'large' | 'capital'
export type ShipStatus = 'flight-ready' | 'in-concept' | 'production'

export interface ShipProfile {
  id: string
  name: string
  roles: ShipRole[]
  storageBehavior?: 'local' | 'ship' | 'both'
  manufacturer?: string
  size?: ShipSize
  status?: ShipStatus
  crewMin?: number
  crewMax?: number
  cargoScu?: number
}
