import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import './CollapsibleSection.css'

interface CollapsibleSectionProps {
  title: string
  sectionKey?: string
  defaultOpen?: boolean
  /** When true, section is always expanded and cannot be collapsed (e.g. Critical). */
  alwaysOpen?: boolean
  /** Optional completion count for header, e.g. "Pre-flight (3/5)" */
  completedCount?: number
  totalCount?: number
  /** Controlled open state (when provided with onToggle). */
  open?: boolean
  onToggle?: () => void
  children: React.ReactNode
  actions?: React.ReactNode
}

function toSlug(s: string): string {
  return s.replace(/\s+/g, '-')
}

export default function CollapsibleSection({
  title,
  sectionKey,
  defaultOpen = false,
  alwaysOpen = false,
  completedCount,
  totalCount,
  open: controlledOpen,
  onToggle,
  children,
  actions
}: CollapsibleSectionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen || alwaysOpen)
  const isControlled = controlledOpen !== undefined && onToggle !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? onToggle : () => setInternalOpen((prev) => !prev)
  const id = sectionKey ?? toSlug(title)
  const isOpen = alwaysOpen || open
  const countLabel =
    completedCount !== undefined && totalCount !== undefined
      ? ` (${completedCount}/${totalCount})`
      : ''

  return (
    <section className={'collapsible-section' + (alwaysOpen ? ' collapsible-section--always-open' : '')}>
      <div className="collapsible-section-header">
        {alwaysOpen ? (
          <span className="collapsible-section-trigger" id={`trigger-${id}`}>
            <ChevronDown size={18} className="collapsible-section-icon" aria-hidden />
            <span>{title}{countLabel}</span>
          </span>
        ) : (
          <button
            type="button"
            className="collapsible-section-trigger"
            onClick={() => setOpen()}
            aria-expanded={open}
            aria-controls={`section-${id}`}
            id={`trigger-${id}`}
          >
            <span className="collapsible-section-icon" aria-hidden>
              {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </span>
            <span>{title}{countLabel}</span>
          </button>
        )}
        {actions}
      </div>
      <div
        id={`section-${id}`}
        className={'collapsible-section-content' + (isOpen ? ' open' : '')}
        aria-hidden={!isOpen}
        role="region"
        aria-labelledby={`trigger-${id}`}
      >
        <div className="collapsible-section-inner">{children}</div>
      </div>
    </section>
  )
}
