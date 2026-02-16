import { useState, useRef, useEffect, ReactNode, TouchEvent } from 'react'
import './SwipeableItem.css'

interface SwipeableItemProps {
  children: ReactNode
  onSwipeRight?: () => void
  onSwipeLeft?: () => void
  swipeRightLabel?: string
  swipeLeftLabel?: string
  disabled?: boolean
}

const SWIPE_THRESHOLD = 100 // pixels
const SWIPE_VELOCITY_THRESHOLD = 0.3 // pixels per ms

export default function SwipeableItem({
  children,
  onSwipeRight,
  onSwipeLeft,
  swipeRightLabel = 'Complete',
  swipeLeftLabel = 'Delete',
  disabled = false
}: SwipeableItemProps) {
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const touchStartRef = useRef<{ x: number; time: number } | null>(null)
  const itemRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled) return
    const touch = e.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      time: Date.now()
    }
    setIsSwiping(true)
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!touchStartRef.current || disabled) return
    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    setSwipeOffset(deltaX)

    if (deltaX > 0 && onSwipeRight) {
      setSwipeDirection('right')
    } else if (deltaX < 0 && onSwipeLeft) {
      setSwipeDirection('left')
    } else {
      setSwipeDirection(null)
    }
  }

  const handleTouchEnd = () => {
    if (!touchStartRef.current || disabled) return

    const deltaX = swipeOffset
    const deltaTime = Date.now() - touchStartRef.current.time
    const velocity = Math.abs(deltaX) / deltaTime

    const shouldTrigger =
      Math.abs(deltaX) > SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY_THRESHOLD

    if (shouldTrigger) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight()
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft()
      }
    }

    // Reset
    setSwipeOffset(0)
    setIsSwiping(false)
    setSwipeDirection(null)
    touchStartRef.current = null
  }

  useEffect(() => {
    // Prevent scrolling while swiping
    if (isSwiping) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isSwiping])

  const showRightAction = swipeOffset > 0 && onSwipeRight
  const showLeftAction = swipeOffset < 0 && onSwipeLeft

  return (
    <div
      ref={itemRef}
      className={`swipeable-item ${isSwiping ? 'swipeable-item--swiping' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateX(${swipeOffset}px)`,
        transition: isSwiping ? 'none' : 'transform var(--duration-fast) var(--ease-out)'
      }}
    >
      {showRightAction && (
        <div className="swipeable-action swipeable-action--right">
          {swipeRightLabel}
        </div>
      )}
      {showLeftAction && (
        <div className="swipeable-action swipeable-action--left">
          {swipeLeftLabel}
        </div>
      )}
      <div className="swipeable-content">{children}</div>
    </div>
  )
}
