import { lazy, Suspense, useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import DeepLinkHandler from './components/DeepLinkHandler'
import { getSettings, getFontSizeMultiplier } from './lib/settings'
import { initializeNotificationChannels } from './lib/notifications'
import { getBiometricEnabled, authenticateBiometric } from './lib/biometric'
import { Capacitor } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'

const Home = lazy(() => import('./screens/Home'))
const Generator = lazy(() => import('./screens/Generator'))
const Checklist = lazy(() => import('./screens/Checklist'))
const Settings = lazy(() => import('./screens/Settings'))
const PackList = lazy(() => import('./screens/PackList'))
const Equipment = lazy(() => import('./screens/Equipment'))
const Manifest = lazy(() => import('./screens/Manifest'))
const OpMode = lazy(() => import('./screens/OpMode'))

function LoadingFallback({ message }: { message: string }) {
  return (
    <div className="loading" aria-live="polite">
      <span className="loading-spinner" aria-hidden />
      <span>{message}</span>
    </div>
  )
}

function App() {
  const [biometricChecked, setBiometricChecked] = useState(false)

  // Defer heavy init until after first paint so it does not block TTI
  useEffect(() => {
    const id = setTimeout(() => initializeNotificationChannels(), 0)
    return () => clearTimeout(id)
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

  // Hide native splash when app is ready (after biometric check when enabled)
  useEffect(() => {
    if (!biometricChecked) return
    if (Capacitor.isNativePlatform()) {
      requestAnimationFrame(() => {
        SplashScreen.hide().catch(() => {})
      })
    }
  }, [biometricChecked])

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
          <Route
          path="/"
          element={
            <Suspense fallback={<LoadingFallback message="Loading…" />}>
              <Home />
            </Suspense>
          }
        />
        <Route
          path="/generate"
          element={
            <Suspense fallback={<LoadingFallback message="Loading Generator…" />}>
              <Generator />
            </Suspense>
          }
        />
        <Route
          path="/checklist"
          element={
            <Suspense fallback={<LoadingFallback message="Preparing checklist…" />}>
              <Checklist />
            </Suspense>
          }
        />
        <Route
          path="/settings"
          element={
            <Suspense fallback={<LoadingFallback message="Loading Settings…" />}>
              <Settings />
            </Suspense>
          }
        />
        <Route
          path="/manifest"
          element={
            <Suspense fallback={<LoadingFallback message="Loading Cargo Manifest…" />}>
              <Manifest />
            </Suspense>
          }
        />
        <Route
          path="/equipment"
          element={
            <Suspense fallback={<LoadingFallback message="Loading Equipment…" />}>
              <Equipment />
            </Suspense>
          }
        />
        <Route
          path="/op-mode"
          element={
            <Suspense fallback={<LoadingFallback message="Loading Op Mode…" />}>
              <OpMode />
            </Suspense>
          }
        />
        <Route
          path="/pack"
          element={
            <Suspense fallback={<LoadingFallback message="Loading Pack List…" />}>
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
