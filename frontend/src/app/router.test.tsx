import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, useRoutes } from 'react-router-dom'

import { routes } from './router'

function renderRoutes(path: string) {
  function RoutesProbe() {
    return useRoutes(routes)
  }

  return render(
    <MemoryRouter initialEntries={[path]}>
      <RoutesProbe />
    </MemoryRouter>,
  )
}

describe('router configuration', () => {
  it('redirects the root route to the dashboard', async () => {
    renderRoutes('/')

    expect(
      await screen.findByRole('heading', { name: 'Dashboard', level: 1 }),
    ).toBeInTheDocument()
  })

  it('renders the dashboard page at /dashboard', () => {
    renderRoutes('/dashboard')

    expect(
      screen.getByRole('heading', { name: 'Dashboard', level: 1 }),
    ).toBeInTheDocument()
  })

  it('renders the login placeholder at /login', () => {
    renderRoutes('/login')

    expect(
      screen.getByRole('heading', { name: 'Sign in', level: 1 }),
    ).toBeInTheDocument()
  })

  it('renders the register placeholder at /register', () => {
    renderRoutes('/register')

    expect(
      screen.getByRole('heading', { name: 'Create account', level: 1 }),
    ).toBeInTheDocument()
  })

  it('renders the not-found page for unknown routes', () => {
    renderRoutes('/unknown-route')

    expect(
      screen.getByRole('heading', { name: 'Page not found', level: 1 }),
    ).toBeInTheDocument()
  })
})
