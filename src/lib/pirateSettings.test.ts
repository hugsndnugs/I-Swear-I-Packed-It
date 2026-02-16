import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getPirateSettings, setPirateSettings, isPirateShip } from './pirateSettings'
import type { ShipProfile } from '../data/shipTypes'

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

describe('pirateSettings', () => {
  let mockStorage: ReturnType<typeof createMockStorage>

  beforeEach(() => {
    mockStorage = createMockStorage()
    vi.stubGlobal('localStorage', mockStorage)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('getPirateSettings', () => {
    it('returns defaults when nothing stored', () => {
      const s = getPirateSettings()
      expect(s.theme).toBe(false)
      expect(s.shipFilter).toBe(false)
      expect(s.pirateSpeak).toBe(false)
      expect(s.pirateOpMode).toBe(false)
    })

    it('returns stored values', () => {
      setPirateSettings({ theme: true, shipFilter: true })
      const s = getPirateSettings()
      expect(s.theme).toBe(true)
      expect(s.shipFilter).toBe(true)
    })
  })

  describe('setPirateSettings', () => {
    it('persists partial update', () => {
      setPirateSettings({ pirateSpeak: true })
      expect(mockStorage.store['preflight-pirate-settings']).toBeDefined()
      const raw = JSON.parse(mockStorage.store['preflight-pirate-settings'])
      expect(raw.pirateSpeak).toBe(true)
    })

    it('merges with existing', () => {
      setPirateSettings({ theme: true })
      setPirateSettings({ shipFilter: true })
      const s = getPirateSettings()
      expect(s.theme).toBe(true)
      expect(s.shipFilter).toBe(true)
    })
  })

  describe('isPirateShip', () => {
    it('returns true when id contains pirate', () => {
      const ship: ShipProfile = {
        id: 'gladius-pirate',
        name: 'Gladius',
        roles: ['combat']
      }
      expect(isPirateShip(ship)).toBe(true)
    })

    it('returns true when name contains pirate', () => {
      const ship: ShipProfile = {
        id: 'caterpillar-pirate',
        name: 'Caterpillar Pirate',
        roles: ['cargo']
      }
      expect(isPirateShip(ship)).toBe(true)
    })

    it('returns false for non-pirate ship', () => {
      const ship: ShipProfile = {
        id: 'cutlass-black',
        name: 'Cutlass Black',
        roles: ['cargo']
      }
      expect(isPirateShip(ship)).toBe(false)
    })
  })
})
