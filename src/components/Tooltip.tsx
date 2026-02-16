import { ReactNode, useState, useRef, useEffect } from 'react'
import './Tooltip.css'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

export default function Tooltip({ content, children, position = 'top', delay = 300 }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState(position)
  const timeoutRef = useRef<number | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = window.setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsVisible(false)
  }

  // Adjust tooltip position if it would go off-screen
  useEffect(() => {
    if (!isVisible || !tooltipRef.current || !triggerRef.current) return

    const tooltip = tooltipRef.current
    const trigger = triggerRef.current
    const rect = tooltip.getBoundingClientRect()
    const triggerRect = trigger.getBoundingClientRect()

    let newPosition = position

    // Check boundaries and adjust
    if (position === 'top' && rect.top < 0) {
      newPosition = 'bottom'
    } else if (position === 'bottom' && rect.bottom > window.innerHeight) {
      newPosition = 'top'
    } else if (position === 'left' && rect.left < 0) {
      newPosition = 'right'
    } else if (position === 'right' && rect.right > window.innerWidth) {
      newPosition = 'left'
    }

    setTooltipPosition(newPosition)
  }, [isVisible, position])

  return (
    <div
      className="tooltip-wrapper"
      ref={triggerRef}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`tooltip tooltip--${tooltipPosition}`}
          role="tooltip"
          aria-hidden="true"
        >
          {content}
        </div>
      )}
    </div>
  )
}
