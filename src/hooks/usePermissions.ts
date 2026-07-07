import { useMemo } from 'react'
import { useAuth } from '@/adapters/react'
import { useRoles } from '@/adapters/react/hooks/useRoles'
import type { Permission } from '@/config/permissions'
import { getSystemPermissions, isSystemRole } from '@/config/permissions'

export const usePermissions = () => {
  const { user } = useAuth()
  const { list: rolesList } = useRoles({ enabled: !!user && user.role !== 'CLIENT' })

  const permissions = useMemo((): Permission[] => {
    if (!user) return []
    const role = user.role
    if (isSystemRole(role)) return getSystemPermissions(role)
    const custom = rolesList.data?.find((r) => r.code === role)
    return (custom?.permissions ?? []) as Permission[]
  }, [user, rolesList.data])

  const can = (permission: Permission): boolean =>
    permissions.includes(permission)

  const canAny = (...perms: Permission[]): boolean =>
    perms.some((p) => permissions.includes(p))

  const canAll = (...perms: Permission[]): boolean =>
    perms.every((p) => permissions.includes(p))

  return { permissions, can, canAny, canAll }
}
