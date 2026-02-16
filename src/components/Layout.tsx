import { useState, useEffect, useRef, useCallback } from 'react'
import { Outlet, useLocation, Link } from 'react-router-dom'
import Nav from './Nav'
import ThemeToggle from './ThemeToggle'
import StorageErrorBanner from './StorageErrorBanner'
import PirateSettingsModal from './PirateSettingsModal'
import { useKonami } from '../hooks/useKonami'
import { getPirateSettings, setPirateSettings } from '../lib/pirateSettings'
import { pirateSpeak } from '../lib/pirateSpeak'
import { Rocket, Skull } from 'lucide-react'
import './Layout.css'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Pre-Flight Assistant',
  '/generate': 'Generate Checklist',
  '/checklist': 'Pre-Flight Checklist',
  '/manifest': 'Cargo Manifest',
  '/pack': 'Pack List',
  '/equipment': 'Equipment Reference',
  '/op-mode': 'Op Mode'
}

function getPageTitle(pathname: string): string {
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (path === '/' ? pathname === path : pathname.startsWith(path)) {
      return title
    }
  }
  return 'Pre-Flight Assistant'
}

const LONG_PRESS_MS = 800

export default function Layout() {
  const location = useLocation()
  const pageTitle = getPageTitle(location.pathname)
  const [showPirateModal, setShowPirateModal] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pirateSettings = getPirateSettings()
  const pirateThemeOn = pirateSettings.theme
  const pirateUnlocked = pirateSettings.unlocked

  useKonami(
    useCallback(() => {
      setPirateSettings({ unlocked: true })
      setShowPirateModal(true)
    }, [])
  )

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-pirate-theme',
      pirateThemeOn ? 'true' : 'false'
    )
  }, [pirateThemeOn, refresh, showPirateModal])

  const handlePirateSettingsChange = useCallback(() => {
    setRefresh((r) => r + 1)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pirate-settings-changed'))
    }
  }, [])

  const handleBrandPointerDown = useCallback(() => {
    if (!pirateUnlocked) return
    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null
      setShowPirateModal(true)
    }, LONG_PRESS_MS)
  }, [pirateUnlocked])

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

  return (
    <div className="layout">
      <header className="layout-header">
        <Link
          to="/"
          className="layout-brand"
          aria-label="Pre-Flight Assistant home"
          onPointerDown={handleBrandPointerDown}
          onPointerUp={handleBrandPointerUp}
          onPointerLeave={handleBrandPointerLeave}
        >
          {pirateThemeOn ? (
            <Skull size={24} aria-hidden />
          ) : (
            <Rocket size={24} aria-hidden />
          )}
          <span className="layout-brand-text">Pre-Flight</span>
        </Link>
        <span className="layout-page-title" aria-hidden>
          {pirateSpeak(pageTitle, pirateSettings.pirateSpeak)}
        </span>
        <ThemeToggle />
      </header>
      <main className="layout-main">
        <StorageErrorBanner />
        <Outlet />
      </main>
      <Nav />
      {showPirateModal && (
        <PirateSettingsModal
          onClose={() => setShowPirateModal(false)}
          onSettingsChange={handlePirateSettingsChange}
        />
      )}
    </div>
  )
}
