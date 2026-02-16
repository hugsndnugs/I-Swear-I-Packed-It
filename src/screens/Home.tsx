import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Zap, Rocket, Timer, Link2, ChevronRight, FolderOpen, History, Ship } from 'lucide-react'
import FirstTimeTutorial, { getTutorialDone } from '../components/FirstTimeTutorial'
import { loadLastRun, loadPresets } from '../lib/presets'
import { generateChecklist } from '../lib/generateChecklist'
import { decodePreset, PRESET_DECODE_MAX_LENGTH } from '../lib/presetShare'
import { loadOrgPresets } from '../lib/orgPresets'
import { OPERATION_TYPES } from '../data/contexts'
import { getPirateSettings } from '../lib/pirateSettings'
import { pirateSpeak } from '../lib/pirateSpeak'
import EmptyState from '../components/EmptyState'
import SwipeableItem from '../components/SwipeableItem'
import Tooltip from '../components/Tooltip'
import { hapticButtonPress } from '../lib/haptics'
import { deletePreset } from '../lib/presets'
import { getRecentShipIds } from '../lib/shipPreferences'
import { getRecentRoutes } from '../lib/recentItems'
import { ROUTES } from '../constants/routes'
import FAB from '../components/FAB'
import './Home.css'

export default function Home() {
  const navigate = useNavigate()
  const [importCode, setImportCode] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const [, setTick] = useState(0)
  const [ships, setShips] = useState<typeof import('../data/ships').ships>([])
  const [showTutorial, setShowTutorial] = useState(false)
  const lastRun = loadLastRun()
  const presets = loadPresets()
  const orgPresets = loadOrgPresets()
  const ps = getPirateSettings().pirateSpeak

  useEffect(() => {
    const handler = () => setTick((t) => t + 1)
    window.addEventListener('pirate-settings-changed', handler)
    return () => window.removeEventListener('pirate-settings-changed', handler)
  }, [])

  // Lazy load ships
  useEffect(() => {
    import('../data/ships').then(m => setShips(m.ships))
  }, [])

  // Show first-time tutorial once per install
  useEffect(() => {
    if (!getTutorialDone()) {
      setShowTutorial(true)
    }
  }, [])

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

  const recentRouteEntries = getRecentRoutes().filter((e) => e.path !== ROUTES.HOME)
  const recentShipIds = getRecentShipIds()
  const recentShipsWithNames = recentShipIds.map((id) => ({
    id,
    name: ships.find((s) => s.id === id)?.name ?? id
  }))
  const hasRecent = recentRouteEntries.length > 0 || recentShipsWithNames.length > 0

  return (
    <div className="home">
      {showTutorial && (
        <FirstTimeTutorial onDismiss={() => setShowTutorial(false)} />
      )}
      <div className="home-hero">
        <img 
          src="/assets/logo.png" 
          alt="Pre-Flight Assistant" 
          className="home-logo"
        />
        <h1 className="home-title">{pirateSpeak('Pre-Flight Assistant', ps)}</h1>
        <p className="home-tagline">From hangar to hyperspace without the "oh no" moment.</p>
        <div className="home-actions">
          <Tooltip content="Pick a ship and operation to generate your checklist." position="bottom">
            <button
              className="home-cta btn-primary"
              onClick={() => {
                hapticButtonPress()
                navigate('/generate')
              }}
              aria-label="Start pre-flight checklist"
            >
              <Zap size={20} aria-hidden />
              {pirateSpeak('Start Pre-Flight', ps)}
            </button>
          </Tooltip>
          <a
            href="https://github.com/hugsndnugs/I-Swear-I-Packed-It/releases/latest/download/app-release.apk"
            className="home-android-download btn-secondary"
            aria-label="Download Android app"
            download
          >
            Download Android App
          </a>
        </div>
      </div>

      {lastShipName && lastRun && (
        <div className="home-quick-actions">
          <Tooltip content="Generate a new checklist with your last ship and operation." position="bottom">
            <button
              className="home-quick btn-secondary"
              onClick={() =>
                navigate('/generate', { state: { fromLastRun: true, lastRun } })
              }
              aria-label={`Quick-start with ${lastShipName}`}
            >
              <Rocket size={18} aria-hidden />
              {pirateSpeak('Quick-start', ps)}: {lastShipName}
            </button>
          </Tooltip>
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
                  crewRoles: lastRun.crewRoles,
                  crewRoleCounts: lastRun.crewRoleCounts
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

      {hasRecent && (
        <section className="home-recent card" aria-label="Recent items">
          <h2 className="home-presets-title">
            <History size={18} aria-hidden />
            {pirateSpeak('Recent', ps)}
          </h2>
          <div className="home-recent-grid">
            {recentShipsWithNames.length > 0 && (
              <div className="home-recent-group">
                <span className="home-recent-group-label">{pirateSpeak('Ships', ps)}</span>
                <ul className="home-recent-list" aria-label="Recent ships">
                  {recentShipsWithNames.map(({ id, name }) => (
                    <li key={id} style={{ listStyle: 'none' }}>
                      <button
                        type="button"
                        className="home-recent-btn card card-interactive"
                        onClick={() => {
                          hapticButtonPress()
                          navigate(ROUTES.GENERATE, { state: { preset: { shipId: id } } })
                        }}
                        aria-label={`Open generator for ${name}`}
                      >
                        <Ship size={16} aria-hidden />
                        {name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {recentRouteEntries.length > 0 && (
              <div className="home-recent-group">
                <span className="home-recent-group-label">{pirateSpeak('Screens', ps)}</span>
                <ul className="home-recent-list" aria-label="Recent screens">
                  {recentRouteEntries.map((e) => (
                    <li key={e.path} style={{ listStyle: 'none' }}>
                      <Link
                        to={e.path}
                        className="home-recent-btn card card-interactive"
                        onClick={() => hapticButtonPress()}
                        aria-label={`Go to ${e.label}`}
                      >
                        {e.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

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

      {presets.length > 0 ? (
        <section className="home-presets" aria-label="Saved presets">
          <h2 className="home-presets-title">{pirateSpeak('Presets', ps)}</h2>
          <ul className="home-presets-list">
            {presets.map((p) => {
              const shipName = ships.find((s) => s.id === p.shipId)?.name ?? p.shipId
              const opLabelRaw =
                OPERATION_TYPES.find((o) => o.id === p.operationType)?.label ?? p.operationType
              const opLabel = pirateSpeak(opLabelRaw, ps)
              return (
                <li key={p.id} style={{ listStyle: 'none' }}>
                  <SwipeableItem
                    onSwipeLeft={() => {
                      hapticButtonPress()
                      deletePreset(p.id)
                      setTick((t) => t + 1)
                    }}
                    swipeLeftLabel="Delete"
                  >
                    <button
                      className="home-preset-btn card card-interactive"
                      onClick={() =>
                        navigate('/generate', {
                          state: {
                            preset: {
                              shipId: p.shipId,
                              operationType: p.operationType,
                              crewCount: p.crewCount,
                              crewRoles: p.crewRoles,
                              crewRoleCounts: p.crewRoleCounts
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
                  </SwipeableItem>
                </li>
              )
            })}
          </ul>
        </section>
      ) : (
        <section className="home-presets" aria-label="Saved presets">
          <h2 className="home-presets-title">{pirateSpeak('Presets', ps)}</h2>
          <EmptyState
            icon={<FolderOpen size={48} />}
            title="No presets saved"
            description="Save your favorite ship and operation configurations for quick access."
            action={
              <button
                className="btn-secondary"
                onClick={() => {
                  hapticButtonPress()
                  navigate('/generate')
                }}
              >
                Create your first preset
              </button>
            }
          />
        </section>
      )}

      {orgPresets.length > 0 && (
        <section className="home-org-presets" aria-label="Org presets">
          <h2 className="home-presets-title">{pirateSpeak('Org Presets', ps)}</h2>
          <ul className="home-presets-list">
            {orgPresets.map((p) => {
              const shipName = ships.find((s) => s.id === p.shipId)?.name ?? p.shipId
              const opLabelRaw =
                OPERATION_TYPES.find((o) => o.id === p.operationType)?.label ?? p.operationType
              const opLabel = pirateSpeak(opLabelRaw, ps)
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
                            crewRoleCounts: p.crewRoleCounts,
                            locationId: p.locationId
                          }
                        }
                      })
                    }
                  >
                    <span className="home-preset-name">{p.name} {p.role ? `(${p.role})` : ''}</span>
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

      <FAB
        primary={{
          label: 'Start Pre-Flight',
          ariaLabel: 'Start pre-flight checklist',
          onClick: () => navigate(ROUTES.GENERATE),
          icon: Zap
        }}
        actions={[
          ...(lastRun && lastShipName
            ? [
                {
                  label: `Resume: ${lastShipName}`,
                  ariaLabel: `Resume checklist for ${lastShipName}`,
                  onClick: () => {
                    const checklist = generateChecklist(
                      lastRun.shipId,
                      lastRun.operationType,
                      lastRun.crewRoles
                    )
                    navigate(ROUTES.CHECKLIST, {
                      state: {
                        checklist,
                        shipId: lastRun.shipId,
                        operationType: lastRun.operationType,
                        crewRoles: lastRun.crewRoles,
                        crewRoleCounts: lastRun.crewRoleCounts
                      }
                    })
                  },
                  icon: ChevronRight
                }
              ]
            : []),
          {
            label: 'Op Mode',
            ariaLabel: 'Open Op Mode timers',
            onClick: () => navigate(ROUTES.OP_MODE),
            icon: Timer
          }
        ]}
      />
    </div>
  )
}
