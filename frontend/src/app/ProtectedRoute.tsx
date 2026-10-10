import type { ReactNode } from 'react'

type ProtectedRouteProps = {
  children: ReactNode
}

/**
 * Foundation for routes that will require an authenticated user.
 *
 * Authentication and authorization are intentionally NOT implemented yet, so
 * this placeholder renders its children unconditionally. This keeps the
 * initial placeholder routes reachable while the app shell is built.
 *
 * NOTE: This component is not a security boundary. Protected data must always
 * be enforced by the backend, which remains the authoritative source for
 * authentication and authorization.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  // TODO(auth): render children only when an authenticated user exists once
  // authentication is implemented, and redirect to /login otherwise.
  return <>{children}</>
}
