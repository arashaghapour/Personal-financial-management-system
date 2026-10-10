import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renders the title and description', () => {
    render(
      <EmptyState
        title="No accounts yet"
        description="Add an account to get started."
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'No accounts yet' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Add an account to get started.'),
    ).toBeInTheDocument()
  })

  it('renders an optional action', () => {
    render(
      <EmptyState
        title="No accounts yet"
        action={<button type="button">Add account</button>}
      />,
    )

    expect(
      screen.getByRole('button', { name: 'Add account' }),
    ).toBeInTheDocument()
  })
})
