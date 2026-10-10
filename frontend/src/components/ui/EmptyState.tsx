import type { ReactNode } from 'react'

import '../../styles/ui.css'

type EmptyStateProps = {
  title: string
  description?: string
  /** Optional call-to-action rendered below the description. */
  action?: ReactNode
}

/**
 * Friendly placeholder shown when a list or section has no content yet.
 */
export function EmptyState({
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="state">
      <h3 className="state-title">{title}</h3>
      {description ? (
        <p className="state-description">{description}</p>
      ) : null}
      {action}
    </div>
  )
}
