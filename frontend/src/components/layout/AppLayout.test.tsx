import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import AppLayout from './AppLayout'

const PLANNED_SECTIONS = [
  'Dashboard',
  'Accounts',
  'Categories',
  'Transactions',
  'Budgets',
  'Reports',
]

function renderLayout(path = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppLayout />
    </MemoryRouter>,
  )
}

describe('AppLayout', () => {
  it('renders the application name', () => {
    renderLayout()

    expect(screen.getByText('Finance Manager')).toBeInTheDocument()
  })

  it('renders a navigation with all planned financial sections', () => {
    renderLayout()

    const nav = screen.getByRole('navigation', { name: 'Primary' })
    for (const section of PLANNED_SECTIONS) {
      expect(
        within(nav).getByRole('link', { name: section }),
      ).toBeInTheDocument()
    }
  })

  it('renders a main content area', () => {
    renderLayout()

    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('toggles the mobile navigation menu', async () => {
    const user = userEvent.setup()
    renderLayout()

    const toggle = screen.getByRole('button', { name: 'Open menu' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await user.click(toggle)

    expect(
      screen.getByRole('button', { name: 'Close menu' }),
    ).toHaveAttribute('aria-expanded', 'true')
  })
})
