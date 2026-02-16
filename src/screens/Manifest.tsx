import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { ships } from '../data/ships'
import { ROUTE_PRESETS } from '../data/routes'
import { COMMODITIES, getCommodityById, type CargoManifestEntry } from '../data/commodities'
import { validateManifest, type ManifestValidationReport } from '../lib/validateManifest'
import { loadLastManifest, saveLastManifest } from '../lib/presets'
import './Manifest.css'

interface CargoRow {
  id: string
  commodityId: string
  label: string
  quantity: number
}

function toEntry(row: CargoRow): CargoManifestEntry {
  return { commodityId: row.commodityId, label: row.label, quantity: row.quantity }
}

export default function Manifest() {
  const navigate = useNavigate()
  const [shipId, setShipId] = useState('cutlass-black')
  const [routeId, setRouteId] = useState<string>('none')
  const [rows, setRows] = useState<CargoRow[]>([])
  const [report, setReport] = useState<ManifestValidationReport | null>(null)

  useEffect(() => {
    const last = loadLastManifest()
    if (last) {
      setShipId(last.shipId)
      setRouteId(last.routeId ?? 'none')
      setRows(
        last.entries.map((e, i) => ({
          id: `row-${i}-${e.commodityId}`,
          commodityId: e.commodityId,
          label: e.label,
          quantity: e.quantity
        }))
      )
    }
  }, [])

  const ship = ships.find((s) => s.id === shipId)
  const handleGenerate = () => {
    if (!ship) return
    const entries = rows.map(toEntry)
    const r = validateManifest(ship, routeId === 'none' ? null : routeId, entries)
    setReport(r)
    saveLastManifest({ shipId, routeId: routeId === 'none' ? null : routeId, entries })
  }

  const addRow = () => {
    const first = COMMODITIES[0]
    setRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}`,
        commodityId: first.id,
        label: first.label,
        quantity: 1
      }
    ])
  }

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  const updateRow = (id: string, updates: Partial<CargoRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    )
  }

  const onCommodityChange = (rowId: string, commodityId: string) => {
    const c = getCommodityById(commodityId)
    if (c) updateRow(rowId, { commodityId, label: c.label })
  }

  return (
    <div className="manifest">
      <h1 className="manifest-title">Cargo Manifest</h1>
      <p className="manifest-desc">Validate your load: required tools, backup gear, and risk prompts.</p>

      <label className="manifest-label" htmlFor="manifest-ship">
        Ship
      </label>
      <select
        id="manifest-ship"
        className="manifest-select"
        value={shipId}
        onChange={(e) => setShipId(e.target.value)}
        aria-label="Select ship"
      >
        {ships.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      <label className="manifest-label" htmlFor="manifest-route">
        Route (optional)
      </label>
      <select
        id="manifest-route"
        className="manifest-select"
        value={routeId}
        onChange={(e) => setRouteId(e.target.value)}
        aria-label="Select route"
      >
        {ROUTE_PRESETS.map((r) => (
          <option key={r.id} value={r.id}>
            {r.label}
          </option>
        ))}
      </select>

      <div className="manifest-cargo-header">
        <span className="manifest-label">Cargo</span>
        <button type="button" className="manifest-add-row btn-ghost" onClick={addRow} aria-label="Add cargo row">
          <Plus size={18} aria-hidden />
          Add row
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="manifest-empty">No cargo added. Add rows to validate tools and capacity.</p>
      ) : (
        <ul className="manifest-rows" aria-label="Cargo entries">
          {rows.map((row) => (
            <li key={row.id} className="manifest-row">
              <select
                className="manifest-row-commodity"
                value={row.commodityId}
                onChange={(e) => onCommodityChange(row.id, e.target.value)}
                aria-label="Commodity type"
              >
                {COMMODITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="manifest-row-qty"
                min={1}
                value={row.quantity}
                onChange={(e) => updateRow(row.id, { quantity: Number(e.target.value) || 1 })}
                aria-label="Quantity"
              />
              <button
                type="button"
                className="manifest-row-remove"
                onClick={() => removeRow(row.id)}
                aria-label="Remove row"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        className="manifest-submit btn-primary"
        onClick={handleGenerate}
        aria-label="Generate validation report"
      >
        Generate validation report
      </button>

      {report && (
        <section className="manifest-report" aria-labelledby="manifest-report-title">
          <h2 id="manifest-report-title" className="manifest-report-title">Validation report</h2>

          {report.requiredTools.length > 0 && (
            <section className="manifest-report-section" aria-label="Required tools">
              <h3 className="manifest-report-heading">Required tools</h3>
              <ul className="manifest-report-list">
                {report.requiredTools.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </section>
          )}

          {report.suggestedBackup.length > 0 && (
            <section className="manifest-report-section" aria-label="Suggested backup gear">
              <h3 className="manifest-report-heading">Suggested backup gear</h3>
              <ul className="manifest-report-list">
                {report.suggestedBackup.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </section>
          )}

          {report.warnings.length > 0 && (
            <section className="manifest-report-section manifest-report-warnings" aria-label="Warnings">
              <h3 className="manifest-report-heading">Warnings</h3>
              <ul className="manifest-report-list">
                {report.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </section>
          )}

          {report.risks.length > 0 && (
            <section className="manifest-report-section manifest-report-risks" aria-label="Risks">
              <h3 className="manifest-report-heading">Risks</h3>
              <ul className="manifest-report-list">
                {report.risks.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </section>
          )}

          {report.requiredTools.length === 0 &&
            report.suggestedBackup.length === 0 &&
            report.warnings.length === 0 &&
            report.risks.length === 0 && (
              <p className="manifest-report-clear">No issues found. Review required tools and backup gear above if shown.</p>
            )}

          <button
            type="button"
            className="manifest-back-checklist btn-ghost"
            onClick={() => navigate('/generate', { state: {} })}
            aria-label="Go to checklist generator"
          >
            Back to checklist
          </button>
        </section>
      )}
    </div>
  )
}
