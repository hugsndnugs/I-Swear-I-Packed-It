import { Outlet, useLocation, Link } from 'react-router-dom'
import Nav from './Nav'
import ThemeToggle from './ThemeToggle'
import StorageErrorBanner from './StorageErrorBanner'
import { Rocket } from 'lucide-react'
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

export default function Layout() {
  const location = useLocation()
  const pageTitle = getPageTitle(location.pathname)

  return (
    <div className="layout">
      <header className="layout-header">
        <Link to="/" className="layout-brand" aria-label="Pre-Flight Assistant home">
          <Rocket size={24} aria-hidden />
          <span className="layout-brand-text">Pre-Flight</span>
        </Link>
        <span className="layout-page-title" aria-hidden>
          {pageTitle}
        </span>
        <ThemeToggle />
      </header>
      <main className="layout-main">
        <StorageErrorBanner />
        <Outlet />
      </main>
      <Nav />
    </div>
  )
}
