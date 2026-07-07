import { Link } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingBag, Users, Shield, ListOrdered, Pill, AlertTriangle,
} from 'lucide-react'
import { useAuth, useCommandes, useMedicaments, useUsers } from '@/adapters/react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { GlassCard } from '@/components/ui/GlassCard'
import { Can } from '@/components/auth/Can'

export const AdminDashboardPage = () => {
  const { user } = useAuth()
  const { list: commandes } = useCommandes()
  const { list: medicaments } = useMedicaments()
  const { list: users } = useUsers()

  const cmds = commandes.data ?? []
  const meds = medicaments.data ?? []
  const staff = (users.data ?? []).filter((u) => u.role !== 'CLIENT')
  const alertes = meds.filter((m) => {
    const q = m.stock?.quantite
    const s = m.stock?.seuilMinimum
    return q !== undefined && s !== undefined && q <= s
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tableau de bord"
        subtitle={`Bienvenue ${user?.prenom ?? ''} — vue d'ensemble de la pharmacie`}
        icon={<LayoutDashboard size={20} />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Commandes" value={cmds.length} subtitle={`${cmds.filter((c) => c.statut === 'EN_ATTENTE').length} en attente`} icon={<ShoppingBag size={20} />} color="violet" delay={0} />
        <StatCard title="Personnel" value={staff.length} subtitle="Comptes staff actifs" icon={<Users size={20} />} color="teal" delay={0.05} />
        <StatCard title="Produits" value={meds.length} subtitle="Médicaments en catalogue" icon={<Pill size={20} />} color="cyan" delay={0.1} />
        <StatCard title="Alertes stock" value={alertes.length} subtitle="Produits sous le seuil" icon={<AlertTriangle size={20} />} color="amber" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard variant="solid">
          <h3 className="font-display text-sm font-bold text-slate-900 mb-4">Actions rapides</h3>
          <div className="flex flex-wrap gap-2">
            <Can permission="commandes:read"><Link to="/professionnel/commandes"><Button variant="outline" size="sm">Commandes</Button></Link></Can>
            <Can permission="users:manage"><Link to="/professionnel/utilisateurs"><Button variant="outline" size="sm">Personnel</Button></Link></Can>
            <Can permission="roles:manage"><Link to="/professionnel/roles"><Button variant="outline" size="sm">Rôles</Button></Link></Can>
            <Can permission="file:view"><Link to="/professionnel/file-attente"><Button variant="outline" size="sm">File d'attente</Button></Link></Can>
          </div>
        </GlassCard>

        <GlassCard variant="solid">
          <h3 className="font-display text-sm font-bold text-slate-900 mb-4">Administration</h3>
          <p className="font-body text-sm text-slate-600">
            Gérez les rôles dynamiques, le personnel et supervisez les opérations de la pharmacie depuis ce centre de contrôle.
          </p>
          <Can permission="roles:manage">
            <Link to="/professionnel/roles">
              <Button className="mt-4" size="sm" icon={<Shield size={14} />}>Gérer les rôles</Button>
            </Link>
          </Can>
        </GlassCard>
      </div>
    </div>
  )
}
