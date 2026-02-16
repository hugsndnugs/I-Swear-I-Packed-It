import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Ship, FileText, Wrench, Layout } from 'lucide-react'
import { loadPresets } from '../lib/presets'
import { searchGlobal, type GlobalSearchResult } from '../lib/globalSearch'
import { ROUTES } from '../constants/routes'
import { hapticButtonPress } from '../lib/haptics'
import type { ShipProfile } from '../data/shipTypes'
import type { EquipmentItem } from '../data/equipment'
import './GlobalSearch.css'

const DEBOUNCE_MS = 250

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [ships, setShips] = useState<ShipProfile[]>([])
  const [equipment, setEquipment] = useState<EquipmentItem[]>([])
  const [result, setResult] = useState<GlobalSearchResult | null>(null)
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Load ships and equipment when overlay opens
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    Promise.all([
      import('../data/ships').then((m) => m.ships),
      import('../data/equipment').then((m) => m.equipmentCatalog),
    ]).then(([shipsData, equipmentData]) => {
      if (!cancelled) {
        setShips(shipsData)
        setEquipment(equipmentData)
      }
    })
    return () => {
      cancelled = true
    }
  }, [isOpen])

  // Debounce query
  useEffect(() => {
    if (!isOpen) return
    const id = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [isOpen, query])

  // Run search when debounced query or data changes
  useEffect(() => {
    if (!isOpen) return
    const presets = loadPresets()
    const next = searchGlobal(debouncedQuery, { ships, presets, equipment })
    setResult(next)
  }, [isOpen, debouncedQuery, ships, equipment])

  // Focus input when opened; reset query when closed
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setDebouncedQuery('')
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [isOpen])

  // Escape closes
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleSelect = useCallback(
    (action: () => void) => {
      hapticButtonPress()
      action()
      onClose()
    },
    [onClose]
  )

  if (!isOpen) return null

  return (
    <div className="global-search-overlay">
      <div className="global-search-backdrop" onClick={onClose} aria-hidden />
      <div
        className="global-search-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Global search"
      >
        <div className="global-search-input-wrap">
          <Search size={20} className="global-search-icon" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            className="global-search-input"
            placeholder="Search ships, presets, equipment, screens…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search"
            autoComplete="off"
          />
        </div>
        <div className="global-search-results">
          {result && (
            <>
              {result.screens.length > 0 && (
                <section className="global-search-group" aria-label="Screens">
                  <h3 className="global-search-group-title">
                    <Layout size={16} aria-hidden />
                    Screens
                  </h3>
                  <ul className="global-search-list">
                    {result.screens.map((hit) => (
                      <li key={hit.path}>
                        <button
                          type="button"
                          className="global-search-item"
                          onClick={() =>
                            handleSelect(() => navigate(hit.path))
                          }
                        >
                          {hit.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {result.ships.length > 0 && (
                <section className="global-search-group" aria-label="Ships">
                  <h3 className="global-search-group-title">
                    <Ship size={16} aria-hidden />
                    Ships
                  </h3>
                  <ul className="global-search-list">
                    {result.ships.map((hit) => (
                      <li key={hit.id}>
                        <button
                          type="button"
                          className="global-search-item"
                          onClick={() =>
                            handleSelect(() =>
                              navigate(ROUTES.GENERATE, {
                                state: { preset: { shipId: hit.id } },
                              })
                            )
                          }
                        >
                          {hit.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {result.presets.length > 0 && (
                <section className="global-search-group" aria-label="Presets">
                  <h3 className="global-search-group-title">
                    <FileText size={16} aria-hidden />
                    Presets
                  </h3>
                  <ul className="global-search-list">
                    {result.presets.map((hit) => (
                      <li key={hit.id}>
                        <button
                          type="button"
                          className="global-search-item"
                          onClick={() =>
                            handleSelect(() =>
                              navigate(ROUTES.GENERATE, {
                                state: {
                                  preset: {
                                    shipId: hit.preset.shipId,
                                    operationType: hit.preset.operationType,
                                    crewCount: hit.preset.crewCount,
                                    crewRoles: hit.preset.crewRoles,
                                    crewRoleCounts: hit.preset.crewRoleCounts,
                                  },
                                },
                              })
                            )
                          }
                        >
                          {hit.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {result.equipment.length > 0 && (
                <section className="global-search-group" aria-label="Equipment">
                  <h3 className="global-search-group-title">
                    <Wrench size={16} aria-hidden />
                    Equipment
                  </h3>
                  <ul className="global-search-list">
                    {result.equipment.map((hit) => (
                      <li key={hit.id}>
                        <button
                          type="button"
                          className="global-search-item"
                          onClick={() =>
                            handleSelect(() => navigate(ROUTES.EQUIPMENT))
                          }
                        >
                          {hit.name}
                          <span className="global-search-item-meta">
                            {hit.category}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {debouncedQuery &&
                result.ships.length === 0 &&
                result.presets.length === 0 &&
                result.equipment.length === 0 &&
                result.screens.length === 0 && (
                  <p className="global-search-empty" role="status">
                    No results for "{query}"
                  </p>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
