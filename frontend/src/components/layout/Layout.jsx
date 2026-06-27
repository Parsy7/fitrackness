import { NavLink } from 'react-router-dom'
import { Home, Dumbbell, BarChart2, User, Settings } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import './Layout.css'

export function Layout({ children }) {
  const { user } = useAuth()

  return (
    <div className="layout">
      <main className="layout-main">{children}</main>
      <nav className="bottom-nav">
        <NavLink to="/"          className={({ isActive }) => isActive ? 'nav-item nav-item--active' : 'nav-item'} end>
          <Home size={22} /><span>Inicio</span>
        </NavLink>
        <NavLink to="/session"   className={({ isActive }) => isActive ? 'nav-item nav-item--active' : 'nav-item'}>
          <Dumbbell size={22} /><span>Sesión</span>
        </NavLink>
        <NavLink to="/stats"     className={({ isActive }) => isActive ? 'nav-item nav-item--active' : 'nav-item'}>
          <BarChart2 size={22} /><span>Stats</span>
        </NavLink>
        <NavLink to="/profile"   className={({ isActive }) => isActive ? 'nav-item nav-item--active' : 'nav-item'}>
          <User size={22} /><span>Perfil</span>
        </NavLink>
        {user?.role === 'admin' && (
          <NavLink to="/admin"   className={({ isActive }) => isActive ? 'nav-item nav-item--active' : 'nav-item'}>
            <Settings size={22} /><span>Admin</span>
          </NavLink>
        )}
      </nav>
    </div>
  )
}
