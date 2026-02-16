import { Outlet } from 'react-router-dom'
import Nav from './Nav'
import ThemeToggle from './ThemeToggle'
import StorageErrorBanner from './StorageErrorBanner'
import './Layout.css'

export default function Layout() {
  return (
    <div className="layout">
      <header className="layout-header">
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
