import type { OperationType, CrewRole } from '../data/contexts'
import type { GeneratedChecklist } from '../lib/generateChecklist'
import type { ContextWarningsResult } from '../lib/contextWarnings'

export interface GeneratorLocationState {
  preset?: {
    shipId: string
    operationType: OperationType
    crewCount: number
    crewRoles: CrewRole[]
  }
  fromLastRun?: boolean
  lastRun?: {
    shipId: string
    operationType: OperationType
    crewCount: number
    crewRoles: CrewRole[]
  }
}

export interface ChecklistLocationState {
  checklist?: GeneratedChecklist
  shipId?: string
  operationType?: OperationType
  crewRoles?: CrewRole[]
  contextWarnings?: ContextWarningsResult
}

export interface PackListLocationState {
  crewRoles?: CrewRole[]
}
