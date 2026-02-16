import { useState, useEffect, useCallback } from 'react'
import { Heart, Shield, Wrench, Crosshair, Package, Swords, ShieldCheck } from 'lucide-react'
import {
  getEquipmentByCategory,
  EQUIPMENT_CATEGORY_LABELS,
  SUB_CATEGORY_LABELS,
  type EquipmentItem,
  type EquipmentCategory,
} from '../data/equipment'
import { tasks } from '../data/tasks'
import PullToRefresh from '../components/PullToRefresh'
import VirtualList from '../components/VirtualList'
import './Equipment.css'

const VIRTUAL_LIST_THRESHOLD = 25
const VIRTUAL_LIST_HEIGHT = 320

const TASK_LABEL_BY_ID = Object.fromEntries(tasks.map((t) => [t.id, t.label]))

const CATEGORY_ICONS: Record<EquipmentCategory, typeof Heart> = {
  medical: Heart,
  survival: Shield,
  tools: Wrench,
  ammo: Crosshair,
  utility: Package,
  weapon: Swords,
  armor: ShieldCheck
}

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
  const [byCategory, setByCategory] = useState<ReturnType<typeof getEquipmentByCategory>>(new Map())

  const loadData = useCallback(() => {
    return import('../data/equipment').then((m) => {
      setByCategory(m.getEquipmentByCategory())
    })
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const dataReady = byCategory.size > 0

  if (!dataReady) {
    return (
      <div className="equipment">
        <h1 className="equipment-title">Equipment Reference</h1>
        <div className="loading" aria-live="polite">
          <span className="loading-spinner" aria-hidden />
          <span>Loading equipment…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="equipment">
      <PullToRefresh onRefresh={loadData}>
        <h1 className="equipment-title">Equipment Reference</h1>
        <p className="equipment-desc">
          Star Citizen in-world items and tools for pre-flight loadouts. Linked to checklist tasks where relevant.
        </p>

        {CATEGORY_ORDER.map((cat) => {
          const items = byCategory.get(cat) ?? []
          if (items.length === 0) return null
          const Icon = CATEGORY_ICONS[cat]
          return (
            <section
              key={cat}
              className="equipment-section card"
              aria-label={EQUIPMENT_CATEGORY_LABELS[cat]}
            >
              <h2 className="equipment-section-title">
                {Icon && <Icon size={18} aria-hidden />}
                {EQUIPMENT_CATEGORY_LABELS[cat]}
              </h2>
              {items.length > VIRTUAL_LIST_THRESHOLD ? (
                <VirtualList<EquipmentItem>
                  items={items}
                  estimateSize={56}
                  height={VIRTUAL_LIST_HEIGHT}
                  getItemKey={(item) => item.id}
                  ariaLabel={EQUIPMENT_CATEGORY_LABELS[cat]}
                  role="list"
                  className="equipment-list-virtual"
                  renderItem={(item) => (
                    <div className="equipment-item">
                      <div className="equipment-item-main">
                        <span className="equipment-item-name">{item.name}</span>
                        {item.subCategory && (
                          <span className="equipment-item-sub">
                            {SUB_CATEGORY_LABELS[item.subCategory] ?? item.subCategory}
                          </span>
                        )}
                        {item.taskIds && item.taskIds.length > 0 && (
                          <span className="equipment-item-tasks" aria-label="Related checklist tasks">
                            →{' '}
                            {item.taskIds
                              .map((id) => TASK_LABEL_BY_ID[id] ?? id)
                              .join(' · ')}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="equipment-item-desc">{item.description}</p>
                      )}
                    </div>
                  )}
                />
              ) : (
                <ul className="equipment-list">
                  {items.map((item) => (
                    <li key={item.id} className="equipment-item">
                      <div className="equipment-item-main">
                        <span className="equipment-item-name">{item.name}</span>
                        {item.subCategory && (
                          <span className="equipment-item-sub">
                            {SUB_CATEGORY_LABELS[item.subCategory] ?? item.subCategory}
                          </span>
                        )}
                        {item.taskIds && item.taskIds.length > 0 && (
                          <span className="equipment-item-tasks" aria-label="Related checklist tasks">
                            →{' '}
                            {item.taskIds
                              .map((id) => TASK_LABEL_BY_ID[id] ?? id)
                              .join(' · ')}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="equipment-item-desc">{item.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </PullToRefresh>
    </div>
  )
}
