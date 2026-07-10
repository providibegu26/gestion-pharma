import { LayoutDashboard, Pill, ShoppingBag, Users2, Shield, ListOrdered, ReceiptText } from 'lucide-react'
import { useAuth, useCommandes } from '@/adapters/react'
import { getRoleDefinition, navForRole, type NavIconKey, type RoleColor } from '@/core'
import { RoleAppLayout } from './RoleAppLayout'
import { RealtimeBridge } from '@/components/realtime/RealtimeBridge'
import { DEMO_HIDE_ROLE_UI } from '@/utils/demo'
import type { NavItemDef } from './RoleSidebar'

const ICON = 18

const NAV_ICONS: Record<NavIconKey, React.ReactNode> = {
  dashboard: <LayoutDashboard size={ICON} />,
  produits: <Pill size={ICON} />,
  commandes: <ShoppingBag size={ICON} />,
  queue: <ListOrdered size={ICON} />,
  users: <Users2 size={ICON} />,
  roles: <Shield size={ICON} />,
  ventes: <ReceiptText size={ICON} />,
}

const ACCENT_BY_COLOR: Record<RoleColor, 'teal' | 'cyan' | 'sand' | 'violet' | 'emerald'> = {
  violet: 'violet',
  teal: 'teal',
  cyan: 'cyan',
  sand: 'sand',
  emerald: 'emerald',
}

export const AdminLayout = () => {
  const { user } = useAuth()
  const { list: commandesList } = useCommandes()
  const def = user ? getRoleDefinition(user.role) : null

  const commandes = commandesList.data ?? []
  const pendingCount = commandes.filter((c) => c.statut === 'EN_ATTENTE').length
  const readyCount = commandes.filter((c) => c.statut === 'PRETE').length

  const navItems: NavItemDef[] = navForRole(user?.role)
    .filter((item) => !DEMO_HIDE_ROLE_UI || !item.to.includes('/roles'))
    .map((item) => {
      let badge: number | undefined
      if (item.to.includes('/commandes')) {
        badge = user?.role === 'CLIENT' ? readyCount || undefined : pendingCount || undefined
      }
      return {
        to: item.to,
        label: item.label,
        section: item.section,
        icon: NAV_ICONS[item.icon],
        badge,
      }
    })

  const isClientSpace = def?.space === 'client'
  const isPharmacien = user?.role === 'PHARMACIEN'

  return (
    <>
      <RealtimeBridge />
      <RoleAppLayout
        navItems={navItems}
        brand={{
          title: 'PharmaDigital',
          subtitle: isClientSpace ? 'Espace Client' : isPharmacien ? 'Pharmacie' : 'Espace Personnel',
        }}
        promo={isClientSpace ? {
          title: readyCount > 0 ? 'Commande prête !' : 'Besoin d\'aide ?',
          description: readyCount > 0
            ? `${readyCount} commande${readyCount > 1 ? 's' : ''} à retirer — présentez votre QR en pharmacie.`
            : 'Commandez en ligne et suivez votre commande en temps réel.',
        } : isPharmacien && pendingCount > 0 ? {
          title: `${pendingCount} commande${pendingCount > 1 ? 's' : ''} en attente`,
          description: 'Des clients attendent la validation de leurs commandes.',
        } : null}
        accent={def ? ACCENT_BY_COLOR[def.color] : 'teal'}
        theme={isClientSpace ? 'client' : isPharmacien ? 'pro' : 'default'}
      />
    </>
  )
}
