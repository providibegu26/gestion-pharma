import type { Permission } from '@/config/permissions'
import { usePermissions } from '@/hooks/usePermissions'

interface CanProps {
  permission?: Permission
  anyOf?: Permission[]
  allOf?: Permission[]
  fallback?: React.ReactNode
  children: React.ReactNode
}

export const Can = ({ permission, anyOf, allOf, fallback = null, children }: CanProps) => {
  const { can, canAny, canAll } = usePermissions()

  const allowed = permission
    ? can(permission)
    : anyOf
      ? canAny(...anyOf)
      : allOf
        ? canAll(...allOf)
        : true

  return allowed ? <>{children}</> : <>{fallback}</>
}
