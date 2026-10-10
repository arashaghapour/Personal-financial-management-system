import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import ProtectedRoute from './ProtectedRoute'

describe('ProtectedRoute', () => {
  it('renders its children while authentication is not implemented', () => {
    render(
      <ProtectedRoute>
        <p>Protected content</p>
      </ProtectedRoute>,
    )

    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })
})
