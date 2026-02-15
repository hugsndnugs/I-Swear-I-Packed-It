import { Outlet } from 'react-router-dom'
import Nav from './Nav'
import './Layout.css'

export default function Layout() {
  return (
    <div className="layout">
      <main className="layout-main">
        <Outlet />
      </main>
      <Nav />
    </div>
  )
}
