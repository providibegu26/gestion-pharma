import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingBag, ListOrdered, Pill, CheckCircle2, Clock,
} from 'lucide-react'
import { useAuth, useCommandes, useFileAttente } from '@/adapters/react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { GlassCard } from '@/components/ui/GlassCard'
import { Can } from '@/components/auth/Can'

export const PharmacienDashboardPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { list: commandes } = useCommandes()
  const { state: fileState } = useFileAttente()

  const cmds = commandes.data ?? []
  const pending = cmds.filter((c) => c.statut === 'EN_ATTENTE')
  const file = fileState.data

  return (
    <div className="space-y-6">
      <PageHeader
        title="Espace pharmacien"
        subtitle={`${user?.prenom ?? ''}, validez les commandes et gérez les retraits`}
        icon={<LayoutDashboard size={20} />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="En attente" value={pending.length} subtitle="Commandes à traiter" icon={<Clock size={20} />} color="amber" />
        <StatCard title="Prêtes" value={cmds.filter((c) => c.statut === 'PRETE').length} subtitle="Prêtes pour retrait" icon={<CheckCircle2 size={20} />} color="emerald" />
        <StatCard title="File d'attente" value={file?.tickets.filter((t) => t.statut === 'EN_ATTENTE').length ?? '—'} subtitle="Clients en attente" icon={<ListOrdered size={20} />} color="teal" />
        <StatCard title="En cours" value={file?.enCours ? `#${file.enCours.numero}` : '—'} subtitle="Client appelé" icon={<ShoppingBag size={20} />} color="cyan" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard variant="solid">
          <h3 className="font-display text-sm font-bold text-slate-900 mb-3">Commandes urgentes</h3>
          {pending.length === 0 ? (
            <p className="font-body text-sm text-slate-500">Aucune commande en attente de validation.</p>
          ) : (
            <div className="space-y-2">
              {pending.slice(0, 3).map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                  <div>
                    <p className="font-body text-sm font-semibold text-slate-900">
                      {c.client ? `${c.client.prenom} ${c.client.nom}` : 'Client'}
                    </p>
                    <p className="font-mono text-2xs text-slate-500">#{c.id.slice(-6).toUpperCase()}</p>
                  </div>
                  <span className="rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-2xs font-semibold">
                    En attente
                  </span>
                </div>
              ))}
            </div>
          )}
          <Can permission="commandes:read">
            <Button className="mt-4" size="sm" onClick={() => navigate('/professionnel/commandes')}>
              Voir toutes les commandes
            </Button>
          </Can>
        </GlassCard>

        <GlassCard variant="solid">
          <h3 className="font-display text-sm font-bold text-slate-900 mb-3">File de retrait</h3>
          <p className="font-body text-sm text-slate-600 mb-4">
            Gérez l'appel des clients en pharmacie via la file d'attente temps réel.
          </p>
          <Can permission="file:view">
            <Button size="sm" icon={<ListOrdered size={14} />} onClick={() => navigate('/professionnel/file-attente')}>
              Ouvrir la file d'attente
            </Button>
          </Can>
        </GlassCard>
      </div>
    </div>
  )
}
