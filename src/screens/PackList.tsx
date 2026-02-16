import { useState, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { Heart, Shield, Wrench, Crosshair, Package } from 'lucide-react'
import { loadLastRun } from '../lib/presets'
import { getLoadoutWithQuantities, LOADOUT_CATEGORY_LABELS } from '../data/loadouts'
import { normalizeToCrewRoleCounts } from '../lib/crewRoleCounts'
import type { PackListLocationState } from '../types/navigation'
import './PackList.css'

const CATEGORY_ICONS: Record<string, typeof Heart> = {
  medical: Heart,
  survival: Shield,
  tools: Wrench,
  ammo: Crosshair,
  utility: Package
}

export default function PackList() {
  const location = useLocation()
  const state = location.state as PackListLocationState | null
  const lastRun = loadLastRun()
  const crewRoleCounts = useMemo(
    () => normalizeToCrewRoleCounts(state ?? lastRun ?? {}),
    [state?.crewRoleCounts, state?.crewRoles, lastRun?.crewRoleCounts, lastRun?.crewRoles, lastRun?.crewCount]
  )
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const loadout = useMemo(() => getLoadoutWithQuantities(crewRoleCounts), [crewRoleCounts])

  const toggleItem = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const byCategory = useMemo(() => {
    const map = new Map<string, typeof loadout>()
    for (const item of loadout) {
      const list = map.get(item.category) ?? []
      list.push(item)
      map.set(item.category, list)
    }
    const order: (keyof typeof LOADOUT_CATEGORY_LABELS)[] = ['medical', 'survival', 'tools', 'ammo', 'utility']
    return order.filter((c) => map.has(c)).map((cat) => ({ category: cat, items: map.get(cat)! }))
  }, [loadout])

  const usingDefaultRoles =
    !state?.crewRoleCounts &&
    !state?.crewRoles?.length &&
    !lastRun?.crewRoleCounts &&
    (!lastRun || (lastRun.crewRoles?.length === 1 && lastRun.crewRoles[0] === 'pilot'))

  return (
    <div className="packlist">
      <h1 className="packlist-title">Pack List</h1>
      <p className="packlist-desc">Pull these from inventory before launch.</p>
      {usingDefaultRoles && (
        <p className="packlist-default-note" role="status">
          Using default (Pilot) loadout. Generate a checklist or pick roles on the Generate screen to
          see a role-specific pack list.
        </p>
      )}

      {byCategory.map(({ category, items }) => {
        const Icon = CATEGORY_ICONS[category] ?? Package
        return (
          <section key={category} className="packlist-section card" aria-label={LOADOUT_CATEGORY_LABELS[category]}>
            <h2 className="packlist-section-title">
              <Icon size={18} aria-hidden />
              {LOADOUT_CATEGORY_LABELS[category]}
            </h2>
            <ul className="packlist-list">
              {items.map((item) => (
                <li key={item.id} className="packlist-item">
                  <button
                    type="button"
                    className={'packlist-item-check' + (checked.has(item.id) ? ' checked' : '')}
                    onClick={() => toggleItem(item.id)}
                    aria-label={item.label}
                    aria-pressed={checked.has(item.id)}
                  >
                    {checked.has(item.id) ? '\u2713' : ''}
                  </button>
                  <span className={checked.has(item.id) ? 'packlist-item-label checked' : 'packlist-item-label'}>
                    {item.quantity > 1 ? `${item.quantity}\u00d7 ` : ''}{item.label}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )
      })}

      <p className="packlist-note">
        Generate a checklist from the Generate screen to see a role-specific pack list and save it
        for this session.
      </p>
    </div>
  )
}
