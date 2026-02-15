import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { getLoadoutForRoles, LOADOUT_CATEGORY_LABELS } from '../data/loadouts'
import type { CrewRole } from '../data/contexts'
import type { PackListLocationState } from '../types/navigation'
import './PackList.css'

const DEFAULT_ROLES: CrewRole[] = ['pilot']

export default function PackList() {
  const location = useLocation()
  const state = location.state as PackListLocationState | null
  const crewRoles = state?.crewRoles ?? DEFAULT_ROLES

  const loadout = useMemo(() => getLoadoutForRoles(crewRoles), [crewRoles])

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

  const usingDefaultRoles = !state?.crewRoles || state.crewRoles.length === 0

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

      {byCategory.map(({ category, items }) => (
        <section key={category} className="packlist-section" aria-label={LOADOUT_CATEGORY_LABELS[category]}>
          <h2 className="packlist-section-title">{LOADOUT_CATEGORY_LABELS[category]}</h2>
          <ul className="packlist-list">
            {items.map((item) => (
              <li key={item.id} className="packlist-item">
                <span className="packlist-item-check" aria-hidden>□</span>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="packlist-note">
        Generate a checklist from the Generate screen to see a role-specific pack list and save it
        for this session.
      </p>
    </div>
  )
}
