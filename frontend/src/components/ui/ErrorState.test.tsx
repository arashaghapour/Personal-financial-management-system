import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { ErrorState } from './ErrorState'

describe('ErrorState', () => {
  it('renders a default title in an alert region', () => {
    render(<ErrorState />)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Something went wrong')
  })

  it('renders a custom title and message', () => {
    render(
      <ErrorState
        title="Unable to load accounts"
        message="Please try again later."
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Unable to load accounts' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Please try again later.')).toBeInTheDocument()
  })
})
