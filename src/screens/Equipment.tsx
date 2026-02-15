import {
  getEquipmentByCategory,
  EQUIPMENT_CATEGORY_LABELS,
  type EquipmentCategory,
} from '../data/equipment'
import './Equipment.css'

const CATEGORY_ORDER: EquipmentCategory[] = [
  'medical',
  'survival',
  'tools',
  'ammo',
  'utility',
  'weapon',
  'armor',
]

export default function Equipment() {
  const byCategory = getEquipmentByCategory()

  return (
    <div className="equipment">
      <h1 className="equipment-title">Equipment Reference</h1>
      <p className="equipment-desc">
        In-world items and tools for pre-flight loadouts. Linked to checklist tasks where relevant.
      </p>

      {CATEGORY_ORDER.map((cat) => {
        const items = byCategory.get(cat) ?? []
        if (items.length === 0) return null
        return (
          <section
            key={cat}
            className="equipment-section"
            aria-label={EQUIPMENT_CATEGORY_LABELS[cat]}
          >
            <h2 className="equipment-section-title">{EQUIPMENT_CATEGORY_LABELS[cat]}</h2>
            <ul className="equipment-list">
              {items.map((item) => (
                <li key={item.id} className="equipment-item">
                  <span className="equipment-item-name">{item.name}</span>
                  {item.subCategory && (
                    <span className="equipment-item-sub">{item.subCategory}</span>
                  )}
                  {item.taskIds && item.taskIds.length > 0 && (
                    <span className="equipment-item-tasks" aria-label="Related checklist tasks">
                      → {item.taskIds.join(', ')}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
