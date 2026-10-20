import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '../features/auth/auth-context'
import { LoadingIndicator } from '../components/ui/LoadingIndicator'

type PublicOnlyRouteProps = {
  children: ReactNode
}

/**
 * Route guard for public-only pages (login, register).
 *
 * Authenticated users are redirected to the dashboard so they cannot reach
 * the authentication pages through normal navigation.
 */
export default function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { status } = useAuth()

  if (status === 'loading') {
    return <LoadingIndicator label="Loading…" />
  }

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
