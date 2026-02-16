import { ReactNode, useState, useRef, useEffect, useCallback } from 'react'
import './Tooltip.css'

const LONG_PRESS_MS = 500
const TOOLTIP_AUTO_HIDE_MS = 3000

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
  const hideTimeoutRef = useRef<number | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  const showTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = globalThis.setTimeout(() => {
      timeoutRef.current = null
      setIsVisible(true)
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = globalThis.setTimeout(() => {
        hideTimeoutRef.current = null
        setIsVisible(false)
      }, TOOLTIP_AUTO_HIDE_MS)
    }, delay)
  }, [delay])

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
    setIsVisible(false)
  }, [])

  const handleLongPressStart = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = globalThis.setTimeout(() => {
      timeoutRef.current = null
      setIsVisible(true)
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = globalThis.setTimeout(() => {
        hideTimeoutRef.current = null
        setIsVisible(false)
      }, TOOLTIP_AUTO_HIDE_MS)
    }, LONG_PRESS_MS)
  }, [])

  const handleLongPressEnd = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // Hide tooltip when touching outside (touch devices)
  useEffect(() => {
    if (!isVisible) return
    const handleDocTouch = (e: TouchEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target) || tooltipRef.current?.contains(target)) return
      hideTooltip()
    }
    document.addEventListener('touchstart', handleDocTouch, { passive: true })
    return () => document.removeEventListener('touchstart', handleDocTouch)
  }, [isVisible, hideTooltip])

  // Adjust tooltip position if it would go off-screen
  useEffect(() => {
    if (!isVisible || !tooltipRef.current || !triggerRef.current) return

    const tooltip = tooltipRef.current
    const rect = tooltip.getBoundingClientRect()

    let newPosition = position

    if (position === 'top' && rect.top < 0) {
      newPosition = 'bottom'
    } else if (position === 'bottom' && rect.bottom > (globalThis.window?.innerHeight ?? 0)) {
      newPosition = 'top'
    } else if (position === 'left' && rect.left < 0) {
      newPosition = 'right'
    } else if (position === 'right' && rect.right > (globalThis.window?.innerWidth ?? 0)) {
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
      onTouchStart={handleLongPressStart}
      onTouchEnd={handleLongPressEnd}
      onTouchCancel={handleLongPressEnd}
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
