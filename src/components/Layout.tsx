import { useState, useEffect, useRef, useCallback } from 'react'
import { Outlet, useLocation, Link } from 'react-router-dom'
import Nav from './Nav'
import ThemeToggle from './ThemeToggle'
import StorageErrorBanner from './StorageErrorBanner'
import PirateSettingsModal from './PirateSettingsModal'
import { useKonami } from '../hooks/useKonami'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { usePirateUnlock } from '../hooks/usePirateUnlock'
import { DESKTOP_MEDIA_QUERY } from '../constants/breakpoints'
import { getPirateSettings, setPirateSettings } from '../lib/pirateSettings'
import { pirateSpeak } from '../lib/pirateSpeak'
import { ROUTES } from '../constants/routes'
import { hapticButtonPress } from '../lib/haptics'
import { Menu, Settings } from 'lucide-react'
import './Layout.css'

const NAV_DRAWER_ID = 'nav-drawer'

const PAGE_TITLES: Record<string, string> = {
  [ROUTES.HOME]: 'Pre-Flight Assistant',
  [ROUTES.GENERATE]: 'Generate Checklist',
  [ROUTES.CHECKLIST]: 'Pre-Flight Checklist',
  [ROUTES.MANIFEST]: 'Cargo Manifest',
  [ROUTES.PACK]: 'Pack List',
  [ROUTES.EQUIPMENT]: 'Equipment Reference',
  [ROUTES.OP_MODE]: 'Op Mode'
}

function getPageTitle(pathname: string): string {
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (path === ROUTES.HOME ? pathname === path : pathname.startsWith(path)) {
      return title
    }
  }
  return 'Pre-Flight Assistant'
}

export default function Layout() {
  const location = useLocation()
  const pageTitle = getPageTitle(location.pathname)
  const [refresh, setRefresh] = useState(0)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)

  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY)
  const pirateSettings = getPirateSettings()
  const pirateThemeOn = pirateSettings.theme

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handlePirateSettingsChange = useCallback(() => {
    setRefresh((r) => r + 1)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pirate-settings-changed'))
    }
  }, [])

  const {
    showPirateModal,
    setShowPirateModal,
    handleBrandPointerDown,
    handleBrandPointerUp,
    handleBrandPointerLeave,
    handleBrandClick
  } = usePirateUnlock(() => {
    setShowPirateModal(true)
  })

  useKonami(
    useCallback(() => {
      setPirateSettings({ unlocked: true })
      setShowPirateModal(true)
    }, [setShowPirateModal])
  )

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-pirate-theme',
      pirateThemeOn ? 'true' : 'false'
    )
  }, [pirateThemeOn, refresh, showPirateModal])

  /* Close drawer when switching to mobile (resize). */
  useEffect(() => {
    if (!isDesktop) setDrawerOpen(false)
  }, [isDesktop])

  /* Focus management: when drawer opens focus first focusable inside; when it closes return focus to hamburger. */
  useEffect(() => {
    if (!isDesktop) return
    if (drawerOpen) {
      const firstLink = drawerRef.current?.querySelector<HTMLAnchorElement>(
        'a[href]'
      )
      firstLink?.focus()
    } else {
      hamburgerRef.current?.focus()
    }
  }, [isDesktop, drawerOpen])

  /* Escape closes drawer. */
  useEffect(() => {
    if (!drawerOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [drawerOpen])

  const closeDrawer = useCallback(() => setDrawerOpen(false), [])
  const toggleDrawer = useCallback(() => setDrawerOpen((o) => !o), [])

  return (
    <div className="layout">
      <header className="layout-header">
        {isDesktop ? (
          <button
            ref={hamburgerRef}
            type="button"
            className="layout-hamburger"
            aria-expanded={drawerOpen}
            aria-controls={NAV_DRAWER_ID}
            aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
            onClick={toggleDrawer}
          >
            <Menu size={24} aria-hidden />
          </button>
        ) : null}
        <Link
          to={ROUTES.HOME}
          className="layout-brand"
          aria-label="Pre-Flight Assistant home"
          onClick={handleBrandClick}
          onPointerDown={handleBrandPointerDown}
          onPointerUp={handleBrandPointerUp}
          onPointerLeave={handleBrandPointerLeave}
        >
          <img 
            src="/assets/logo.png" 
            alt="Pre-Flight Assistant" 
            className="layout-brand-logo"
            aria-hidden="true"
          />
          <span className="layout-brand-text">Pre-Flight</span>
        </Link>
        <span className="layout-page-title" aria-hidden>
          {pirateSpeak(pageTitle, pirateSettings.pirateSpeak)}
        </span>
        <div className="layout-header-actions">
          <Link
            to={ROUTES.SETTINGS}
            className="layout-settings-btn btn-icon"
            aria-label="Settings"
            onClick={() => hapticButtonPress()}
          >
            <Settings size={20} aria-hidden />
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="layout-main">
        <StorageErrorBanner />
        {!isOnline && (
          <div className="offline-indicator" role="status" aria-live="polite">
            <span>Offline — Using cached content</span>
          </div>
        )}
        <Outlet />
      </main>
      {!isDesktop && <Nav />}
      {isDesktop && (
        <>
          <div
            className={`layout-drawer-backdrop ${drawerOpen ? 'layout-drawer-backdrop--open' : ''}`}
            aria-hidden
            onClick={closeDrawer}
          />
          <div
            id={NAV_DRAWER_ID}
            ref={drawerRef}
            className={`layout-drawer ${drawerOpen ? 'layout-drawer--open' : ''}`}
            role="dialog"
            aria-label="Main navigation"
            aria-modal="true"
            aria-hidden={!drawerOpen}
          >
            <Nav variant="drawer" onNavigate={closeDrawer} />
          </div>
        </>
      )}
      {showPirateModal && (
        <PirateSettingsModal
          onClose={() => setShowPirateModal(false)}
          onSettingsChange={handlePirateSettingsChange}
        />
      )}
    </div>
  )
}
