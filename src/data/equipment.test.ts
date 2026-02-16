import { describe, it, expect } from 'vitest'
import {
  equipmentCatalog,
  getEquipmentByCategory,
  getEquipmentSorted,
  EQUIPMENT_CATEGORY_LABELS,
} from './equipment'

describe('equipment', () => {
  it('catalog has multi-tool attachments and medical items', () => {
    const names = equipmentCatalog.map((e) => e.name)
    expect(names).toContain('TruHold Tractor Beam Attachment')
    expect(names).toContain('LifeGuard Medical Attachment')
    expect(names).toContain('CureLife Med-Pen')
    expect(names.some((n) => n.startsWith('Medgun'))).toBe(true)
  })

  it('tractor attachment links to multitool-tractor task', () => {
    const tractor = equipmentCatalog.find((e) => e.id === 'truhold-tractor')
    expect(tractor?.taskIds).toContain('multitool-tractor')
  })

  it('getEquipmentByCategory returns map with expected categories', () => {
    const byCat = getEquipmentByCategory()
    expect(byCat.has('tools')).toBe(true)
    expect(byCat.has('medical')).toBe(true)
    expect(byCat.get('medical')!.length).toBeGreaterThan(0)
  })

  it('getEquipmentSorted returns all items in category order', () => {
    const sorted = getEquipmentSorted()
    expect(sorted.length).toBe(equipmentCatalog.length)
    const categories = [...new Set(sorted.map((e) => e.category))]
    const order = ['medical', 'survival', 'tools', 'ammo', 'utility', 'weapon', 'armor']
    for (const cat of order) {
      if (categories.includes(cat)) {
        const firstIndex = sorted.findIndex((e) => e.category === cat)
        const lastIndex = sorted.map((e) => e.category).lastIndexOf(cat)
        for (let i = firstIndex; i <= lastIndex; i++) {
          expect(sorted[i].category).toBe(cat)
        }
      }
    }
  })

  it('EQUIPMENT_CATEGORY_LABELS has label for every category used', () => {
    const used = new Set(equipmentCatalog.map((e) => e.category))
    for (const cat of used) {
      expect(EQUIPMENT_CATEGORY_LABELS[cat]).toBeDefined()
      expect(EQUIPMENT_CATEGORY_LABELS[cat].length).toBeGreaterThan(0)
    }
  })

  it('every catalog item has a non-empty name', () => {
    for (const item of equipmentCatalog) {
      expect(item.name).toBeDefined()
      expect(item.name.trim().length).toBeGreaterThan(0)
    }
  })
})
