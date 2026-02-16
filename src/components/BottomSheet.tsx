import { useEffect, useRef, ReactNode } from 'react'
import { X } from 'lucide-react'
import { hapticButtonPress } from '../lib/haptics'
import './BottomSheet.css'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  'aria-label'?: string
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  'aria-label': ariaLabel
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen) return

    // Store previous focus
    previousFocusRef.current = document.activeElement as HTMLElement

    // Focus management
    const firstFocusable = sheetRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    firstFocusable?.focus()

    // Escape key handler
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        hapticButtonPress()
        onClose()
      }
    }

    // Prevent body scroll when sheet is open
    document.body.style.overflow = 'hidden'

    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
      // Restore focus
      previousFocusRef.current?.focus()
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      hapticButtonPress()
      onClose()
    }
  }

  return (
    <>
      <div
        ref={backdropRef}
        className="bottom-sheet-backdrop"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      <div
        ref={sheetRef}
        className="bottom-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || title || 'Dialog'}
        aria-hidden={!isOpen}
      >
        <div className="bottom-sheet-header">
          {title && <h2 className="bottom-sheet-title">{title}</h2>}
          <button
            className="bottom-sheet-close"
            onClick={() => {
              hapticButtonPress()
              onClose()
            }}
            aria-label="Close"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 'var(--tap)',
              height: 'var(--tap)',
              padding: 0,
              borderRadius: 'var(--radius)',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'color var(--duration-fast) var(--ease-out), background var(--duration-fast) var(--ease-out)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text)'
              e.currentTarget.style.background = 'var(--surface2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <X size={20} aria-hidden />
          </button>
        </div>
        <div className="bottom-sheet-content">{children}</div>
      </div>
    </>
  )
}
