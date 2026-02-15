import { useState } from 'react'
import './CollapsibleSection.css'

interface CollapsibleSectionProps {
  title: string
  sectionKey?: string
  defaultOpen?: boolean
  /** When true, section is always expanded and cannot be collapsed (e.g. Critical). */
  alwaysOpen?: boolean
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
  children,
  actions
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen || alwaysOpen)
  const id = sectionKey ?? toSlug(title)
  const isOpen = alwaysOpen || open

  return (
    <section className={'collapsible-section' + (alwaysOpen ? ' collapsible-section--always-open' : '')}>
      <div className="collapsible-section-header">
        {alwaysOpen ? (
          <span className="collapsible-section-trigger" id={`trigger-${id}`}>
            <span className="collapsible-section-icon" aria-hidden>▼</span>
            <span>{title}</span>
          </span>
        ) : (
          <button
            type="button"
            className="collapsible-section-trigger"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls={`section-${id}`}
            id={`trigger-${id}`}
          >
            <span className="collapsible-section-icon" aria-hidden>
              {open ? '▼' : '▶'}
            </span>
            <span>{title}</span>
          </button>
        )}
        {actions}
      </div>
      <div
        id={`section-${id}`}
        className={'collapsible-section-content' + (isOpen ? ' open' : '')}
        hidden={!isOpen}
        role="region"
        aria-labelledby={`trigger-${id}`}
      >
        {children}
      </div>
    </section>
  )
}
