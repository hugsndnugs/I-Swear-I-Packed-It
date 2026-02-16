import { useState, useEffect, useCallback } from 'react'
import { Play, Square } from 'lucide-react'
import {
  getState,
  getNextReminders,
  startOpMode,
  stopOpMode,
  setOnReminderFire,
  resumeOpMode,
  requestNotificationPermission,
  updateOpModeNotifications,
  getDefaultIntervals,
  type OpModeState,
  type OpModeIntervals,
  type NextReminder
} from '../lib/opModeTimers'
import { syncOpModeToNative, clearOpModeNativeSync } from '../lib/opModeNativeSync'
import { playOpModeReminder } from '../lib/audioCues'
import { initializeNotificationChannels } from '../lib/notifications'
import { hapticButtonPress } from '../lib/haptics'
import './OpMode.css'

const INTERVAL_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 20, label: '20 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
  { value: 90, label: '90 min' },
  { value: 120, label: '2 hours' }
]

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Due'
  const totalMin = Math.floor(ms / 60_000)
  const min = totalMin % 60
  const hr = Math.floor(totalMin / 60)
  if (hr > 0) return `${hr}h ${min}m`
  return `${min} min`
}

export default function OpMode() {
  const [state, setState] = useState<OpModeState | null>(() => getState())
  const [reminders, setReminders] = useState<NextReminder[]>(() => getNextReminders())
  const [notificationsEnabled, setNotificationsEnabled] = useState(state?.notificationsEnabled ?? false)
  const [intervals, setIntervals] = useState<OpModeIntervals>(() => getDefaultIntervals())
  const [liveAnnounce, setLiveAnnounce] = useState<string | null>(null)
  const [notificationError, setNotificationError] = useState<string | null>(null)

  // Initialize notification channels on mount
  useEffect(() => {
    initializeNotificationChannels()
  }, [])

  // When OpMode is active: resume timer and set fire callback. On unmount, clear callback so we don't hold references.
  useEffect(() => {
    if (state) {
      resumeOpMode()
      setOnReminderFire((type) => {
        const next = getNextReminders()
        setReminders(next)
        setLiveAnnounce(`Reminder: ${type}. Next in ${formatCountdown(next[0]?.inMs ?? 0)}`)
        playOpModeReminder()
        syncOpModeToNative(getState()).catch(() => {})
      })
    }
    return () => {
      setOnReminderFire(null)
    }
  }, [state])

  useEffect(() => {
    if (!state) return
    const id = setInterval(() => setReminders(getNextReminders()), 5_000)
    return () => clearInterval(id)
  }, [state])

  useEffect(() => {
    if (!liveAnnounce) return
    const id = setTimeout(() => setLiveAnnounce(null), 4000)
    return () => clearTimeout(id)
  }, [liveAnnounce])

  const handleStart = useCallback(() => {
    hapticButtonPress()
    const next = startOpMode(intervals, { notificationsEnabled })
    setState(next)
    setReminders(getNextReminders())
    syncOpModeToNative(next).catch(() => {})
  }, [intervals, notificationsEnabled])

  const handleStop = useCallback(() => {
    hapticButtonPress()
    stopOpMode()
    setState(null)
    setReminders([])
    clearOpModeNativeSync().catch(() => {})
  }, [])

  const handleToggleNotifications = useCallback(async () => {
    const next = !notificationsEnabled
    if (next) {
      const perm = await requestNotificationPermission()
      if (perm !== 'granted') {
        setNotificationError(
          perm === 'denied'
            ? 'Notification permission denied. Enable it in your browser settings to receive reminders.'
            : 'Notification permission not granted. Please enable it to receive reminders.'
        )
        setTimeout(() => setNotificationError(null), 5000)
        return
      }
      setNotificationError(null)
    }
    setNotificationsEnabled(next)
    if (state) updateOpModeNotifications(next)
  }, [notificationsEnabled, state])

  if (state) {
    const next = reminders[0]
    return (
      <div className="opmode">
        <h1 className="opmode-title">Op Mode</h1>
        <p className="opmode-tagline">Timer reminders for long ops.</p>

        <section className="opmode-status" aria-live="polite" aria-atomic="true">
          {liveAnnounce && (
            <output className="opmode-live" aria-live="polite">
              {liveAnnounce}
            </output>
          )}
          {next ? (
            <p className="opmode-next">
              Next: <strong>{next.label}</strong> in {formatCountdown(next.inMs)}
            </p>
          ) : (
            <p className="opmode-next">No upcoming reminders.</p>
          )}
        </section>

        <ul className="opmode-list" aria-label="Upcoming reminders">
          {reminders.map((r) => (
            <li key={r.type} className="opmode-item">
              <span className="opmode-item-label">{r.label}</span>
              <span className="opmode-item-time">{formatCountdown(r.inMs)}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="opmode-stop btn-danger"
          onClick={handleStop}
          aria-label="Stop Op Mode and clear timers"
        >
          <Square size={18} aria-hidden />
          Stop Op Mode
        </button>
      </div>
    )
  }

  return (
    <div className="opmode">
      <h1 className="opmode-title">Op Mode</h1>
      <p className="opmode-tagline">Get reminded to restock, hydrate, and refuel during long ops.</p>

      <section className="opmode-intervals" aria-label="Reminder intervals">
        <h2 className="opmode-section-title">Intervals</h2>
        <div className="opmode-row">
          <label htmlFor="opmode-restock" className="opmode-label">
            Restock
          </label>
          <select
            id="opmode-restock"
            value={intervals.restockIntervalMin}
            onChange={(e) =>
              setIntervals((p) => ({ ...p, restockIntervalMin: Number(e.target.value) }))
            }
            aria-label="Restock interval in minutes"
          >
            {INTERVAL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="opmode-row">
          <label htmlFor="opmode-hydrate" className="opmode-label">
            Hydrate
          </label>
          <select
            id="opmode-hydrate"
            value={intervals.hydrateIntervalMin}
            onChange={(e) =>
              setIntervals((p) => ({ ...p, hydrateIntervalMin: Number(e.target.value) }))
            }
            aria-label="Hydrate interval in minutes"
          >
            {INTERVAL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="opmode-row">
          <label htmlFor="opmode-refuel" className="opmode-label">
            Refuel
          </label>
          <select
            id="opmode-refuel"
            value={intervals.refuelIntervalMin}
            onChange={(e) =>
              setIntervals((p) => ({ ...p, refuelIntervalMin: Number(e.target.value) }))
            }
            aria-label="Refuel interval in minutes"
          >
            {INTERVAL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <div className="opmode-row opmode-notify">
        <input
          type="checkbox"
          id="opmode-notifications"
          checked={notificationsEnabled}
          onChange={handleToggleNotifications}
          aria-label="Enable browser notifications for reminders"
          aria-describedby={notificationError ? 'notification-error' : undefined}
        />
        <label htmlFor="opmode-notifications">Notify me (browser notifications)</label>
        {notificationError && (
          <p id="notification-error" className="opmode-error" role="alert">
            {notificationError}
          </p>
        )}
      </div>

      <button
        type="button"
        className="opmode-start btn-primary"
        onClick={handleStart}
        aria-label="Start Op Mode timers"
      >
        <Play size={20} aria-hidden />
        Start Op Mode
      </button>
    </div>
  )
}
