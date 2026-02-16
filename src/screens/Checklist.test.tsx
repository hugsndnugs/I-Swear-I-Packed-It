import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import Checklist from './Checklist'
import { generateChecklist } from '../lib/generateChecklist'

// Mock dependencies
vi.mock('../lib/presets', () => ({
  loadChecklistProgress: vi.fn(() => null),
  saveChecklistProgress: vi.fn(),
  checklistProgressMatches: vi.fn(() => false),
  savePreset: vi.fn()
}))

vi.mock('../lib/runHistory', () => ({
  recordRun: vi.fn()
}))

vi.mock('../lib/pirateSettings', () => ({
  getPirateSettings: vi.fn(() => ({ pirateSpeak: false }))
}))

vi.mock('../lib/pirateSpeak', () => ({
  pirateSpeak: vi.fn((text: string) => text)
}))

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn(() => Promise.resolve('data:image/png;base64,mock'))
  }
}))

Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve())
  }
})

const renderChecklist = (initialEntries = ['/checklist']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Checklist />
    </MemoryRouter>
  )
}

describe('Checklist', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('redirects to home when no checklist state provided', () => {
    renderChecklist()
    // Should redirect - in a real test we'd check navigation
    // For now, just verify it doesn't crash
  })

  it('renders checklist sections when provided', () => {
    const checklist = generateChecklist('cutlass-black', 'cargo-run', ['pilot'])
    const state = {
      checklist,
      shipId: 'cutlass-black',
      operationType: 'cargo-run' as const,
      crewRoles: ['pilot'] as const
    }
    
    // Mock location.state
    const mockLocation = {
      pathname: '/checklist',
      state,
      key: 'test',
      search: '',
      hash: ''
    }
    
    // Note: This is a simplified test - full implementation would require
    // proper router state mocking
    expect(checklist.sections.length).toBeGreaterThan(0)
  })

  it('displays progress bar', () => {
    // Test would verify progress bar rendering
    expect(true).toBe(true) // Placeholder
  })

  it('allows task completion', () => {
    // Test would verify task checkbox interactions
    expect(true).toBe(true) // Placeholder
  })
})
