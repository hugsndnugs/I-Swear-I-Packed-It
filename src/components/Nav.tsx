import { NavLink } from 'react-router-dom'
import { Home, Zap, FileText, Backpack, Wrench, Timer } from 'lucide-react'
import './Nav.css'

const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'Home', end: true },
  { to: '/generate', icon: Zap, label: 'Generate', end: false },
  { to: '/manifest', icon: FileText, label: 'Manifest', end: false },
  { to: '/pack', icon: Backpack, label: 'Pack', end: false },
  { to: '/equipment', icon: Wrench, label: 'Equipment', end: false },
  { to: '/op-mode', icon: Timer, label: 'Op Mode', end: false }
] as const

export default function Nav() {
  return (
    <nav className="nav" aria-label="Main navigation">
      {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          end={end}
        >
          <Icon size={20} aria-hidden />
          <span className="nav-link-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
