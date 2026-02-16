import { useState, useEffect, useRef, useCallback } from 'react'
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom'
import Nav from './Nav'
import ThemeToggle from './ThemeToggle'
import StorageErrorBanner from './StorageErrorBanner'
import PirateSettingsModal from './PirateSettingsModal'
import { useKonami } from '../hooks/useKonami'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { DESKTOP_MEDIA_QUERY } from '../constants/breakpoints'
import { getPirateSettings, setPirateSettings } from '../lib/pirateSettings'
import { pirateSpeak } from '../lib/pirateSpeak'
import { Rocket, Skull, Menu } from 'lucide-react'
import './Layout.css'

const NAV_DRAWER_ID = 'nav-drawer'

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
const FAST_CLICKS_REQUIRED = 15
const FAST_CLICK_RESET_MS = 2000
const SINGLE_CLICK_NAV_DELAY_MS = 400

export default function Layout() {
  const location = useLocation()
  const pageTitle = getPageTitle(location.pathname)
  const [showPirateModal, setShowPirateModal] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navigate = useNavigate()
  const fastClickCountRef = useRef(0)
  const fastClickResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const singleClickNavTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)

  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY)
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

  const handlePirateSettingsChange = useCallback(() => {
    setRefresh((r) => r + 1)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pirate-settings-changed'))
    }
  }, [])

  const closeDrawer = useCallback(() => setDrawerOpen(false), [])
  const toggleDrawer = useCallback(() => setDrawerOpen((o) => !o), [])

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

  const openPirateModal = useCallback(() => {
    setPirateSettings({ unlocked: true })
    setShowPirateModal(true)
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
          navigate('/')
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
          to="/"
          className="layout-brand"
          aria-label="Pre-Flight Assistant home"
          onClick={handleBrandClick}
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
