import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, ListOrdered, Users, CheckCircle2 } from 'lucide-react'
import { useAuth, useFileAttente } from '@/adapters/react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { GlassCard } from '@/components/ui/GlassCard'
import { Can } from '@/components/auth/Can'

export const CaissierDashboardPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { state: fileState } = useFileAttente()

  const file = fileState.data
  const waiting = file?.tickets.filter((t) => t.statut === 'EN_ATTENTE') ?? []
  const done = file?.tickets.filter((t) => t.statut === 'TERMINE') ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Espace caissier"
        subtitle={`${user?.prenom ?? ''}, gérez la file de retrait des commandes validées`}
        icon={<LayoutDashboard size={20} />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="En attente" value={waiting.length} subtitle="Clients à appeler" icon={<Users size={20} />} color="amber" />
        <StatCard title="En cours" value={file?.enCours ? `#${file.enCours.numero}` : '—'} subtitle="Client en traitement" icon={<ListOrdered size={20} />} color="teal" />
        <StatCard title="Terminés" value={done.length} subtitle="Retraits effectués" icon={<CheckCircle2 size={20} />} color="emerald" />
      </div>

      <GlassCard variant="solid">
        <h3 className="font-display text-sm font-bold text-slate-900 mb-3">Prochain client</h3>
        {file?.prochain ? (
          <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-6 text-center">
            <p className="font-medical text-2xs text-teal-600 uppercase tracking-widest">Numéro</p>
            <p className="font-mono text-5xl font-bold text-teal-800 mt-1">#{file.prochain.numero}</p>
            <p className="font-body text-sm text-teal-700 mt-2">{file.prochain.clientNom}</p>
          </div>
        ) : (
          <p className="font-body text-sm text-slate-500">Aucun client en attente pour le moment.</p>
        )}
        <Can permission="file:view">
          <Button className="mt-4" size="sm" icon={<ListOrdered size={14} />} onClick={() => navigate('/professionnel/file-attente')}>
            Accéder à la file
          </Button>
        </Can>
      </GlassCard>
    </div>
  )
}
