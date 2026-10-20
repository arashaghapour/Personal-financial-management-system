import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '../features/auth/auth-context'
import { LoadingIndicator } from '../components/ui/LoadingIndicator'

type ProtectedRouteProps = {
  children: ReactNode
}

/**
 * Route guard for authenticated pages.
 *
 * While the session is being restored a loading indicator is shown.
 * Unauthenticated users are redirected to /login, preserving the intended
 * destination so login can return them to it.
 *
 * NOTE: This is not a security boundary. The backend remains authoritative
 * for authentication and authorization.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <LoadingIndicator label="Restoring your session…" />
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}
