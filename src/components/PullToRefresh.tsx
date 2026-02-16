import { useState, useRef, useCallback, ReactNode } from 'react'
import './PullToRefresh.css'

const PULL_THRESHOLD = 80
const MAX_PULL = 120

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: ReactNode
  disabled?: boolean
}

export default function PullToRefresh({
  onRefresh,
  children,
  disabled = false
}: PullToRefreshProps) {
  const [pullY, setPullY] = useState(0)
  const [status, setStatus] = useState<'idle' | 'pulling' | 'refreshing' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const startY = useRef(0)
  const scrollTopAtStart = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const timeoutRef = useRef<number | null>(null)

  const triggerRefresh = useCallback(async () => {
    if (disabled) return
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setStatus('refreshing')
    setPullY(0)
    try {
      await onRefresh()
      setStatus('success')
      setMessage('Updated')
      timeoutRef.current = globalThis.setTimeout(() => {
        setStatus('idle')
        setMessage(null)
      }, 1500)
    } catch {
      setStatus('error')
      setMessage('Update failed')
      timeoutRef.current = globalThis.setTimeout(() => {
        setStatus('idle')
        setMessage(null)
      }, 2000)
    }
  }, [onRefresh, disabled])

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return
      scrollTopAtStart.current =
        typeof globalThis.window !== 'undefined'
          ? globalThis.window.scrollY ?? document.documentElement.scrollTop
          : 0
      startY.current = e.touches[0].clientY
    },
    [disabled]
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || status === 'refreshing') return
      if (scrollTopAtStart.current > 0) return
      const y = e.touches[0].clientY
      const delta = y - startY.current
      if (delta > 0) {
        const damped = Math.min(delta * 0.5, MAX_PULL)
        setPullY(damped)
        setStatus('pulling')
      }
    },
    [disabled, status]
  )

  const handleTouchEnd = useCallback(() => {
    if (status === 'pulling' && pullY >= PULL_THRESHOLD) {
      triggerRefresh()
    } else {
      setPullY(0)
      setStatus('idle')
    }
  }, [status, pullY, triggerRefresh])

  const showIndicator = pullY > 0 || status === 'refreshing' || status === 'success' || status === 'error'

  return (
    <div className="pull-to-refresh">
      {showIndicator && (
        <div
          className="pull-to-refresh-indicator"
          aria-live="polite"
          aria-busy={status === 'refreshing'}
        >
          {status === 'refreshing' && (
            <span className="loading-spinner" aria-hidden />
          )}
          {status === 'pulling' && pullY < PULL_THRESHOLD && (
            <span className="pull-to-refresh-pull-hint">Pull to refresh</span>
          )}
          {status === 'pulling' && pullY >= PULL_THRESHOLD && (
            <span className="pull-to-refresh-release-hint">Release to refresh</span>
          )}
          {status === 'success' && message}
          {status === 'error' && message}
        </div>
      )}
      <div
        ref={containerRef}
        className="pull-to-refresh-content"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => {
          setPullY(0)
          setStatus('idle')
        }}
        style={status === 'pulling' && pullY > 0 ? { transform: `translateY(${Math.min(pullY, MAX_PULL)}px)` } : undefined}
      >
        {children}
      </div>
    </div>
  )
}
