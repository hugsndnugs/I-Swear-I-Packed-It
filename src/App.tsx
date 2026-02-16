import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './screens/Home'
import Generator from './screens/Generator'
import Checklist from './screens/Checklist'
import Settings from './screens/Settings'
import DeepLinkHandler from './components/DeepLinkHandler'
import { getSettings, getFontSizeMultiplier } from './lib/settings'
import { initializeNotificationChannels } from './lib/notifications'

const PackList = lazy(() => import('./screens/PackList'))
const Equipment = lazy(() => import('./screens/Equipment'))
const Manifest = lazy(() => import('./screens/Manifest'))
const OpMode = lazy(() => import('./screens/OpMode'))

const lazyFallback = <div className="loading" aria-live="polite">Loading…</div>

function App() {
  // Initialize notification channels on app start
  useEffect(() => {
    initializeNotificationChannels()
  }, [])

  // Apply settings to document root
  useEffect(() => {
    const applySettings = () => {
      const settings = getSettings()
      const multiplier = getFontSizeMultiplier(settings.fontSize)
      document.documentElement.style.fontSize = `${multiplier * 16}px`
      document.documentElement.setAttribute('data-high-contrast', settings.highContrast)
    }

    applySettings()
    window.addEventListener('settings-changed', applySettings)
    return () => window.removeEventListener('settings-changed', applySettings)
  }, [])

  return (
    <>
      <DeepLinkHandler />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/generate" element={<Generator />} />
          <Route path="/checklist" element={<Checklist />} />
          <Route path="/settings" element={<Settings />} />
        <Route
          path="/manifest"
          element={
            <Suspense fallback={lazyFallback}>
              <Manifest />
            </Suspense>
          }
        />
        <Route
          path="/equipment"
          element={
            <Suspense fallback={lazyFallback}>
              <Equipment />
            </Suspense>
          }
        />
        <Route
          path="/op-mode"
          element={
            <Suspense fallback={lazyFallback}>
              <OpMode />
            </Suspense>
          }
        />
        <Route
          path="/pack"
          element={
            <Suspense fallback={lazyFallback}>
              <PackList />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
    </>
  )
}

export default App
