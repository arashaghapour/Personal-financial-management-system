import type { ReactNode } from 'react'

import '../../styles/ui.css'

type PageContainerProps = {
  children: ReactNode
  className?: string
}

/**
 * Constrains page content to a readable, centered width.
 */
export function PageContainer({ children, className }: PageContainerProps) {
  const classes = ['page-container', className].filter(Boolean).join(' ')

  return <div className={classes}>{children}</div>
}
