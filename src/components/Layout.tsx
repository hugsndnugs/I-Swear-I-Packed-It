import { useState, useEffect, useRef, useCallback } from 'react'
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
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
import { pushRecentRoute } from '../lib/recentItems'
import { getSettings } from '../lib/settings'
import { Menu, Settings, WifiOff, Search } from 'lucide-react'
import GlobalSearch from './GlobalSearch'
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
  const navigate = useNavigate()
  const pageTitle = getPageTitle(location.pathname)
  const [refresh, setRefresh] = useState(0)
  const [, setSettingsRefresh] = useState(0)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const oneHandedMode = getSettings().oneHandedMode
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)

  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY)

  // Android back button / gesture: go back in history when possible
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    let handle: { remove: () => Promise<void> } | null = null
    App.addListener('backButton', () => {
      if (globalThis.window?.history && globalThis.window.history.length > 1) {
        navigate(-1)
      } else {
        App.exitApp()
      }
    }).then((h) => {
      handle = h
    })
    return () => {
      handle?.remove()
    }
  }, [navigate])
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

  useEffect(() => {
    const handler = () => setSettingsRefresh((r) => r + 1)
    window.addEventListener('settings-changed', handler)
    return () => window.removeEventListener('settings-changed', handler)
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

  /* Ctrl+K / Cmd+K opens global search */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const closeDrawer = useCallback(() => setDrawerOpen(false), [])
  const toggleDrawer = useCallback(() => setDrawerOpen((o) => !o), [])

  // Track recent routes for Recent Items quick access
  useEffect(() => {
    pushRecentRoute(location.pathname)
  }, [location.pathname])

  // On route change, move focus to main content (first heading or focusable) for keyboard/screen reader users
  useEffect(() => {
    const main = document.getElementById('layout-main-content')
    if (!main) return
    const focusTarget = main.querySelector<HTMLElement>('h1, h2, button, a, input, select, [role="button"]')
    if (focusTarget) {
      requestAnimationFrame(() => focusTarget.focus({ preventScroll: true }))
    }
  }, [location.pathname])

  return (
    <div className="layout" data-one-handed={oneHandedMode || undefined}>
      <a href="#layout-main-content" className="layout-skip-link">
        Skip to main content
      </a>
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
          {!isOnline && (
            <span className="layout-offline-icon" role="status" aria-label="Offline — using cached content" title="Offline">
              <WifiOff size={20} aria-hidden />
            </span>
          )}
          <button
            type="button"
            className="layout-search-btn btn-icon"
            onClick={() => {
              hapticButtonPress()
              setSearchOpen(true)
            }}
            aria-label="Open search"
          >
            <Search size={20} aria-hidden />
          </button>
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
      <main id="layout-main-content" className="layout-main" tabIndex={-1}>
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
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
