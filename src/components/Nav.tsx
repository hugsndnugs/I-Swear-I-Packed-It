import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Zap, FileText, Backpack, Wrench, Timer } from 'lucide-react'
import { getPirateSettings } from '../lib/pirateSettings'
import { pirateSpeak } from '../lib/pirateSpeak'
import './Nav.css'

export const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'Home', end: true },
  { to: '/generate', icon: Zap, label: 'Generate', end: false },
  { to: '/manifest', icon: FileText, label: 'Manifest', end: false },
  { to: '/pack', icon: Backpack, label: 'Pack', end: false },
  { to: '/equipment', icon: Wrench, label: 'Equipment', end: false },
  { to: '/op-mode', icon: Timer, label: 'Op Mode', end: false }
] as const

export type NavVariant = 'bottom' | 'drawer'

interface NavProps {
  variant?: NavVariant
  onNavigate?: () => void
}

export default function Nav({ variant = 'bottom', onNavigate }: NavProps) {
  const [, setTick] = useState(0)
  const ps = getPirateSettings().pirateSpeak

  useEffect(() => {
    const handler = () => setTick((t) => t + 1)
    window.addEventListener('pirate-settings-changed', handler)
    return () => window.removeEventListener('pirate-settings-changed', handler)
  }, [])

  const navClassName = variant === 'drawer' ? 'nav nav--drawer' : 'nav'

  return (
    <nav className={navClassName} aria-label="Main navigation">
      {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          end={end}
          onClick={onNavigate}
        >
          <Icon size={20} aria-hidden />
          <span className="nav-link-label">{pirateSpeak(label, ps)}</span>
        </NavLink>
      ))}
    </nav>
  )
}
