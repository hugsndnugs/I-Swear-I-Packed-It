import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Zap, Rocket, Timer, Link2, ChevronRight } from 'lucide-react'
import { loadLastRun, loadPresets } from '../lib/presets'
import { generateChecklist } from '../lib/generateChecklist'
import { decodePreset, PRESET_DECODE_MAX_LENGTH } from '../lib/presetShare'
import { ships } from '../data/ships'
import { OPERATION_TYPES } from '../data/contexts'
import './Home.css'

export default function Home() {
  const navigate = useNavigate()
  const [importCode, setImportCode] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const lastRun = loadLastRun()
  const presets = loadPresets()

  const handleImportPreset = () => {
    const raw = importCode.trim()
    if (!raw) return
    setImportError(null)
    if (raw.length > PRESET_DECODE_MAX_LENGTH) {
      setImportError('Code or link too long.')
      return
    }
    let payload = decodePreset(raw)
    if (!payload) {
      try {
        const url = raw.startsWith('http') || raw.startsWith('/') ? new URL(raw, window.location.origin) : null
        if (url) {
          const presetParam = url.searchParams.get('preset')
          if (presetParam) payload = decodePreset(presetParam)
        }
      } catch {
        /* ignore */
      }
    }
    if (payload) {
      navigate('/generate', { state: { preset: payload } })
      setImportCode('')
    } else {
      setImportError('Invalid code or link. Paste a share code or full share link.')
    }
  }

  const lastShipName = lastRun
    ? ships.find((s) => s.id === lastRun.shipId)?.name ?? 'Last ship'
    : null

  return (
    <div className="home">
      <div className="home-hero">
        <h1 className="home-title">Pre-Flight Assistant</h1>
        <p className="home-tagline">From hangar to hyperspace without the "oh no" moment.</p>
        <button
          className="home-cta btn-primary"
          onClick={() => navigate('/generate')}
          aria-label="Start pre-flight checklist"
        >
          <Zap size={20} aria-hidden />
          Start Pre-Flight
        </button>
      </div>

      {lastShipName && lastRun && (
        <div className="home-quick-actions">
          <button
            className="home-quick btn-secondary"
            onClick={() =>
              navigate('/generate', { state: { fromLastRun: true, lastRun } })
            }
            aria-label={`Quick-start with ${lastShipName}`}
          >
            <Rocket size={18} aria-hidden />
            Quick-start: {lastShipName}
          </button>
          <button
            className="home-resume btn-secondary"
            onClick={() => {
              const checklist = generateChecklist(
                lastRun.shipId,
                lastRun.operationType,
                lastRun.crewRoles
              )
              navigate('/checklist', {
                state: {
                  checklist,
                  shipId: lastRun.shipId,
                  operationType: lastRun.operationType,
                  crewRoles: lastRun.crewRoles
                }
              })
            }}
            aria-label={`Resume checklist for ${lastShipName}`}
          >
            <ChevronRight size={18} aria-hidden />
            Resume checklist
          </button>
        </div>
      )}

      <Link
        to="/op-mode"
        className="home-opmode btn-secondary"
        aria-label="Open Op Mode timers for restock, hydrate, refuel reminders"
      >
        <Timer size={18} aria-hidden />
        Op Mode — Start timers
      </Link>

      <section className="home-import card" aria-label="Import shared preset">
        <h2 className="home-import-title">
          <Link2 size={18} aria-hidden />
          Import shared preset
        </h2>
        <p className="home-import-hint">Paste a share code or link from someone else.</p>
        <div className="home-import-row">
          <input
            type="text"
            className="home-import-input"
            value={importCode}
            onChange={(e) => {
              setImportCode(e.target.value)
              setImportError(null)
            }}
            placeholder="Paste code or link"
            aria-label="Share code or link"
            aria-invalid={!!importError}
            aria-describedby={importError ? 'import-error' : undefined}
          />
          <button
            type="button"
            className="home-import-btn btn-primary"
            onClick={handleImportPreset}
            aria-label="Open shared preset"
          >
            Open
          </button>
        </div>
        {importError && (
          <p id="import-error" className="home-import-error" role="alert">
            {importError}
          </p>
        )}
      </section>

      {presets.length > 0 && (
        <section className="home-presets" aria-label="Saved presets">
          <h2 className="home-presets-title">Presets</h2>
          <ul className="home-presets-list">
            {presets.map((p) => {
              const shipName = ships.find((s) => s.id === p.shipId)?.name ?? p.shipId
              const opLabel =
                OPERATION_TYPES.find((o) => o.id === p.operationType)?.label ?? p.operationType
              return (
                <li key={p.id}>
                  <button
                    className="home-preset-btn card card-interactive"
                    onClick={() =>
                      navigate('/generate', {
                        state: {
                          preset: {
                            shipId: p.shipId,
                            operationType: p.operationType,
                            crewCount: p.crewCount,
                            crewRoles: p.crewRoles
                          }
                        }
                      })
                    }
                  >
                    <span className="home-preset-name">{p.name}</span>
                    <span className="home-preset-subtitle">
                      {shipName} · {opLabel}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
