import { useAuth } from '@/adapters/react'
import { AdminDashboardPage } from './AdminDashboardPage'
import { PharmacienDashboardPage } from './PharmacienDashboardPage'
import { CaissierDashboardPage } from './CaissierDashboardPage'
import { ClientDashboardPage } from './ClientDashboardPage'

export const DashboardPage = () => {
  const { user, isClient } = useAuth()

  if (isClient()) return <ClientDashboardPage />

  switch (user?.role) {
    case 'ADMIN':      return <AdminDashboardPage />
    case 'PHARMACIEN': return <PharmacienDashboardPage />
    case 'CAISSIER':   return <CaissierDashboardPage />
    default:           return <PharmacienDashboardPage />
  }
}
