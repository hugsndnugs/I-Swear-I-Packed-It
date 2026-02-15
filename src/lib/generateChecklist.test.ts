import { describe, it, expect } from 'vitest'
import { generateChecklist } from './generateChecklist'

describe('generateChecklist', () => {
  it('returns critical and flight sections for cargo-run with pilot only', () => {
    const result = generateChecklist('cutlass-black', 'cargo-run', ['pilot'])
    const sectionIds = result.sections.map((s) => s.id)
    expect(sectionIds).toContain('critical')
    expect(sectionIds).toContain('flight')
    expect(sectionIds).toContain('tools')
    expect(sectionIds).toContain('cargo')
    expect(sectionIds).toContain('crew')
  })

  it('includes mining-tool task only for mining operation', () => {
    const mining = generateChecklist('prospector', 'mining', ['pilot'])
    const toolsSection = mining.sections.find((s) => s.id === 'tools')
    const taskIds = toolsSection?.tasks.map((t) => t.taskId) ?? []
    expect(taskIds).toContain('mining-tool')

    const cargoRun = generateChecklist('cutlass-black', 'cargo-run', ['pilot'])
    const cargoTools = cargoRun.sections.find((s) => s.id === 'tools')
    const cargoTaskIds = cargoTools?.tasks.map((t) => t.taskId) ?? []
    expect(cargoTaskIds).not.toContain('mining-tool')
  })

  it('includes salvage-tool task only for salvage operation', () => {
    const salvage = generateChecklist('vulture', 'salvage', ['pilot'])
    const toolsSection = salvage.sections.find((s) => s.id === 'tools')
    const taskIds = toolsSection?.tasks.map((t) => t.taskId) ?? []
    expect(taskIds).toContain('salvage-tool')

    const bounty = generateChecklist('arrow', 'bounty', ['pilot'])
    const bountyTools = bounty.sections.find((s) => s.id === 'tools')
    const bountyTaskIds = bountyTools?.tasks.map((t) => t.taskId) ?? []
    expect(bountyTaskIds).not.toContain('salvage-tool')
  })

  it('includes medical section and medic tasks for medical-rescue with medic role', () => {
    const result = generateChecklist('cutlass-red', 'medical-rescue', ['pilot', 'medic'])
    const sectionIds = result.sections.map((s) => s.id)
    expect(sectionIds).toContain('medical')
    const medicalSection = result.sections.find((s) => s.id === 'medical')
    expect(medicalSection?.tasks.length).toBeGreaterThan(0)
  })

  it('uses SECTION_LABELS for section labels', () => {
    const result = generateChecklist('cutlass-black', 'cargo-run', ['pilot'])
    const critical = result.sections.find((s) => s.id === 'critical')
    expect(critical?.label).toBe('Critical')
    const flight = result.sections.find((s) => s.id === 'flight')
    expect(flight?.label).toBe('Flight')
  })

  it('returns crewRoles as provided', () => {
    const roles = ['pilot', 'gunner'] as const
    const result = generateChecklist('hammerhead', 'bounty', [...roles])
    expect(result.crewRoles).toEqual([...roles])
  })
})
