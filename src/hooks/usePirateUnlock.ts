import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { setPirateSettings, getPirateSettings } from '../lib/pirateSettings'
import { ROUTES } from '../constants/routes'

const LONG_PRESS_MS = 800
const FAST_CLICKS_REQUIRED = 15
const FAST_CLICK_RESET_MS = 2000
const SINGLE_CLICK_NAV_DELAY_MS = 400

export interface UsePirateUnlockReturn {
  showPirateModal: boolean
  setShowPirateModal: (show: boolean) => void
  handleBrandPointerDown: () => void
  handleBrandPointerUp: () => void
  handleBrandPointerLeave: () => void
  handleBrandClick: (e: React.MouseEvent) => void
}

/**
 * Custom hook for pirate unlock functionality.
 * Handles long-press, fast clicks, and Konami code unlock mechanisms.
 */
export function usePirateUnlock(
  onUnlock?: () => void
): UsePirateUnlockReturn {
  const navigate = useNavigate()
  const [showPirateModal, setShowPirateModal] = useState(false)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fastClickCountRef = useRef(0)
  const fastClickResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const singleClickNavTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pirateUnlocked = getPirateSettings().unlocked

  const openPirateModal = useCallback(() => {
    setPirateSettings({ unlocked: true })
    setShowPirateModal(true)
    onUnlock?.()
  }, [onUnlock])

  const handleBrandPointerDown = useCallback(() => {
    if (!pirateUnlocked) return
    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null
      setShowPirateModal(true)
      onUnlock?.()
    }, LONG_PRESS_MS)
  }, [pirateUnlocked, onUnlock])

  const handleBrandPointerUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  const handleBrandPointerLeave = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  const handleBrandClick = useCallback(
    (e: React.MouseEvent) => {
      if (singleClickNavTimerRef.current) {
        clearTimeout(singleClickNavTimerRef.current)
        singleClickNavTimerRef.current = null
      }
      if (fastClickResetTimerRef.current) {
        clearTimeout(fastClickResetTimerRef.current)
        fastClickResetTimerRef.current = null
      }

      fastClickCountRef.current += 1
      const count = fastClickCountRef.current

      if (count >= FAST_CLICKS_REQUIRED) {
        fastClickCountRef.current = 0
        openPirateModal()
        e.preventDefault()
        return
      }

      if (count === 1) {
        singleClickNavTimerRef.current = setTimeout(() => {
          singleClickNavTimerRef.current = null
          navigate(ROUTES.HOME)
        }, SINGLE_CLICK_NAV_DELAY_MS)
      }

      fastClickResetTimerRef.current = setTimeout(() => {
        fastClickResetTimerRef.current = null
        fastClickCountRef.current = 0
      }, FAST_CLICK_RESET_MS)

      e.preventDefault()
    },
    [navigate, openPirateModal]
  )

  return {
    showPirateModal,
    setShowPirateModal,
    handleBrandPointerDown,
    handleBrandPointerUp,
    handleBrandPointerLeave,
    handleBrandClick
  }
}
