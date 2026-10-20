import { RouterProvider } from 'react-router-dom'

import { router } from './router'
import { AuthProvider } from '../features/auth/AuthProvider'

/**
 * Application-wide providers. AuthProvider wraps the router so route guards
 * can read the authentication state.
 */
export function Providers() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
