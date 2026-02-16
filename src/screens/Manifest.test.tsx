import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Manifest from './Manifest'

// Mock dependencies
vi.mock('../lib/presets', () => ({
  loadLastManifest: vi.fn(() => null),
  saveLastManifest: vi.fn()
}))

vi.mock('../lib/validateManifest', () => ({
  validateManifest: vi.fn(() => ({
    totalScuUsed: 10,
    shipCargoScu: 100,
    requiredTools: [],
    suggestedBackup: [],
    warnings: [],
    risks: []
  }))
}))

Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve())
  }
})

const renderManifest = () => {
  return render(
    <BrowserRouter>
      <Manifest />
    </BrowserRouter>
  )
}

describe('Manifest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders the manifest screen with title', () => {
    renderManifest()
    expect(screen.getByText('Cargo Manifest')).toBeInTheDocument()
  })

  it('displays ship selector', () => {
    renderManifest()
    expect(screen.getByLabelText('Select ship')).toBeInTheDocument()
  })

  it('displays route selector', () => {
    renderManifest()
    expect(screen.getByLabelText('Select route')).toBeInTheDocument()
  })

  it('displays add row button', () => {
    renderManifest()
    expect(screen.getByText('Add row')).toBeInTheDocument()
  })

  it('shows empty state when no cargo rows', () => {
    renderManifest()
    expect(screen.getByText(/No cargo added/)).toBeInTheDocument()
  })

  it('displays generate report button', () => {
    renderManifest()
    expect(screen.getByText(/Generate report/i)).toBeInTheDocument()
  })
})
