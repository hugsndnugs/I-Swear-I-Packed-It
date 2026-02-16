import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './screens/Home'
import Generator from './screens/Generator'
import Checklist from './screens/Checklist'
import Equipment from './screens/Equipment'
import Manifest from './screens/Manifest'
import OpMode from './screens/OpMode'

const PackList = lazy(() => import('./screens/PackList'))

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/generate" element={<Generator />} />
        <Route path="/checklist" element={<Checklist />} />
        <Route path="/manifest" element={<Manifest />} />
        <Route path="/equipment" element={<Equipment />} />
        <Route path="/op-mode" element={<OpMode />} />
        <Route
          path="/pack"
          element={
            <Suspense fallback={<div className="loading" aria-live="polite">Loading…</div>}>
              <PackList />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  )
}

export default App
