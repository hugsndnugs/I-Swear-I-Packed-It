import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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

  it('displays ship selector', async () => {
    renderManifest()
    await waitFor(() => {
      expect(screen.getByLabelText('Select ship')).toBeInTheDocument()
    })
  })

  it('displays route selector', async () => {
    renderManifest()
    await waitFor(() => {
      expect(screen.getByLabelText('Select route')).toBeInTheDocument()
    })
  })

  it('displays add row button', async () => {
    renderManifest()
    await waitFor(() => {
      expect(screen.getByText('Add row')).toBeInTheDocument()
    })
  })

  it('shows empty state when no cargo rows', async () => {
    renderManifest()
    await waitFor(() => {
      expect(screen.getByText(/No cargo added/)).toBeInTheDocument()
    })
  })

  it('displays generate report button', async () => {
    renderManifest()
    await waitFor(() => {
      expect(screen.getByText(/Generate validation report/i)).toBeInTheDocument()
    })
  })
})
