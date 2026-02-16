import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { CheckCheck, ChevronRight } from 'lucide-react'
import type { ChecklistSection, ChecklistTask } from '../lib/generateChecklist'
import ProgressBar from '../components/ProgressBar'
import {
  savePreset,
  loadChecklistProgress,
  saveChecklistProgress,
  checklistProgressMatches
} from '../lib/presets'
import { recordRun } from '../lib/runHistory'
import { roleCountsToRoles, totalCrew, normalizeToCrewRoleCounts } from '../lib/crewRoleCounts'
import { CREW_ROLES, OPERATION_TYPES } from '../data/contexts'
import { buildShareableUrl, getPresetFromSearchParams } from '../lib/presetShare'
import { generateChecklist } from '../lib/generateChecklist'
import { getPirateSettings } from '../lib/pirateSettings'
import { pirateSpeak } from '../lib/pirateSpeak'
import { getChecklistState } from '../lib/locationState'
import { ROUTES } from '../constants/routes'
import { getLocationById } from '../data/contexts'
import './Checklist.css'

export default function Checklist() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const state = getChecklistState(location)
  
  // Try to get state from URL params if not in location.state
  const urlPreset = useMemo(() => getPresetFromSearchParams(searchParams), [searchParams])
  const urlChecklist = useMemo(() => {
    if (!urlPreset) return null
    const crewRoles = urlPreset.crewRoles ?? roleCountsToRoles(normalizeToCrewRoleCounts(urlPreset))
    const location = urlPreset.locationId ? getLocationById(urlPreset.locationId) : null
    return generateChecklist(urlPreset.shipId, urlPreset.operationType, crewRoles, location)
  }, [urlPreset])

  const checklist = state?.checklist ?? urlChecklist
  const crewRoles = useMemo(
    () =>
      state?.crewRoles ??
      urlPreset?.crewRoles ??
      (state?.crewRoleCounts ? roleCountsToRoles(state.crewRoleCounts) : 
       urlPreset?.crewRoleCounts ? roleCountsToRoles(normalizeToCrewRoleCounts(urlPreset)) : undefined),
    [state?.crewRoles, state?.crewRoleCounts, urlPreset]
  )
  const crewCount = useMemo(
    () => (state?.crewRoleCounts ? totalCrew(state.crewRoleCounts) : (crewRoles?.length ?? 1)),
    [state?.crewRoleCounts, crewRoles?.length]
  )
  const shipId = state?.shipId ?? urlPreset?.shipId
  const operationType = state?.operationType ?? urlPreset?.operationType
  const locationId = state?.locationId ?? urlPreset?.locationId
  const selectedLocation = locationId ? getLocationById(locationId) : null
  const context =
    shipId && operationType && crewRoles
      ? { shipId, operationType, crewRoles }
      : null

  const [completed, setCompleted] = useState<Set<string>>(() => {
    if (!checklist || !context) return new Set()
    const progress = loadChecklistProgress()
    if (!progress || !checklistProgressMatches(progress, context)) return new Set()
    const allTaskIds = checklist.sections.flatMap((s) => s.tasks.map((t) => t.id))
    const valid = progress.completedIds.filter((id) => allTaskIds.includes(id))
    return new Set(valid)
  })

  const [activeSectionIndex, setActiveSectionIndex] = useState(0)
  const [saveName, setSaveName] = useState('')
  const [showSave, setShowSave] = useState(false)
  const [exportCopied, setExportCopied] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [, setPirateTick] = useState(0)
  const [ships, setShips] = useState<typeof import('../data/ships').ships>([])
  const savePresetButtonRef = useRef<HTMLButtonElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const runRecordRef = useRef<{ completed: Set<string>; allTaskIds: string[] } | null>(null)
  const tabListRef = useRef<HTMLDivElement>(null)
  const tabRefsRef = useRef<(HTMLButtonElement | null)[]>([])
  const ps = getPirateSettings().pirateSpeak

  useEffect(() => {
    const handler = () => setPirateTick((t) => t + 1)
    window.addEventListener('pirate-settings-changed', handler)
    return () => window.removeEventListener('pirate-settings-changed', handler)
  }, [])

  // Lazy load ships
  useEffect(() => {
    import('../data/ships').then(m => setShips(m.ships))
  }, [])

  useEffect(() => {
    if (!checklist) {
      navigate(ROUTES.HOME, { replace: true })
    }
  }, [checklist, navigate])

  useEffect(() => {
    if (checklist) setActiveSectionIndex(0)
  }, [checklist])

  useEffect(() => {
    if (!checklist || checklist.sections.length === 0) return
    const section = checklist.sections[activeSectionIndex]
    if (!section) return
    const taskIds = section.tasks.map((t) => t.id)
    const allDoneInSection = taskIds.length > 0 && taskIds.every((id) => completed.has(id))
    if (allDoneInSection && activeSectionIndex < checklist.sections.length - 1) {
      const nextIndex = Math.min(activeSectionIndex + 1, checklist.sections.length - 1)
      setActiveSectionIndex(nextIndex)
      queueMicrotask(() => {
        tabRefsRef.current[nextIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      })
    }
  }, [checklist, activeSectionIndex, completed])

  useEffect(() => {
    if (!checklist || !state?.shipId || !state?.operationType || !crewRoles) return
    saveChecklistProgress({
      shipId: state.shipId,
      operationType: state.operationType,
      crewRoles,
      completedIds: [...completed]
    })
  }, [completed, checklist, state?.shipId, state?.operationType, crewRoles])

  if (checklist && context) {
    const allTaskIds = checklist.sections.flatMap((s) => s.tasks.map((t) => t.id))
    runRecordRef.current = { completed, allTaskIds }
  }

  useEffect(() => {
    return () => {
      const ref = runRecordRef.current
      if (ref && context) {
        recordRun(context, [...ref.completed], ref.allTaskIds)
      }
    }
  }, [context])

  useEffect(() => {
    if (!showQr || !state?.shipId || !state?.operationType || !crewRoles) return
    const payload = {
      shipId: state.shipId,
      operationType: state.operationType,
      crewCount,
      crewRoles
    }
    const url = buildShareableUrl(payload)
    import('qrcode').then((QRCode) => QRCode.toDataURL(url, { width: 260, margin: 1 })).then(setQrDataUrl)
  }, [showQr, state?.shipId, state?.operationType, crewRoles, crewCount])

  const closeQr = () => {
    setShowQr(false)
    setQrDataUrl(null)
  }

  const shipName = state?.shipId ? ships.find((s) => s.id === state.shipId)?.name ?? state.shipId : '—'
  const opLabelRaw = state?.operationType
    ? OPERATION_TYPES.find((o) => o.id === state.operationType)?.label ?? state.operationType
    : '—'
  const opLabel = pirateSpeak(opLabelRaw, ps)
  const locationLabel = selectedLocation ? selectedLocation.label : null

  const copyExportSummary = async () => {
    if (!checklist || !state?.shipId || !state?.operationType) return
    const allIds = checklist.sections.flatMap((s) => s.tasks.map((t) => t.id))
    const done = allIds.filter((id) => completed.has(id)).length
    const total = allIds.length
    const date = new Date().toISOString().slice(0, 10)
    const locationText = locationLabel ? ` · ${locationLabel}` : ''
    const summary = `Pre-Flight Checklist — ${shipName} · ${opLabel}${locationText} — ${done}/${total} complete — ${date}`
    await navigator.clipboard.writeText(summary)
    setExportCopied(true)
    setTimeout(() => setExportCopied(false), 2000)
  }

  const closeSaveModal = () => {
    setShowSave(false)
    setSaveName('')
    const btn = savePresetButtonRef.current
    if (btn) setTimeout(() => btn.focus(), 0)
  }

  useEffect(() => {
    if (!showSave || !modalRef.current) return
    const modal = modalRef.current
    const focusable = modal.querySelectorAll<HTMLElement>(
      'input:not([disabled]), button:not([disabled])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    first?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeSaveModal()
        return
      }
      if (e.key !== 'Tab') return
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }
    modal.addEventListener('keydown', handleKeyDown)
    return () => modal.removeEventListener('keydown', handleKeyDown)
  }, [showSave])

  const titleRef = useRef<HTMLHeadingElement>(null)

  // Focus main heading on mount for accessibility
  useEffect(() => {
    if (checklist && titleRef.current) {
      titleRef.current.focus()
    }
  }, [checklist])

  if (!checklist) return null

  const allTaskIds = checklist.sections.flatMap((s) => s.tasks.map((t) => t.id))
  const completedCount = allTaskIds.filter((id) => completed.has(id)).length
  const totalCount = allTaskIds.length
  const criticalSection = checklist.sections.find((s) => s.id === 'critical')
  const criticalTaskIds = criticalSection?.tasks.map((t) => t.id) ?? []
  const criticalDone = criticalTaskIds.length > 0 && criticalTaskIds.every((id) => completed.has(id))
  const allDone = totalCount > 0 && completedCount === totalCount

  const toggleTask = (id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const markSectionComplete = (section: ChecklistSection) => {
    setCompleted((prev) => {
      const next = new Set(prev)
      section.tasks.forEach((t) => next.add(t.id))
      return next
    })
  }

  const handleSavePreset = () => {
    if (!saveName.trim() || !state?.shipId || !state?.operationType || !crewRoles) return
    savePreset({
      name: saveName.trim(),
      shipId: state.shipId,
      operationType: state.operationType,
      crewCount,
      crewRoles,
      ...(state?.crewRoleCounts && { crewRoleCounts: state.crewRoleCounts })
    })
    closeSaveModal()
  }

  const roleProgress = checklist.crewRoles.map((roleId) => {
    const roleLabel = CREW_ROLES.find((r) => r.id === roleId)?.label ?? roleId
    const roleTaskIds = checklist.sections.flatMap((s) =>
      s.tasks.filter((t) => t.role === roleId).map((t) => t.id)
    )
    const done = roleTaskIds.filter((id) => completed.has(id)).length
    const total = roleTaskIds.length
    const green = total > 0 && done === total
    return { roleId, roleLabel, done, total, green }
  }).filter((r) => r.total > 0)

  const contextWarnings = state?.contextWarnings

  return (
    <div className="checklist">
      <div className="checklist-header">
        <h1 ref={titleRef} className="checklist-title" tabIndex={-1}>Pre-Flight Checklist</h1>
        {locationLabel && (
          <p className="checklist-location" aria-label="Location">
            Location: {locationLabel}
          </p>
        )}
        <ProgressBar value={completedCount} max={totalCount} aria-label="Checklist progress" />
      </div>

      {contextWarnings && (contextWarnings.alerts.length > 0 || contextWarnings.warnings.length > 0) && (
        <div className="checklist-context-warnings" role="status" aria-live="polite">
          {contextWarnings.alerts.map((msg, i) => (
            <p key={`alert-${i}`} className="checklist-context-alert">
              {msg}
            </p>
          ))}
          {contextWarnings.warnings.map((msg, i) => (
            <p key={`warn-${i}`} className="checklist-context-warning">
              {msg}
            </p>
          ))}
        </div>
      )}

      <div
        ref={tabListRef}
        className="checklist-tabs"
        role="tablist"
        aria-label="Checklist sections"
      >
        {checklist.sections.map((section, idx) => {
          const sectionTaskIds = section.tasks.map((t) => t.id)
          const done = sectionTaskIds.filter((id) => completed.has(id)).length
          const total = sectionTaskIds.length
          const isActive = idx === activeSectionIndex
          return (
            <button
              key={section.id}
              ref={(el) => { tabRefsRef.current[idx] = el }}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`checklist-panel-${section.id}`}
              id={`checklist-tab-${section.id}`}
              tabIndex={isActive ? 0 : -1}
              className={'checklist-tab' + (isActive ? ' checklist-tab--active' : '')}
              onClick={() => setActiveSectionIndex(idx)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft' && idx > 0) {
                  e.preventDefault()
                  setActiveSectionIndex(idx - 1)
                  tabRefsRef.current[idx - 1]?.focus()
                } else if (e.key === 'ArrowRight' && idx < checklist.sections.length - 1) {
                  e.preventDefault()
                  setActiveSectionIndex(idx + 1)
                  tabRefsRef.current[idx + 1]?.focus()
                }
              }}
            >
              <span className="checklist-tab-label">{pirateSpeak(section.label, ps)}</span>
              <span className="checklist-tab-progress" aria-hidden>
                {done}/{total}
              </span>
            </button>
          )
        })}
      </div>

      {roleProgress.length > 0 && (
        <div
          className="checklist-readiness"
          aria-label="Crew readiness"
          aria-live="polite"
          aria-atomic="true"
        >
          <h2 className="checklist-readiness-title">{pirateSpeak('Crew readiness', ps)}</h2>
          <ul className="checklist-readiness-list">
            {roleProgress.map((r) => (
              <li key={r.roleId} className={r.green ? 'ready' : ''}>
                <span className="checklist-readiness-dot" aria-hidden />
                {r.roleLabel}: {r.done}/{r.total}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(allDone || criticalDone) && (
        <div className="checklist-ready" role="status" aria-live="polite" aria-atomic="true">
          {allDone ? 'Ready to Launch ✅' : 'Critical complete — review rest when ready'}
        </div>
      )}

      {checklist.sections.map((section, idx) => {
        const isActive = idx === activeSectionIndex
        return (
          <div
            key={section.id}
            id={`checklist-panel-${section.id}`}
            role="tabpanel"
            aria-labelledby={`checklist-tab-${section.id}`}
            hidden={!isActive}
            className="checklist-panel"
          >
            <div className="checklist-panel-header">
              <h2 className="checklist-panel-title">{pirateSpeak(section.label, ps)}</h2>
              <button
                type="button"
                className="checklist-mark-all btn-ghost"
                onClick={() => markSectionComplete(section)}
                aria-label={`Mark all ${section.label} complete`}
              >
                <CheckCheck size={18} aria-hidden />
                Mark all
              </button>
            </div>
            <ul className="checklist-tasks">
              {section.tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  completed={completed.has(task.id)}
                  onToggle={() => toggleTask(task.id)}
                />
              ))}
            </ul>
          </div>
        )
      })}

      <div className="checklist-actions">
        <button
          type="button"
          className="checklist-back-generator btn-ghost"
          onClick={() => navigate('/generate')}
          aria-label="Back to Generator"
        >
          <ChevronRight size={18} className="checklist-back-icon" aria-hidden />
          {pirateSpeak('Back to Generator', ps)}
        </button>
        <button
          ref={savePresetButtonRef}
          type="button"
          className="checklist-save-preset btn-ghost"
          onClick={() => setShowSave(true)}
          aria-label="Save as preset"
        >
          Save as preset
        </button>
        <button
          type="button"
          className="checklist-export-btn btn-ghost"
          onClick={copyExportSummary}
          aria-label="Copy checklist summary"
        >
          {exportCopied ? 'Copied' : 'Export summary'}
        </button>
        {state?.shipId && state?.operationType && crewRoles && (
          <button
            type="button"
            className="checklist-share-phone-btn btn-ghost"
            onClick={() => setShowQr(true)}
            aria-label="Show QR code to share to phone"
          >
            Share to phone
          </button>
        )}
        {crewRoles && crewRoles.length > 0 && (
          <button
            type="button"
            className="checklist-pack-link btn-ghost"
            onClick={() =>
              navigate('/pack', {
                state: { crewRoles, crewRoleCounts: state?.crewRoleCounts }
              })
            }
            aria-label="View pack list"
          >
            {pirateSpeak('View Pack List', ps)}
          </button>
        )}
      </div>

      {showQr && (
        <div
          className="checklist-qr-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="QR code for sharing to phone"
        >
          <div className="checklist-qr-modal">
            <p className="checklist-qr-title">Scan to open this preset on your phone</p>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR code for preset link" className="checklist-qr-image" />
            ) : (
              <span className="checklist-qr-loading">Generating…</span>
            )}
            <button type="button" className="checklist-qr-close" onClick={closeQr}>
              Close
            </button>
          </div>
        </div>
      )}

      {showSave && (
        <div
          ref={modalRef}
          className="checklist-save-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="preset-name-label"
        >
          <label id="preset-name-label" htmlFor="preset-name">Preset name</label>
          <input
            id="preset-name"
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="e.g. C2 Cargo Run"
            aria-label="Preset name"
          />
          <div className="checklist-save-buttons">
            <button type="button" onClick={closeSaveModal}>
              Cancel
            </button>
            <button type="button" onClick={handleSavePreset} disabled={!saveName.trim()}>
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function TaskRow({
  task,
  completed,
  onToggle
}: {
  task: ChecklistTask
  completed: boolean
  onToggle: () => void
}) {
  return (
    <li>
      <button
        type="button"
        className={'checklist-task' + (completed ? ' completed' : '')}
        onClick={onToggle}
        aria-label={task.label}
        aria-pressed={completed}
      >
        <span className="checklist-task-check" aria-hidden>
          {completed ? '\u2713' : ''}
        </span>
        <span className="checklist-task-label">{task.label}</span>
      </button>
    </li>
  )
}
