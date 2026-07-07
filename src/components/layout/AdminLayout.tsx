import { LayoutDashboard, Pill, ShoppingBag, Users2, Shield, ListOrdered, ReceiptText } from 'lucide-react'
import { useAuth } from '@/adapters/react'
import { getRoleDefinition, navForRole, type NavIconKey, type RoleColor } from '@/core'
import { RoleAppLayout } from './RoleAppLayout'
import { RealtimeBridge } from '@/components/realtime/RealtimeBridge'
import type { NavItemDef } from './RoleSidebar'

const ICON = 18

// Mappe les clés d'icônes sémantiques du registre (core) vers les composants
// Lucide. La couche core reste ainsi 100% agnostique du framework/UI.
const NAV_ICONS: Record<NavIconKey, React.ReactNode> = {
  dashboard: <LayoutDashboard size={ICON} />,
  produits: <Pill size={ICON} />,
  commandes: <ShoppingBag size={ICON} />,
  queue: <ListOrdered size={ICON} />,
  users: <Users2 size={ICON} />,
  roles: <Shield size={ICON} />,
  ventes: <ReceiptText size={ICON} />,
}

// L'accent de sidebar attendu par RoleAppLayout n'inclut pas "emerald" :
// on retombe sur "teal" pour l'espace client.
const ACCENT_BY_COLOR: Record<RoleColor, 'teal' | 'cyan' | 'sand' | 'violet'> = {
  violet: 'violet',
  teal: 'teal',
  cyan: 'cyan',
  sand: 'sand',
  emerald: 'teal',
}

export const AdminLayout = () => {
  const { user } = useAuth()
  const def = user ? getRoleDefinition(user.role) : null

  const navItems: NavItemDef[] = navForRole(user?.role).map((item) => ({
    to: item.to,
    label: item.label,
    section: item.section,
    icon: NAV_ICONS[item.icon],
  }))

  const isClientSpace = def?.space === 'client'

  return (
    <>
      {/* Synchronisation temps réel (silencieuse si WebSocket indisponible). */}
      <RealtimeBridge />
      <RoleAppLayout
        navItems={navItems}
        brand={{
          title: 'PharmaDigital',
          subtitle: isClientSpace ? 'Espace Client' : 'Espace Personnel',
        }}
        accent={def ? ACCENT_BY_COLOR[def.color] : 'teal'}
      />
    </>
  )
}
