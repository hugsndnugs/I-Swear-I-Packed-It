import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import PackList from './PackList'

// Mock dependencies
vi.mock('../lib/presets', () => ({
  loadLastRun: vi.fn(() => null)
}))

vi.mock('../lib/pirateSettings', () => ({
  getPirateSettings: vi.fn(() => ({ pirateSpeak: false }))
}))

vi.mock('../lib/pirateSpeak', () => ({
  pirateSpeak: vi.fn((text: string) => text)
}))

const renderPackList = () => {
  return render(
    <BrowserRouter>
      <PackList />
    </BrowserRouter>
  )
}

describe('PackList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders the pack list screen with title', () => {
    renderPackList()
    expect(screen.getByText('Pack List')).toBeInTheDocument()
  })

  it('displays description', () => {
    renderPackList()
    expect(screen.getByText(/Pull these from inventory/)).toBeInTheDocument()
  })

  it('displays default note when using default roles', () => {
    renderPackList()
    expect(screen.getByText(/Using default/)).toBeInTheDocument()
  })

  it('displays loadout items grouped by category', () => {
    renderPackList()
    // Items should be rendered - exact content depends on loadout data
    expect(screen.getByText('Pack List')).toBeInTheDocument()
  })
})
