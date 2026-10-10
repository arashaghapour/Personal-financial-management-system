import type { RouteObject } from 'react-router-dom'
import { createBrowserRouter, Navigate } from 'react-router-dom'

import ProtectedRoute from './ProtectedRoute'
import AppLayout from '../components/layout/AppLayout'
import DashboardPage from '../pages/DashboardPage'
import LoginPage from '../pages/LoginPage'
import NotFoundPage from '../pages/NotFoundPage'
import RegisterPage from '../pages/RegisterPage'

/**
 * Centralized route configuration for the application.
 *
 * Current routes:
 * - /            redirects to /dashboard
 * - /dashboard   initial dashboard placeholder (protected route foundation)
 * - /login       placeholder for future authentication
 * - /register    placeholder for future authentication
 * - *            not-found page for unmatched routes
 */
export const routes: RouteObject[] = [
  {
    // Shared application shell (header, navigation, main content area).
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: 'login',
    element: <LoginPage />,
  },
  {
    path: 'register',
    element: <RegisterPage />,
  },
]

export const router = createBrowserRouter(routes)
