import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { PageContainer } from './PageContainer'

describe('PageContainer', () => {
  it('renders its children inside a page container', () => {
    render(
      <PageContainer>
        <p>Page content</p>
      </PageContainer>,
    )

    expect(screen.getByText('Page content')).toBeInTheDocument()
  })
})
