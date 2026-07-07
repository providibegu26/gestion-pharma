import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, ShoppingBag, Pill, Clock } from 'lucide-react'
import { useAuth, useCommandes } from '@/adapters/react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { GlassCard } from '@/components/ui/GlassCard'
import { getStatutCommandeLabel } from '@/utils/helpers'

export const ClientDashboardPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { list: commandes } = useCommandes()

  const cmds = commandes.data ?? []
  const pending = cmds.filter((c) => c.statut === 'EN_ATTENTE')
  const recent = cmds.slice(0, 3)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mon espace"
        subtitle={`Bienvenue ${user?.prenom ?? ''}, suivez vos commandes en ligne`}
        icon={<LayoutDashboard size={20} />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Mes commandes" value={cmds.length} subtitle="Total passées" icon={<ShoppingBag size={20} />} color="teal" />
        <StatCard title="En attente" value={pending.length} subtitle="En cours de traitement" icon={<Clock size={20} />} color="amber" />
        <StatCard title="Catalogue" value="→" subtitle="Commander des produits" icon={<Pill size={20} />} color="cyan" />
      </div>

      <GlassCard variant="solid">
        <h3 className="font-display text-sm font-bold text-slate-900 mb-3">Dernières commandes</h3>
        {recent.length === 0 ? (
          <p className="font-body text-sm text-slate-500">Vous n'avez pas encore passé de commande.</p>
        ) : (
          <div className="space-y-2">
            {recent.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                <div>
                  <p className="font-mono text-sm font-semibold text-slate-900">#{c.id.slice(-6).toUpperCase()}</p>
                  <p className="font-body text-2xs text-slate-500">{c.lignes.length} produit(s)</p>
                </div>
                <span className="font-medical text-2xs font-semibold text-slate-600">
                  {getStatutCommandeLabel(c.statut)}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2 mt-4">
          <Button size="sm" onClick={() => navigate('/client/produits')}>Parcourir le catalogue</Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/client/commandes')}>Mes commandes</Button>
        </div>
      </GlassCard>
    </div>
  )
}
