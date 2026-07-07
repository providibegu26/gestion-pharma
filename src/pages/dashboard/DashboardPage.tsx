import { useAuth } from '@/adapters/react'
import { DashboardAdmin } from './DashboardAdmin'
import { DashboardPharmacien } from './DashboardPharmacien'
import { DashboardCaissier } from './DashboardCaissier'
import { DashboardClient } from './DashboardClient'

/**
 * Routeur de tableau de bord.
 * Délègue au composant dédié selon le rôle de l'utilisateur connecté.
 * Chaque rôle dispose d'une interface unique, adaptée à ses responsabilités métier.
 */
export const DashboardPage = () => {
  const { user } = useAuth()

  switch (user?.role) {
    case 'ADMIN':
      return <DashboardAdmin />
    case 'PHARMACIEN':
      return <DashboardPharmacien />
    case 'CAISSIER':
      return <DashboardCaissier />
    case 'CLIENT':
      return <DashboardClient />
    default:
      return <DashboardClient />
  }
}
