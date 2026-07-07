import { Link } from 'react-router-dom'
import {
  Users2, Shield, UserPlus, Key, AlertOctagon, ArrowRight,
  UserCheck, Clock,
} from 'lucide-react'
import { useAuth, useUsers, usePermissions } from '@/adapters/react'
import { assignableRoles, ROLE_REGISTRY } from '@/core'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/utils/helpers'

const ROLE_COLORS: Record<string, string> = {
  PHARMACIEN: 'bg-teal-100 text-teal-800 border-teal-200',
  CAISSIER: 'bg-sand-100 text-sand-800 border-sand-200',
  ADMIN: 'bg-violet-100 text-violet-800 border-violet-200',
  CLIENT: 'bg-emerald-100 text-emerald-800 border-emerald-200',
}

/**
 * Tableau de bord ADMIN.
 * Périmètre : supervision du personnel (comptes & rôles).
 * L'ADMIN n'a aucun accès aux médicaments, commandes ou ventes (403 backend).
 */
export const DashboardAdmin = () => {
  const { user } = useAuth()
  const { definition } = usePermissions()
  const { list } = useUsers()
  const users = list.data ?? []

  const staff = users.filter((u) => u.role !== 'CLIENT')
  const clients = users.filter((u) => u.role === 'CLIENT')
  const recent = [...staff].sort(
    (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
  ).slice(0, 6)

  const staffByRole = assignableRoles().map((r) => ({
    ...r,
    count: staff.filter((u) => u.role === r.key).length,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bonjour ${user?.prenom ?? 'Administrateur'}`}
        subtitle={definition?.description ?? 'Supervision du personnel'}
        icon={<Shield size={20} />}
        actions={
          <Link to="/professionnel/utilisateurs">
            <Button icon={<UserPlus size={14} />}>Nouveau membre</Button>
          </Link>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          title="Personnel actif"
          value={list.isLoading ? '…' : staff.length}
          subtitle="Comptes staff"
          icon={<Users2 size={18} />}
          color="violet"
        />
        <StatCard
          title="Clients inscrits"
          value={list.isLoading ? '…' : clients.length}
          subtitle="Comptes clients"
          icon={<UserCheck size={18} />}
          color="emerald"
          delay={0.05}
        />
        <StatCard
          title="Rôles"
          value={assignableRoles().length}
          subtitle="Rôles attribuables"
          icon={<Shield size={18} />}
          color="violet"
          delay={0.1}
        />
        <StatCard
          title="Total comptes"
          value={list.isLoading ? '…' : users.length}
          subtitle="Tous rôles confondus"
          icon={<Key size={18} />}
          color="cyan"
          delay={0.15}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Répartition par rôle */}
        <GlassCard variant="solid" className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-display text-sm font-bold text-slate-900">Répartition du personnel</p>
            <Shield size={15} className="text-slate-400" />
          </div>
          {list.isLoading ? (
            <div className="space-y-2">
              {[1, 2].map(i => <div key={i} className="h-10 rounded-xl bg-slate-100 animate-pulse" />)}
            </div>
          ) : staffByRole.length === 0 ? (
            <p className="font-body text-sm text-slate-400 py-4 text-center">Aucun membre enregistré.</p>
          ) : (
            <div className="space-y-3">
              {staffByRole.map((r) => (
                <div key={r.key} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[r.key] ?? 'bg-slate-100 text-slate-700'}`}>
                      {r.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 rounded-full bg-slate-100 w-24 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-violet-500 transition-all duration-500"
                        style={{ width: staff.length ? `${(r.count / staff.length) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="font-mono text-xs text-slate-600 w-6 text-right">{r.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Derniers membres ajoutés */}
        <GlassCard variant="solid" className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-display text-sm font-bold text-slate-900">Membres récents</p>
            <Clock size={15} className="text-slate-400" />
          </div>
          {list.isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />)}
            </div>
          ) : recent.length === 0 ? (
            <div className="py-6 text-center">
              <AlertOctagon size={24} className="mx-auto text-slate-300 mb-2" />
              <p className="font-body text-sm text-slate-400">Aucun membre enregistré.</p>
              <Link to="/professionnel/utilisateurs" className="mt-2 inline-block">
                <Button size="sm" icon={<UserPlus size={13} />}>Ajouter un membre</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((u) => (
                <div key={u.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-2.5">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 text-sm font-bold">
                    {(u.prenom?.[0] ?? '') + (u.nom?.[0] ?? '')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-semibold text-slate-900 truncate">
                      {u.prenom} {u.nom}
                    </p>
                    <p className="font-mono text-2xs text-slate-400">{u.email}</p>
                  </div>
                  <span className={`flex-shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-2xs font-medium ${ROLE_COLORS[u.role] ?? 'bg-slate-100 text-slate-600'}`}>
                    {ROLE_REGISTRY[u.role]?.label ?? u.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Raccourcis */}
      <GlassCard variant="solid" className="p-5">
        <p className="font-display text-sm font-bold text-slate-900 mb-3">Accès rapides</p>
        <div className="flex flex-wrap gap-2">
          <Link to="/professionnel/utilisateurs">
            <Button variant="outline" size="sm" icon={<Users2 size={14} />} iconRight={<ArrowRight size={13} />}>
              Gérer le personnel
            </Button>
          </Link>
          <Link to="/professionnel/roles">
            <Button variant="outline" size="sm" icon={<Shield size={14} />} iconRight={<ArrowRight size={13} />}>
              Gérer les rôles
            </Button>
          </Link>
        </div>
      </GlassCard>
    </div>
  )
}
