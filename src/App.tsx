import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './screens/Home'
import Generator from './screens/Generator'
import Checklist from './screens/Checklist'

const PackList = lazy(() => import('./screens/PackList'))
const Equipment = lazy(() => import('./screens/Equipment'))
const Manifest = lazy(() => import('./screens/Manifest'))
const OpMode = lazy(() => import('./screens/OpMode'))

const lazyFallback = <div className="loading" aria-live="polite">Loading…</div>

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/generate" element={<Generator />} />
        <Route path="/checklist" element={<Checklist />} />
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
  )
}

export default App
