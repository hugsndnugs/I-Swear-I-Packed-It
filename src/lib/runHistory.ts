import type { OperationType, CrewRole } from '../data/contexts'
import { tasks } from '../data/tasks'
import { setStorageError } from './storageError'

const RUN_HISTORY_KEY = 'preflight-run-history'
const MAX_RUNS = 50

export interface RunSummary {
  shipId: string
  operationType: OperationType
  crewRoles: CrewRole[]
  completedIds: string[]
  allTaskIds: string[]
  timestamp: number
}

function isValidRunSummary(v: unknown): v is RunSummary {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return (
    typeof o.shipId === 'string' &&
    typeof o.operationType === 'string' &&
    Array.isArray(o.crewRoles) &&
    Array.isArray(o.completedIds) &&
    (o.completedIds as unknown[]).every((id) => typeof id === 'string') &&
    Array.isArray(o.allTaskIds) &&
    (o.allTaskIds as unknown[]).every((id) => typeof id === 'string') &&
    typeof o.timestamp === 'number'
  )
}

function loadRunHistory(): RunSummary[] {
  try {
    const raw = localStorage.getItem(RUN_HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidRunSummary)
  } catch {
    return []
  }
}

function saveRunHistory(runs: RunSummary[]): void {
  try {
    localStorage.setItem(RUN_HISTORY_KEY, JSON.stringify(runs))
    setStorageError(null)
  } catch {
    setStorageError('Could not save; check storage or use in normal browsing mode.')
  }
}

/**
 * Record a checklist run when the user leaves or finishes.
 * Call with the current context, completed task IDs, and all task IDs that were in the checklist.
 */
export function recordRun(
  context: { shipId: string; operationType: OperationType; crewRoles: CrewRole[] },
  completedIds: string[],
  allTaskIds: string[]
): void {
  const runs = loadRunHistory()
  const entry: RunSummary = {
    shipId: context.shipId,
    operationType: context.operationType,
    crewRoles: [...context.crewRoles],
    completedIds: [...completedIds],
    allTaskIds: [...allTaskIds],
    timestamp: Date.now()
  }
  runs.push(entry)
  if (runs.length > MAX_RUNS) {
    runs.splice(0, runs.length - MAX_RUNS)
  }
  saveRunHistory(runs)
}

/**
 * Returns task IDs that the user has frequently left incomplete (missed),
 * ordered by how often they were missed. Uses task id (e.g. "helmet") not checklist row id.
 */
export function getFrequentlyMissedTaskIds(limit = 5): string[] {
  const runs = loadRunHistory()
  const missedCount: Record<string, number> = {}
  const validTaskIds = new Set(tasks.map((t) => t.id))
  for (const run of runs) {
    const completedSet = new Set(run.completedIds)
    for (const rowId of run.allTaskIds) {
      const taskId = rowId.includes('-') ? rowId.split('-').slice(1).join('-') : rowId
      if (!completedSet.has(rowId) && validTaskIds.has(taskId)) {
        missedCount[taskId] = (missedCount[taskId] ?? 0) + 1
      }
    }
  }
  return Object.entries(missedCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id)
}

/** Get task label by task id for display. */
export function getTaskLabel(taskId: string): string {
  const t = tasks.find((x) => x.id === taskId)
  return t?.label ?? taskId
}

/**
 * Returns task IDs that the user has frequently completed,
 * ordered by how often they were completed. Uses task id (e.g. "helmet") not checklist row id.
 */
export function getFrequentlyCompletedTaskIds(limit = 5): string[] {
  const runs = loadRunHistory()
  const completedCount: Record<string, number> = {}
  const validTaskIds = new Set(tasks.map((t) => t.id))
  for (const run of runs) {
    const completedSet = new Set(run.completedIds)
    for (const rowId of run.allTaskIds) {
      const taskId = rowId.includes('-') ? rowId.split('-').slice(1).join('-') : rowId
      if (completedSet.has(rowId) && validTaskIds.has(taskId)) {
        completedCount[taskId] = (completedCount[taskId] ?? 0) + 1
      }
    }
  }
  return Object.entries(completedCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id)
}

/**
 * Get suggested reminders based on past behavior patterns.
 * Returns tasks that are frequently completed but might be forgotten.
 */
export function getSuggestedReminders(limit = 3): string[] {
  const frequentlyCompleted = getFrequentlyCompletedTaskIds(10)
  const frequentlyMissed = getFrequentlyMissedTaskIds(10)
  const missedSet = new Set(frequentlyMissed)
  // Return items that are frequently completed but also sometimes missed
  return frequentlyCompleted.filter((id) => missedSet.has(id)).slice(0, limit)
}
