import { Shield, ShoppingBag, Pill } from 'lucide-react'
import { useAuth } from '@/adapters/react'
import { RoleAppLayout } from './RoleAppLayout'
import type { NavItemDef } from './RoleSidebar'

const ICON = 18

const staffNav: NavItemDef[] = [
  { to: '/professionnel/produits',    icon: <Pill size={ICON} />,        label: 'Produits',    section: 'Catalogue' },
  { to: '/professionnel/commandes',   icon: <ShoppingBag size={ICON} />, label: 'Commandes',   section: 'Opérations' },
  { to: '/professionnel/utilisateurs', icon: <Shield size={ICON} />,      label: 'Personnel',   section: 'Administration' },
]

const clientNav: NavItemDef[] = [
  { to: '/client/produits',  icon: <Pill size={ICON} />,        label: 'Produits',      section: 'Espace client' },
  { to: '/client/commandes', icon: <ShoppingBag size={ICON} />, label: 'Mes commandes', section: 'Espace client' },
]

export const AdminLayout = () => {
  const { isClient } = useAuth()
  const isClientUser = isClient()

  return (
    <RoleAppLayout
      navItems={isClientUser ? clientNav : staffNav}
      brand={{
        title: 'PharmaDigital',
        subtitle: isClientUser ? 'Espace Client' : 'Espace Personnel',
      }}
      accent={isClientUser ? 'teal' : 'violet'}
    />
  )
}
