import { describe, it, expect } from 'vitest'
import { getLoadoutForRoles, LOADOUT_CATEGORY_LABELS } from './loadouts'
import type { CrewRole } from './contexts'

describe('getLoadoutForRoles', () => {
  it('returns pilot loadout for pilot only', () => {
    const result = getLoadoutForRoles(['pilot'])
    expect(result.length).toBeGreaterThan(0)
    expect(result.some((i) => i.id === 'pilot-helmet')).toBe(true)
    expect(result.some((i) => i.id === 'pilot-medpens')).toBe(true)
  })

  it('deduplicates by item id when same role appears or same item across roles', () => {
    const result = getLoadoutForRoles(['pilot', 'pilot'])
    const ids = result.map((i) => i.id)
    expect(ids).toHaveLength(new Set(ids).size)
    expect(result).toEqual(getLoadoutForRoles(['pilot']))
  })

  it('returns pilot loadout when roles array is empty', () => {
    const result = getLoadoutForRoles([])
    expect(result.length).toBeGreaterThan(0)
    expect(result).toEqual(getLoadoutForRoles(['pilot']))
  })

  it('includes medic-specific items when medic is in roles', () => {
    const result = getLoadoutForRoles(['pilot', 'medic'])
    expect(result.some((i) => i.id === 'medic-medgun')).toBe(true)
    expect(result.some((i) => i.id === 'medic-refills')).toBe(true)
  })

  it('every item has a valid category in LOADOUT_CATEGORY_LABELS', () => {
    const roles: CrewRole[] = ['pilot', 'gunner', 'medic', 'escort', 'loader']
    const result = getLoadoutForRoles(roles)
    for (const item of result) {
      expect(Object.keys(LOADOUT_CATEGORY_LABELS)).toContain(item.category)
    }
  })
})
