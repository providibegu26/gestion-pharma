import { Clock, UserCheck, CheckCircle2, UserX } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import type { FileAttenteState } from '@/core'

interface QueueStatsProps {
  state: FileAttenteState | undefined
  loading?: boolean
}

export const QueueStats = ({ state, loading }: QueueStatsProps) => {
  const tickets = state?.tickets ?? []
  const waiting = tickets.filter((t) => t.statut === 'EN_ATTENTE').length
  const done = tickets.filter((t) => t.statut === 'TERMINE').length
  const absent = tickets.filter((t) => t.statut === 'ANNULE').length

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard title="En attente" value={loading ? '…' : waiting} icon={<Clock size={18} />} color="amber" />
      <StatCard title="En cours" value={loading ? '…' : (state?.enCours ? `#${state.enCours.numero}` : '—')} icon={<UserCheck size={18} />} color="teal" />
      <StatCard title="Terminés" value={loading ? '…' : done} icon={<CheckCircle2 size={18} />} color="emerald" />
      <StatCard title="Annulés" value={loading ? '…' : absent} icon={<UserX size={18} />} color="rose" />
    </div>
  )
}
