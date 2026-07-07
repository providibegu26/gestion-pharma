import {
  LayoutDashboard, Pill, ShoppingBag, Shield, Users, ListOrdered,
} from 'lucide-react'
import { createElement } from 'react'
import type { NavItemDef } from '@/components/layout/RoleSidebar'
import type { Permission } from './permissions'
import { SYSTEM_ROLE_PERMISSIONS, isSystemRole } from './permissions'
import type { RoleDefinition } from '@/core'

const ICON = 18
const ic = (Icon: React.ComponentType<{ size?: number }>) => createElement(Icon, { size: ICON })

export interface NavItemConfig extends NavItemDef {
  permission?: Permission
}

const ALL_NAV_ITEMS: NavItemConfig[] = [
  { to: '/professionnel/dashboard', icon: ic(LayoutDashboard), label: 'Tableau de bord', section: 'Accueil', permission: 'dashboard:view' },
  { to: '/professionnel/produits',    icon: ic(Pill),           label: 'Produits',         section: 'Catalogue', permission: 'produits:read' },
  { to: '/professionnel/commandes',   icon: ic(ShoppingBag),    label: 'Commandes',        section: 'Opérations', permission: 'commandes:read' },
  { to: '/professionnel/file-attente', icon: ic(ListOrdered),   label: 'File d\'attente',  section: 'Opérations', permission: 'file:view' },
  { to: '/professionnel/utilisateurs', icon: ic(Users),         label: 'Personnel',        section: 'Administration', permission: 'users:manage' },
  { to: '/professionnel/roles',       icon: ic(Shield),         label: 'Rôles',            section: 'Administration', permission: 'roles:manage' },
]

const CLIENT_NAV_ITEMS: NavItemConfig[] = [
  { to: '/client/dashboard', icon: ic(LayoutDashboard), label: 'Tableau de bord', section: 'Espace client', permission: 'dashboard:view' },
  { to: '/client/produits',  icon: ic(Pill),           label: 'Produits',        section: 'Espace client', permission: 'produits:read' },
  { to: '/client/commandes', icon: ic(ShoppingBag),    label: 'Mes commandes',   section: 'Espace client', permission: 'commandes:read' },
]

const resolvePermissions = (
  role: string,
  customRoles?: RoleDefinition[],
): Permission[] => {
  if (isSystemRole(role)) return SYSTEM_ROLE_PERMISSIONS[role]
  const custom = customRoles?.find((r) => r.code === role)
  return (custom?.permissions ?? []) as Permission[]
}

export const getNavForRole = (
  role: string,
  customRoles?: RoleDefinition[],
): NavItemDef[] => {
  const perms = resolvePermissions(role, customRoles)
  const has = (p?: Permission) => !p || perms.includes(p)

  if (role === 'CLIENT') {
    return CLIENT_NAV_ITEMS.filter((item) => has(item.permission))
  }

  return ALL_NAV_ITEMS.filter((item) => has(item.permission))
}
