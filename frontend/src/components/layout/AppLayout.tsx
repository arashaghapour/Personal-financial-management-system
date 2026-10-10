import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'

import '../../styles/layout.css'

type NavItem = {
  label: string
  to: string
}

/**
 * Navigation for the planned financial sections. Routes that are not
 * implemented yet resolve to the not-found page until their pages exist.
 */
const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Accounts', to: '/accounts' },
  { label: 'Categories', to: '/categories' },
  { label: 'Transactions', to: '/transactions' },
  { label: 'Budgets', to: '/budgets' },
  { label: 'Reports', to: '/reports' },
]

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="app-header">
        <div className="app-header-inner">
          <Link to="/dashboard" className="app-logo">
            <span className="app-logo-mark" aria-hidden="true">
              $
            </span>
            <span className="app-logo-text">Finance Manager</span>
          </Link>
          <button
            type="button"
            className="app-nav-toggle"
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="app-nav-toggle-bar" aria-hidden="true" />
            <span className="app-nav-toggle-bar" aria-hidden="true" />
            <span className="app-nav-toggle-bar" aria-hidden="true" />
            <span className="sr-only">
              {menuOpen ? 'Close menu' : 'Open menu'}
            </span>
          </button>
          <nav
            id="primary-navigation"
            className={menuOpen ? 'app-nav is-open' : 'app-nav'}
            aria-label="Primary"
          >
            <ul className="app-nav-list">
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      isActive ? 'app-nav-link is-active' : 'app-nav-link'
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <main id="main-content" className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
