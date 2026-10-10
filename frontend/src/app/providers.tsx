import { RouterProvider } from 'react-router-dom'

import { router } from './router'

/**
 * Application-wide providers. Additional providers (theme, data fetching,
 * authentication context, ...) are added here as they become necessary.
 */
export function Providers() {
  return <RouterProvider router={router} />
}
