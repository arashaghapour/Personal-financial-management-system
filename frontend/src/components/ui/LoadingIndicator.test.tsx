import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { LoadingIndicator } from './LoadingIndicator'

describe('LoadingIndicator', () => {
  it('announces the default loading label to assistive technology', () => {
    render(<LoadingIndicator />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading…')
  })

  it('supports a custom loading label', () => {
    render(<LoadingIndicator label="Loading accounts…" />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading accounts…')
  })
})
