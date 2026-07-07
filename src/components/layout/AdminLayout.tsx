import { useAuth, useRoles } from '@/adapters/react'
import { RoleAppLayout } from './RoleAppLayout'
import { getNavForRole } from '@/config/navigation'
import { getRoleUIConfig } from '@/config/roleConfig'

export const AdminLayout = () => {
  const { user, isClient } = useAuth()
  const { list: rolesList } = useRoles({ enabled: !!user && !isClient() })

  const role = user?.role ?? 'CLIENT'
  const config = getRoleUIConfig(role)
  const navItems = getNavForRole(role, rolesList.data)

  return (
    <RoleAppLayout
      navItems={navItems}
      brand={{
        title: 'PharmaDigital',
        subtitle: config.brandSubtitle,
      }}
      accent={config.accent}
      promo={config.promo}
    />
  )
}
