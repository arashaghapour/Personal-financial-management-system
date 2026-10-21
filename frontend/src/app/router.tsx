import type { RouteObject } from 'react-router-dom'
import { createBrowserRouter, Navigate } from 'react-router-dom'

import ProtectedRoute from './ProtectedRoute'
import PublicOnlyRoute from './PublicOnlyRoute'
import AppLayout from '../components/layout/AppLayout'
import AccountsPage from '../pages/AccountsPage'
import CategoriesPage from '../pages/CategoriesPage'
import DashboardPage from '../pages/DashboardPage'
import LoginPage from '../pages/LoginPage'
import NotFoundPage from '../pages/NotFoundPage'
import RegisterPage from '../pages/RegisterPage'
import TransactionsPage from '../pages/TransactionsPage'

/**
 * Centralized route configuration for the application.
 *
 * Current routes:
 * - /            redirects to /dashboard
 * - /dashboard   initial dashboard placeholder (protected route)
 * - /accounts    account management page (protected route)
 * - /categories  category management page (protected route)
 * - /transactions transaction management page (protected route)
 * - /login       authentication page (public only)
 * - /register    registration page (public only)
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
      {
        path: 'accounts',
        element: (
          <ProtectedRoute>
            <AccountsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'categories',
        element: (
          <ProtectedRoute>
            <CategoriesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'transactions',
        element: (
          <ProtectedRoute>
            <TransactionsPage />
          </ProtectedRoute>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: 'login',
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: 'register',
    element: (
      <PublicOnlyRoute>
        <RegisterPage />
      </PublicOnlyRoute>
    ),
  },
]

export const router = createBrowserRouter(routes)
