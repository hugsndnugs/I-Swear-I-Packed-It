import type { OperationType, CrewRole } from '../data/contexts'
import type { GeneratedChecklist } from '../lib/generateChecklist'
import type { ContextWarningsResult } from '../lib/contextWarnings'
import type { CrewRoleCounts } from '../lib/crewRoleCounts'

export interface GeneratorLocationState {
  preset?: {
    shipId: string
    operationType: OperationType
    crewCount: number
    crewRoles: CrewRole[]
    crewRoleCounts?: CrewRoleCounts
    locationId?: string
  }
  fromLastRun?: boolean
  lastRun?: {
    shipId: string
    operationType: OperationType
    crewCount: number
    crewRoles: CrewRole[]
    crewRoleCounts?: CrewRoleCounts
    locationId?: string
  }
}

export interface ChecklistLocationState {
  checklist?: GeneratedChecklist
  shipId?: string
  operationType?: OperationType
  crewRoles?: CrewRole[]
  crewRoleCounts?: CrewRoleCounts
  locationId?: string
  contextWarnings?: ContextWarningsResult
}

export interface PackListLocationState {
  crewRoles?: CrewRole[]
  crewRoleCounts?: CrewRoleCounts
}
