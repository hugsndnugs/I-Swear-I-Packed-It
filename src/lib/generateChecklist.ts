import type { OperationType, CrewRole, Location } from '../data/contexts'
import type { TaskSection } from '../data/tasks'
import { tasks, SECTION_ORDER_LIST, SECTION_LABELS, type TaskDefinition } from '../data/tasks'

export interface ChecklistTask {
  id: string
  taskId: string
  label: string
  section: TaskSection
  role?: CrewRole
}

export interface ChecklistSection {
  id: TaskSection
  label: string
  tasks: ChecklistTask[]
}

export interface GeneratedChecklist {
  sections: ChecklistSection[]
  crewRoles: CrewRole[]
}

function sectionsForOperation(op: OperationType): TaskSection[] {
  const always: TaskSection[] = ['ship-readiness', 'critical', 'flight']
  switch (op) {
    case 'cargo-run':
      return [...always, 'tools', 'cargo', 'crew']
    case 'bounty':
      return [...always, 'crew']
    case 'medical-rescue':
      return [...always, 'medical', 'crew']
    case 'org-op':
      return [...always, 'tools', 'cargo', 'medical', 'crew']
    case 'salvage':
      return [...always, 'tools', 'cargo', 'crew']
    case 'mining':
      return [...always, 'tools', 'crew']
    case 'piracy':
      return [...always, 'tools', 'cargo', 'crew']
    default:
      return [...always, 'crew']
  }
}

function taskMatchesRole(task: TaskDefinition, crewRoles: CrewRole[]): boolean {
  if (!task.roles || task.roles.length === 0) return true
  return task.roles.some((r) => crewRoles.includes(r))
}

function taskMatchesOperation(task: TaskDefinition, op: OperationType): boolean {
  if (!task.tags || task.tags.length === 0) return true
  const tagMap: Record<string, OperationType> = {
    mining: 'mining',
    salvage: 'salvage'
  }
  return task.tags.some((tag) => tagMap[tag] === op)
}

export function generateChecklist(
  _shipId: string,
  operationType: OperationType,
  crewRoles: CrewRole[],
  location?: Location | null
): GeneratedChecklist {
  const includedSections = sectionsForOperation(operationType)
  const sectionSet = new Set(includedSections)

  const filtered: TaskDefinition[] = tasks.filter((t) => {
    if (!sectionSet.has(t.section)) return false
    if (!taskMatchesRole(t, crewRoles)) return false
    if (!taskMatchesOperation(t, operationType)) return false
    return true
  })

  const sections: ChecklistSection[] = SECTION_ORDER_LIST.filter((sid) => sectionSet.has(sid)).map(
    (sectionId) => {
      const sectionTasks = filtered
        .filter((t) => t.section === sectionId)
        .map((t) => ({
          id: `${sectionId}-${t.id}`,
          taskId: t.id,
          label: t.label,
          section: sectionId,
          role: t.roles?.[0]
        }))
      return {
        id: sectionId,
        label: SECTION_LABELS[sectionId],
        tasks: sectionTasks
      }
    }
  )

  return {
    sections: sections.filter((s) => s.tasks.length > 0),
    crewRoles: [...crewRoles]
  }
}
