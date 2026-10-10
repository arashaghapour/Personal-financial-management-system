import type { ReactNode } from 'react'

import '../../styles/ui.css'

type ErrorStateProps = {
  title?: string
  message?: string
  /** Optional recovery action, such as a retry button. */
  action?: ReactNode
}

/**
 * User-facing error placeholder for failed requests or unexpected problems.
 */
export function ErrorState({
  title = 'Something went wrong',
  message,
  action,
}: ErrorStateProps) {
  return (
    <div className="state state--error" role="alert">
      <h3 className="state-title">{title}</h3>
      {message ? <p className="state-description">{message}</p> : null}
      {action}
    </div>
  )
}
