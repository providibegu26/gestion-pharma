import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/adapters/react'
import { Spinner } from '@/components/ui/Spinner'
import type { Permission } from '@/config/permissions'
import { usePermissions } from '@/hooks/usePermissions'

interface PermissionRouteProps {
  permission: Permission
}

export const PermissionRoute = ({ permission }: PermissionRouteProps) => {
  const { isLoading, user, homeForRole } = useAuth()
  const { can } = usePermissions()

  if (isLoading && !user) return <Spinner fullPage />
  if (!can(permission)) return <Navigate to={homeForRole()} replace />
  return <Outlet />
}
