import { lazy, Suspense, useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './screens/Home'
import Generator from './screens/Generator'
import Checklist from './screens/Checklist'
import Settings from './screens/Settings'
import DeepLinkHandler from './components/DeepLinkHandler'
import { getSettings, getFontSizeMultiplier } from './lib/settings'
import { initializeNotificationChannels } from './lib/notifications'
import { getBiometricEnabled, authenticateBiometric } from './lib/biometric'
import { Capacitor } from '@capacitor/core'

const PackList = lazy(() => import('./screens/PackList'))
const Equipment = lazy(() => import('./screens/Equipment'))
const Manifest = lazy(() => import('./screens/Manifest'))
const OpMode = lazy(() => import('./screens/OpMode'))

const lazyFallback = <div className="loading" aria-live="polite">Loading…</div>

function App() {
  const [biometricChecked, setBiometricChecked] = useState(false)

  // Initialize notification channels on app start
  useEffect(() => {
    initializeNotificationChannels()
  }, [])

  // Check biometric authentication on app start
  useEffect(() => {
    if (Capacitor.isNativePlatform() && getBiometricEnabled() && !biometricChecked) {
      authenticateBiometric('Authenticate to access Pre-Flight Assistant')
        .then((result) => {
          if (!result.success) {
            // If authentication fails, user can still access but we log it
            console.warn('Biometric authentication failed:', result.error)
          }
          setBiometricChecked(true)
        })
        .catch(() => {
          setBiometricChecked(true)
        })
    } else {
      setBiometricChecked(true)
    }
  }, [biometricChecked])

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

  // Show loading screen while checking biometric
  if (!biometricChecked && Capacitor.isNativePlatform() && getBiometricEnabled()) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p>Authenticating...</p>
        </div>
      </div>
    )
  }

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
