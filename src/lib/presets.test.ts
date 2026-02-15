import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  loadPresets,
  savePreset,
  deletePreset,
  loadLastRun,
  saveLastRun,
  loadChecklistProgress,
  saveChecklistProgress,
  checklistProgressMatches,
  type PresetConfig,
  type LastRunConfig,
  type ChecklistProgress
} from './presets'

function createMockStorage(): Record<string, string> {
  const store: Record<string, string> = {}
  return {
    getItem(key: string) {
      return store[key] ?? null
    },
    setItem(key: string, value: string) {
      store[key] = value
    },
    removeItem(key: string) {
      delete store[key]
    },
    get store() {
      return store
    }
  }
}

describe('presets', () => {
  let mockStorage: ReturnType<typeof createMockStorage>

  beforeEach(() => {
    mockStorage = createMockStorage()
    vi.stubGlobal('localStorage', mockStorage)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('loadPresets', () => {
    it('returns empty array when no presets stored', () => {
      expect(loadPresets()).toEqual([])
    })

    it('returns valid presets and filters invalid entries', () => {
      const valid: PresetConfig = {
        id: 'preset-1',
        name: 'Test',
        shipId: 'cutlass-black',
        operationType: 'cargo-run',
        crewCount: 1,
        crewRoles: ['pilot'],
        createdAt: Date.now()
      }
      mockStorage.setItem('preflight-presets', JSON.stringify([valid]))
      expect(loadPresets()).toHaveLength(1)
      expect(loadPresets()[0].name).toBe('Test')

      mockStorage.setItem(
        'preflight-presets',
        JSON.stringify([valid, { bad: 'data' }, null, { ...valid, id: '2', operationType: 'invalid-op' }])
      )
      const loaded = loadPresets()
      expect(loaded).toHaveLength(1)
      expect(loaded[0].id).toBe('preset-1')
    })
  })

  describe('savePreset', () => {
    it('saves and then loads preset', () => {
      const saved = savePreset({
        name: 'My Preset',
        shipId: 'c2-hercules',
        operationType: 'cargo-run',
        crewCount: 2,
        crewRoles: ['pilot', 'loader']
      })
      expect(saved.id).toBeDefined()
      expect(saved.name).toBe('My Preset')
      expect(loadPresets()).toHaveLength(1)
    })
  })

  describe('deletePreset', () => {
    it('removes preset by id', () => {
      const saved = savePreset({
        name: 'To Delete',
        shipId: 'arrow',
        operationType: 'bounty',
        crewCount: 1,
        crewRoles: ['pilot']
      })
      expect(loadPresets()).toHaveLength(1)
      deletePreset(saved.id)
      expect(loadPresets()).toHaveLength(0)
    })
  })

  describe('loadLastRun', () => {
    it('returns null when nothing stored', () => {
      expect(loadLastRun()).toBeNull()
    })

    it('returns null for invalid data', () => {
      mockStorage.setItem('preflight-last-run', JSON.stringify({ shipId: 'x', operationType: 'invalid' }))
      expect(loadLastRun()).toBeNull()
    })

    it('returns valid last run', () => {
      const config: LastRunConfig = {
        shipId: 'cutlass-black',
        operationType: 'mining',
        crewCount: 1,
        crewRoles: ['pilot']
      }
      saveLastRun(config)
      expect(loadLastRun()).toEqual(config)
    })
  })

  describe('saveLastRun', () => {
    it('persists and loads', () => {
      saveLastRun({
        shipId: 'prospector',
        operationType: 'mining',
        crewCount: 1,
        crewRoles: ['pilot']
      })
      const loaded = loadLastRun()
      expect(loaded?.shipId).toBe('prospector')
      expect(loaded?.operationType).toBe('mining')
    })
  })

  describe('checklistProgressMatches', () => {
    it('returns true when ship, operation and crew roles match', () => {
      const a = { shipId: 'c2', operationType: 'cargo-run' as const, crewRoles: ['pilot', 'loader'] as const }
      const b = { shipId: 'c2', operationType: 'cargo-run' as const, crewRoles: ['loader', 'pilot'] as const }
      expect(checklistProgressMatches(a, b)).toBe(true)
    })

    it('returns false when ship differs', () => {
      const a = { shipId: 'c2', operationType: 'cargo-run' as const, crewRoles: ['pilot'] as const }
      const b = { shipId: 'caterpillar', operationType: 'cargo-run' as const, crewRoles: ['pilot'] as const }
      expect(checklistProgressMatches(a, b)).toBe(false)
    })

    it('returns false when crew roles length differs', () => {
      const a = { shipId: 'c2', operationType: 'cargo-run' as const, crewRoles: ['pilot'] as const }
      const b = { shipId: 'c2', operationType: 'cargo-run' as const, crewRoles: ['pilot', 'loader'] as const }
      expect(checklistProgressMatches(a, b)).toBe(false)
    })
  })

  describe('loadChecklistProgress / saveChecklistProgress', () => {
    it('returns null when nothing stored', () => {
      expect(loadChecklistProgress()).toBeNull()
    })

    it('saves and loads progress', () => {
      const progress: ChecklistProgress = {
        shipId: 'cutlass-black',
        operationType: 'cargo-run',
        crewRoles: ['pilot'],
        completedIds: ['critical-helmet', 'critical-medpens']
      }
      saveChecklistProgress(progress)
      expect(loadChecklistProgress()).toEqual(progress)
    })

    it('returns null for invalid progress shape', () => {
      mockStorage.setItem(
        'preflight-checklist-progress',
        JSON.stringify({ shipId: 'x', operationType: 'bad', crewRoles: [], completedIds: 'not-array' })
      )
      expect(loadChecklistProgress()).toBeNull()
    })
  })
})
