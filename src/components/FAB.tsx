import { useState, useRef, useEffect } from 'react'
import { Plus, ChevronUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { hapticButtonPress } from '../lib/haptics'
import './FAB.css'

export interface FABAction {
  label: string
  ariaLabel: string
  onClick: () => void
  icon?: LucideIcon
}

interface FABProps {
  primary: FABAction
  /** Optional secondary actions shown in a speed-dial menu above the FAB */
  actions?: FABAction[]
}

export default function FAB({ primary, actions = [] }: FABProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const expandRef = useRef<HTMLButtonElement>(null)

  const handlePrimary = () => {
    hapticButtonPress()
    primary.onClick()
  }

  const handleExpand = () => {
    hapticButtonPress()
    setOpen((o) => !o)
  }

  const handleAction = (action: FABAction) => {
    hapticButtonPress()
    action.onClick()
    setOpen(false)
  }

  // Close menu on Escape and return focus to expand button
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
        expandRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  // Close when clicking outside
  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (menuRef.current?.contains(target) || expandRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [open])

  const PrimaryIcon = primary.icon ?? Plus

  return (
    <div className="fab-container" ref={menuRef}>
      {open && actions.length > 0 && (
        <div className="fab-menu" role="menu" aria-label="Quick actions">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.label}
                type="button"
                className="fab-menu-item"
                onClick={() => handleAction(action)}
                role="menuitem"
                aria-label={action.ariaLabel}
              >
                {Icon ? <Icon size={18} aria-hidden /> : null}
                <span>{action.label}</span>
              </button>
            )
          })}
        </div>
      )}
      <div className="fab-buttons">
        {actions.length > 0 && (
          <button
            ref={expandRef}
            type="button"
            className="fab-btn fab-btn-expand"
            onClick={handleExpand}
            aria-expanded={open}
            aria-haspopup="menu"
            aria-label="Open quick actions menu"
          >
            <ChevronUp size={24} aria-hidden />
          </button>
        )}
        <button
          type="button"
          className="fab-btn fab-btn-primary"
          onClick={handlePrimary}
          aria-label={primary.ariaLabel}
        >
          <PrimaryIcon size={24} aria-hidden />
        </button>
      </div>
    </div>
  )
}
