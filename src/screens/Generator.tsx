import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Star, Backpack } from 'lucide-react'
import { ships } from '../data/ships'
import { OPERATION_TYPES, CREW_ROLES, type OperationType, type CrewRole } from '../data/contexts'
import { generateChecklist } from '../lib/generateChecklist'
import { saveLastRun } from '../lib/presets'
import {
  pushRecentShip,
  getRecentShipIds,
  getFavoriteShipIds,
  toggleFavorite,
  isFavorite
} from '../lib/shipPreferences'
import { getContextWarnings } from '../lib/contextWarnings'
import {
  getPresetFromSearchParams,
  buildShareableUrl,
  encodePreset,
  type SharedPresetPayload
} from '../lib/presetShare'
import { getFrequentlyMissedTaskIds, getTaskLabel } from '../lib/runHistory'
import type { GeneratedChecklist } from '../lib/generateChecklist'
import type { GeneratorLocationState } from '../types/navigation'
import './Generator.css'

export default function Generator() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const state = location.state as GeneratorLocationState | null
  const preset = state?.preset
  const lastRun = state?.lastRun
  const urlPreset = useMemo(() => getPresetFromSearchParams(searchParams), [searchParams])
  const initial = urlPreset ?? preset ?? (state?.fromLastRun && lastRun ? lastRun : null)

  const [shipId, setShipId] = useState(initial?.shipId ?? 'cutlass-black')
  const [shipSearch, setShipSearch] = useState('')
  const [flightReadyOnly, setFlightReadyOnly] = useState(true)
  const [operationType, setOperationType] = useState<OperationType>(initial?.operationType ?? 'cargo-run')
  const [crewCount, setCrewCount] = useState(initial?.crewCount ?? 1)
  const [crewRoles, setCrewRoles] = useState<CrewRole[]>(initial?.crewRoles ?? ['pilot'])
  const [shareCopied, setShareCopied] = useState<'link' | 'code' | null>(null)
  const [showQr, setShowQr] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [prefsTick, setPrefsTick] = useState(0)

  const sharedPayload: SharedPresetPayload = useMemo(
    () => ({ shipId, operationType, crewCount, crewRoles }),
    [shipId, operationType, crewCount, crewRoles]
  )

  useEffect(() => {
    if (!urlPreset) return
    setShipId(urlPreset.shipId)
    setOperationType(urlPreset.operationType)
    setCrewCount(urlPreset.crewCount)
    setCrewRoles([...urlPreset.crewRoles])
  }, [urlPreset])

  useEffect(() => {
    if (!showQr) return
    const payload: SharedPresetPayload = { shipId, operationType, crewCount, crewRoles }
    const url = buildShareableUrl(payload)
    import('qrcode').then((QRCode) => QRCode.toDataURL(url, { width: 260, margin: 1 })).then(setQrDataUrl)
  }, [showQr, shipId, operationType, crewCount, crewRoles.join(',')])

  const closeQr = () => {
    setShowQr(false)
    setQrDataUrl(null)
  }

  const filteredShips = useMemo(() => {
    const q = shipSearch.trim().toLowerCase()
    return ships.filter((s) => {
      if (flightReadyOnly && s.status && s.status !== 'flight-ready') return false
      if (!q) return true
      return (
        s.name.toLowerCase().includes(q) ||
        (s.manufacturer?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [shipSearch, flightReadyOnly])

  const favoriteIds = useMemo(() => getFavoriteShipIds(), [prefsTick])
  const recentIds = useMemo(() => getRecentShipIds(), [prefsTick])

  const shipOptions = useMemo(() => {
    const selected = ships.find((s) => s.id === shipId)
    const inFiltered = (s: (typeof ships)[0]) => filteredShips.some((f) => f.id === s.id)
    const favShips = favoriteIds
      .map((id) => ships.find((s) => s.id === id))
      .filter((s): s is (typeof ships)[0] => !!s && inFiltered(s))
    const recentShips = recentIds
      .filter((id) => !favoriteIds.includes(id))
      .map((id) => ships.find((s) => s.id === id))
      .filter((s): s is (typeof ships)[0] => !!s && inFiltered(s))
    const rest = filteredShips.filter(
      (s) => !favoriteIds.includes(s.id) && !recentIds.includes(s.id)
    )
    const needSelected = selected && !filteredShips.some((s) => s.id === shipId)
    const shipsGroupOptions = needSelected ? [selected, ...filteredShips] : rest
    return { favShips, recentShips, shipsGroupOptions }
  }, [filteredShips, shipId, favoriteIds, recentIds])

  const toggleRole = (role: CrewRole) => {
    setCrewRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
  }

  const ship = useMemo(() => ships.find((s) => s.id === shipId) ?? null, [shipId])
  const contextWarnings = useMemo(() => {
    if (!ship) return { warnings: [] as string[], alerts: [] as string[] }
    return getContextWarnings(ship, operationType, crewCount, crewRoles)
  }, [ship, operationType, crewCount, crewRoles])

  const frequentlyMissed = useMemo(() => getFrequentlyMissedTaskIds(3), [])

  const handleGenerate = () => {
    pushRecentShip(shipId)
    const checklist: GeneratedChecklist = generateChecklist(shipId, operationType, crewRoles)
    saveLastRun({ shipId, operationType, crewCount, crewRoles })
    navigate('/checklist', {
      state: { checklist, shipId, operationType, crewRoles, contextWarnings }
    })
  }

  const handleToggleFavorite = () => {
    toggleFavorite(shipId)
    setPrefsTick((t) => t + 1)
  }

  const copyShareLink = async () => {
    const url = buildShareableUrl(sharedPayload)
    await navigator.clipboard.writeText(url)
    setShareCopied('link')
    setTimeout(() => setShareCopied(null), 2000)
  }

  const copyShareCode = async () => {
    const code = encodePreset(sharedPayload)
    await navigator.clipboard.writeText(code)
    setShareCopied('code')
    setTimeout(() => setShareCopied(null), 2000)
  }

  return (
    <div className="generator">
      <h1 className="generator-title">Generate Checklist</h1>

      <section className="generator-ship-card card" aria-labelledby="ship-section-label">
        <h2 id="ship-section-label" className="generator-section-label">Ship</h2>
        <input
          id="ship-search"
          type="search"
          className="generator-select generator-ship-search input"
          value={shipSearch}
          onChange={(e) => setShipSearch(e.target.value)}
          placeholder="Search by name or manufacturer…"
          aria-label="Search ships"
        />
        <label className="generator-filter-row">
          <input
            type="checkbox"
            checked={flightReadyOnly}
            onChange={(e) => setFlightReadyOnly(e.target.checked)}
            aria-label="Show only flight-ready ships"
          />
          <span>Flight ready only</span>
        </label>
        <div className="generator-ship-row">
          <select
            id="ship-picker"
            className="generator-select input"
            value={shipId}
            onChange={(e) => setShipId(e.target.value)}
            aria-label="Select ship"
          >
          {shipOptions.favShips.length > 0 && (
            <optgroup label="Favorites">
              {shipOptions.favShips.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.manufacturer ? ` · ${s.manufacturer}` : ''}
                </option>
              ))}
            </optgroup>
          )}
          {shipOptions.recentShips.length > 0 && (
            <optgroup label="Recent">
              {shipOptions.recentShips.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.manufacturer ? ` · ${s.manufacturer}` : ''}
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label="Ships">
            {shipOptions.shipsGroupOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.manufacturer ? ` · ${s.manufacturer}` : ''}
              </option>
            ))}
          </optgroup>
        </select>
        <button
          type="button"
          className="generator-favorite-btn"
          onClick={handleToggleFavorite}
          aria-label={isFavorite(shipId) ? 'Remove from favorites' : 'Add to favorites'}
          title={isFavorite(shipId) ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star size={22} fill={isFavorite(shipId) ? 'currentColor' : 'none'} />
        </button>
      </div>
      </section>

      <label className="generator-label">Operation type</label>
      <div className="generator-chips" role="group" aria-label="Operation type">
        {OPERATION_TYPES.map((op) => (
          <button
            key={op.id}
            type="button"
            className={'generator-chip' + (operationType === op.id ? ' active' : '')}
            onClick={() => setOperationType(op.id)}
            aria-pressed={operationType === op.id}
            aria-label={`Operation: ${op.label}`}
          >
            {op.label}
          </button>
        ))}
      </div>

      <label className="generator-label" htmlFor="crew-count">
        Crew count
      </label>
      <input
        id="crew-count"
        type="number"
        min={1}
        max={20}
        value={crewCount}
        onChange={(e) => setCrewCount(Number(e.target.value) || 1)}
        className="generator-input input"
        aria-label="Crew count"
      />

      {crewCount >= 1 && (
        <>
          <label className="generator-label">Crew roles</label>
          <div className="generator-roles" role="group" aria-label="Crew roles">
            {CREW_ROLES.map((r) => (
              <label key={r.id} className="generator-role">
                <input
                  type="checkbox"
                  checked={crewRoles.includes(r.id)}
                  onChange={() => toggleRole(r.id)}
                  aria-label={`Role: ${r.label}`}
                />
                <span>{r.label}</span>
              </label>
            ))}
          </div>
        </>
      )}

      {frequentlyMissed.length > 0 && (
        <div className="generator-frequently-missed" role="status" aria-live="polite">
          <p className="generator-frequently-missed-label">
            You often skip: {frequentlyMissed.map(getTaskLabel).join(', ')}
          </p>
        </div>
      )}

      {(contextWarnings.alerts.length > 0 || contextWarnings.warnings.length > 0) && (
        <div className="generator-context-warnings" role="alert" aria-live="polite">
          {contextWarnings.alerts.map((msg, i) => (
            <p key={`alert-${i}`} className="generator-context-alert">
              {msg}
            </p>
          ))}
          {contextWarnings.warnings.map((msg, i) => (
            <p key={`warn-${i}`} className="generator-context-warning">
              {msg}
            </p>
          ))}
        </div>
      )}

      <button
        className="generator-submit btn-primary"
        onClick={handleGenerate}
        aria-label="Generate checklist"
      >
        Generate
      </button>

      <div className="generator-share">
        <span className="generator-share-label">Share preset</span>
        <div className="generator-share-buttons">
          <button
            type="button"
            className="generator-share-btn"
            onClick={copyShareLink}
            aria-label="Copy share link"
          >
            {shareCopied === 'link' ? 'Copied' : 'Copy link'}
          </button>
          <button
            type="button"
            className="generator-share-btn"
            onClick={copyShareCode}
            aria-label="Copy share code"
          >
            {shareCopied === 'code' ? 'Copied' : 'Copy code'}
          </button>
          <button
            type="button"
            className="generator-share-btn"
            onClick={() => setShowQr(true)}
            aria-label="Show QR code to share to phone"
          >
            Share to phone
          </button>
        </div>
      </div>

      {showQr && (
        <div
          className="generator-qr-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="QR code for sharing to phone"
        >
          <div className="generator-qr-modal">
            <p className="generator-qr-title">Scan to open on your phone</p>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR code for preset link" className="generator-qr-image" />
            ) : (
              <span className="generator-qr-loading">Generating…</span>
            )}
            <button type="button" className="generator-qr-close" onClick={closeQr}>
              Close
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        className="generator-pack-link btn-ghost"
        onClick={() => navigate('/pack', { state: { crewRoles } })}
        aria-label="View pack list for selected roles"
      >
        <Backpack size={18} aria-hidden />
        View Pack List
      </button>
    </div>
  )
}
