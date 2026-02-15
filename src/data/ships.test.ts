import { describe, it, expect } from 'vitest'
import { ships } from './ships'
import type { ShipRole } from './shipTypes'

describe('ships', () => {
  it('includes default ship cutlass-black', () => {
    const cutlass = ships.find((s) => s.id === 'cutlass-black')
    expect(cutlass).toBeDefined()
    expect(cutlass?.name).toBe('Cutlass Black')
  })

  it('cutlass-black has expected roles for cargo and combat', () => {
    const cutlass = ships.find((s) => s.id === 'cutlass-black')
    expect(cutlass?.roles).toContain('cargo')
    expect(cutlass?.roles).toContain('combat')
    expect(cutlass?.roles).toContain('multi-crew')
  })

  it('every ship has at least one role', () => {
    const validRoles: ShipRole[] = ['cargo', 'combat', 'multi-crew', 'medical', 'mining']
    for (const s of ships) {
      expect(s.roles.length).toBeGreaterThan(0)
      for (const r of s.roles) {
        expect(validRoles).toContain(r)
      }
    }
  })

  it('every ship has unique id and non-empty name', () => {
    const ids = new Set<string>()
    for (const s of ships) {
      expect(s.id.trim()).toBe(s.id)
      expect(s.id.length).toBeGreaterThan(0)
      expect(s.name.trim()).toBe(s.name)
      expect(s.name.length).toBeGreaterThan(0)
      expect(ids.has(s.id)).toBe(false)
      ids.add(s.id)
    }
  })

  it('ships are sorted by name', () => {
    const names = ships.map((s) => s.name)
    const sorted = [...names].sort((a, b) => a.localeCompare(b))
    expect(names).toEqual(sorted)
  })
})
