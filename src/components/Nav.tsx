import { NavLink } from 'react-router-dom'
import './Nav.css'

export default function Nav() {
  return (
    <nav className="nav" aria-label="Main navigation">
      <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')} end>
        Home
      </NavLink>
      <NavLink to="/generate" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
        Generate
      </NavLink>
      <NavLink to="/manifest" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
        Manifest
      </NavLink>
      <NavLink to="/pack" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
        Pack List
      </NavLink>
      <NavLink to="/equipment" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
        Equipment
      </NavLink>
      <NavLink to="/op-mode" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
        Op Mode
      </NavLink>
    </nav>
  )
}
