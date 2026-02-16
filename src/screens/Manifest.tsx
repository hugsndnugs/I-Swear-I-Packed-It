import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import CollapsibleSection from '../components/CollapsibleSection'
import type { CargoManifestEntry } from '../data/commodities'
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
  const [ships, setShips] = useState<typeof import('../data/ships').ships>([])
  const [routePresets, setRoutePresets] = useState<typeof import('../data/routes').ROUTE_PRESETS>([])
  const [commodities, setCommodities] = useState<typeof import('../data/commodities').COMMODITIES>([])
  const [getCommodityById, setGetCommodityById] = useState<typeof import('../data/commodities').getCommodityById>(() => () => undefined)
  const [getRouteById, setGetRouteById] = useState<typeof import('../data/routes').getRouteById>(() => () => undefined)

  // Lazy load data modules
  useEffect(() => {
    Promise.all([
      import('../data/ships').then(m => m.ships),
      import('../data/routes').then(m => ({ presets: m.ROUTE_PRESETS, getById: m.getRouteById })),
      import('../data/commodities').then(m => ({ commodities: m.COMMODITIES, getById: m.getCommodityById }))
    ]).then(([shipsData, routesData, commoditiesData]) => {
      setShips(shipsData)
      setRoutePresets(routesData.presets)
      setGetRouteById(() => routesData.getById)
      setCommodities(commoditiesData.commodities)
      setGetCommodityById(() => commoditiesData.getById)
    })
  }, [])

  useEffect(() => {
    if (commodities.length === 0) return
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
  }, [commodities])

  const ship = ships.find((s) => s.id === shipId)
  const handleGenerate = () => {
    if (!ship) return
    const entries = rows.map(toEntry)
    const r = validateManifest(ship, routeId === 'none' ? null : routeId, entries)
    setReport(r)
    saveLastManifest({ shipId, routeId: routeId === 'none' ? null : routeId, entries })
  }

  const addRow = () => {
    if (commodities.length === 0) return
    const first = commodities[0]
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

  const handleContinueToChecklist = () => {
    navigate('/generate', {
      state: {
        preset: {
          shipId,
          operationType: 'cargo-run' as const,
          crewCount: 1,
          crewRoles: ['pilot'] as const
        }
      }
    })
  }

  const buildManifestSummary = () => {
    const shipName = ship?.name ?? shipId
    const routeLabel = routeId === 'none' ? 'No route' : (getRouteById(routeId)?.label ?? routeId)
    const cargoLines = rows.map((r) => {
      const c = getCommodityById(r.commodityId)
      const scu = (c?.scuPerUnit ?? 1) * r.quantity
      return `  ${r.label}: ${r.quantity} (${scu} SCU)`
    })
    const reportLines: string[] = []
    if (report) {
      reportLines.push('', 'Validation report:')
      if (report.totalScuUsed != null && report.shipCargoScu != null) {
        reportLines.push(`  ${Math.ceil(report.totalScuUsed)} / ${report.shipCargoScu} SCU used`)
      }
      if (report.requiredTools.length > 0) {
        reportLines.push('  Required tools: ' + report.requiredTools.join(', '))
      }
      if (report.suggestedBackup.length > 0) {
        reportLines.push('  Suggested backup: ' + report.suggestedBackup.join(', '))
      }
      if (report.warnings.length > 0) {
        reportLines.push('  Warnings: ' + report.warnings.join('; '))
      }
      if (report.risks.length > 0) {
        reportLines.push('  Risks: ' + report.risks.join('; '))
      }
    }
    const lines = [
      'Cargo Manifest',
      '---------------',
      `Ship: ${shipName}`,
      `Route: ${routeLabel}`,
      '',
      'Cargo:',
      ...cargoLines,
      ...reportLines
    ]
    return lines.join('\n')
  }

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(buildManifestSummary())
    } catch {
      // Clipboard API not available or denied
    }
  }

  const handlePrint = () => {
    globalThis.print?.()
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
        {routePresets.map((r) => (
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
        <p className="manifest-empty">No cargo added. Add rows to build your manifest and validate tools and capacity.</p>
      ) : (
        <ul className="manifest-rows" aria-label="Cargo entries">
          {rows.map((row) => {
            const commodity = getCommodityById(row.commodityId)
            const scuPerUnit = commodity?.scuPerUnit ?? 1
            const rowScu = row.quantity * scuPerUnit
            return (
              <li key={row.id} className="manifest-row">
                <select
                  className="manifest-row-commodity"
                  value={row.commodityId}
                  onChange={(e) => onCommodityChange(row.id, e.target.value)}
                  aria-label="Commodity type"
                >
                  {commodities.map((c) => (
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
                <span className="manifest-row-scu" aria-hidden>
                  {rowScu} SCU
                </span>
                <button
                  type="button"
                  className="manifest-row-remove"
                  onClick={() => removeRow(row.id)}
                  aria-label="Remove row"
                >
                  Remove
                </button>
              </li>
            )
          })}
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
        <CollapsibleSection
          title="Validation report"
          sectionKey="manifest-report"
          defaultOpen
          alwaysOpen={false}
        >
          <div className="manifest-report">
            {report.totalScuUsed != null && report.shipCargoScu != null && (
              <p className="manifest-report-capacity" aria-live="polite">
                {Math.ceil(report.totalScuUsed)} / {report.shipCargoScu} SCU used
              </p>
            )}

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

            <div className="manifest-report-actions">
              <button
                type="button"
                className="manifest-continue-checklist btn-primary"
                onClick={handleContinueToChecklist}
                aria-label="Continue to checklist generator"
              >
                Continue to checklist
              </button>
              <button
                type="button"
                className="manifest-copy-summary btn-ghost"
                onClick={handleCopySummary}
                aria-label="Copy manifest summary"
              >
                Copy manifest summary
              </button>
              <button
                type="button"
                className="manifest-print btn-ghost"
                onClick={handlePrint}
                aria-label="Print manifest"
              >
                Print manifest
              </button>
            </div>
          </div>
        </CollapsibleSection>
      )}
    </div>
  )
}
