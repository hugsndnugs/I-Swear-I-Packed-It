import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import OpMode from './OpMode'

// Mock dependencies
vi.mock('../lib/opModeTimers', () => ({
  getState: vi.fn(() => null),
  getNextReminders: vi.fn(() => []),
  startOpMode: vi.fn(() => ({ startTime: Date.now(), intervals: {}, notificationsEnabled: false })),
  stopOpMode: vi.fn(),
  setOnReminderFire: vi.fn(),
  resumeOpMode: vi.fn(),
  requestNotificationPermission: vi.fn(() => Promise.resolve('granted')),
  updateOpModeNotifications: vi.fn(),
  getDefaultIntervals: vi.fn(() => ({
    restockIntervalMin: 30,
    hydrateIntervalMin: 30,
    refuelIntervalMin: 30
  }))
}))

// Mock Notification API
global.Notification = {
  permission: 'default',
  requestPermission: vi.fn(() => Promise.resolve('granted'))
} as any

const renderOpMode = () => {
  return render(
    <BrowserRouter>
      <OpMode />
    </BrowserRouter>
  )
}

describe('OpMode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders the op mode screen with title', () => {
    renderOpMode()
    expect(screen.getByText('Op Mode')).toBeInTheDocument()
  })

  it('displays tagline', () => {
    renderOpMode()
    expect(screen.getByText(/Get reminded to restock/)).toBeInTheDocument()
  })

  it('displays interval selectors', () => {
    renderOpMode()
    expect(screen.getByLabelText('Restock interval in minutes')).toBeInTheDocument()
    expect(screen.getByLabelText('Hydrate interval in minutes')).toBeInTheDocument()
    expect(screen.getByLabelText('Refuel interval in minutes')).toBeInTheDocument()
  })

  it('displays notifications checkbox', () => {
    renderOpMode()
    expect(screen.getByLabelText(/Enable browser notifications/)).toBeInTheDocument()
  })

  it('displays start button when not running', () => {
    renderOpMode()
    expect(screen.getByText('Start Op Mode')).toBeInTheDocument()
  })
})
