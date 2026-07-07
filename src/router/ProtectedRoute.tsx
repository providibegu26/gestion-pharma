/**
 * Gardes de routes applicatives.
 *
 * - `ProtectedRoute` : accès réservé aux utilisateurs authentifiés,
 *   avec filtrage optionnel par rôles.
 * - `GuestRoute` : accès réservé aux invités (login/register).
 *
 * La source de vérité est `AuthStore` (exposé via `useAuth`).
 */
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/adapters/react'
import { Spinner } from '@/components/ui/Spinner'
import type { Role } from '@/core'

interface ProtectedRouteProps {
  roles?: Role[]
}

export const ProtectedRoute = ({ roles }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user, homeForRole } = useAuth()

  if (isLoading && !user) return <Spinner fullPage />
  if (!isAuthenticated && !user) return <Navigate to="/login-staff" replace />
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to={homeForRole()} replace />
  }
  return <Outlet />
}

export const GuestRoute = () => {
  const { isAuthenticated, user, homeForRole } = useAuth()

  if (isAuthenticated || user) return <Navigate to={homeForRole()} replace />
  return <Outlet />
}
