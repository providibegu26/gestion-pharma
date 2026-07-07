import { Link } from 'react-router-dom'
import {
  Banknote, TrendingUp, ListOrdered, ArrowRight, ReceiptText,
  ShoppingCart, CheckCircle2, XCircle, Loader2,
} from 'lucide-react'
import { useAuth, usePermissions, useVentes } from '@/adapters/react'
import type { VenteDetail } from '@/core'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/utils/helpers'

const isSameDay = (date: string): boolean => {
  const d = new Date(date)
  const now = new Date()
  return d.toDateString() === now.toDateString()
}

const formatMontant = (montant: string, devise: string) => {
  const n = parseFloat(montant)
  if (isNaN(n)) return '—'
  return devise === 'USD'
    ? `$${n.toFixed(2)}`
    : `${n.toLocaleString('fr-FR')} CDF`
}

const STATUT_STYLE: Record<string, string> = {
  FINALISEE: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  EN_COURS: 'border-amber-200 bg-amber-50 text-amber-800',
  ANNULEE: 'border-rose-200 bg-rose-50 text-rose-800',
}
const STATUT_LABEL: Record<string, string> = {
  FINALISEE: 'Finalisée',
  EN_COURS: 'En cours',
  ANNULEE: 'Annulée',
}

/**
 * Tableau de bord CAISSIER.
 * Périmètre : activité économique — ventes, chiffre d'affaires, file caisse.
 */
export const DashboardCaissier = () => {
  const { user } = useAuth()
  const { definition } = usePermissions()
  const { list } = useVentes()

  const ventes: VenteDetail[] = list.data ?? []
  const ventesFinalisees = ventes.filter((v) => v.statut === 'FINALISEE')
  const ventesAujourdhui = ventesFinalisees.filter((v) => isSameDay(v.createdAt))

  // CA total (séparé par devise)
  const caTotalCDF = ventesAujourdhui
    .filter((v) => v.devise === 'CDF')
    .reduce((sum, v) => sum + parseFloat(v.montantTotal || '0'), 0)

  const caTotalUSD = ventesAujourdhui
    .filter((v) => v.devise === 'USD')
    .reduce((sum, v) => sum + parseFloat(v.montantTotal || '0'), 0)

  const caGlobalCDF = ventesFinalisees
    .filter((v) => v.devise === 'CDF')
    .reduce((sum, v) => sum + parseFloat(v.montantTotal || '0'), 0)

  const recentVentes = [...ventes]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bonjour ${user?.prenom ?? ''}`}
        subtitle={definition?.description ?? 'Suivi de l\'activité économique'}
        icon={<Banknote size={20} />}
        actions={
          <Link to="/professionnel/ventes">
            <Button icon={<ReceiptText size={14} />}>Toutes les ventes</Button>
          </Link>
        }
      />

      {/* KPIs CA journalier */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          title="CA aujourd'hui (CDF)"
          value={list.isLoading ? '…' : `${caTotalCDF.toLocaleString('fr-FR')}`}
          subtitle="Franc congolais"
          icon={<Banknote size={18} />}
          color="sand"
        />
        <StatCard
          title="CA aujourd'hui (USD)"
          value={list.isLoading ? '…' : `$${caTotalUSD.toFixed(2)}`}
          subtitle="Dollar américain"
          icon={<TrendingUp size={18} />}
          color="teal"
          delay={0.05}
        />
        <StatCard
          title="Ventes du jour"
          value={list.isLoading ? '…' : ventesAujourdhui.length}
          subtitle="Transactions finalisées"
          icon={<ShoppingCart size={18} />}
          color="cyan"
          delay={0.1}
        />
        <StatCard
          title="CA global (CDF)"
          value={list.isLoading ? '…' : `${caGlobalCDF.toLocaleString('fr-FR')}`}
          subtitle="Total toutes dates"
          icon={<TrendingUp size={18} />}
          color="emerald"
          delay={0.15}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.6fr] gap-4">
        {/* Dernières ventes */}
        <GlassCard variant="solid" className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-display text-sm font-bold text-slate-900">Ventes récentes</p>
            <Link to="/professionnel/ventes" className="font-body text-xs text-sand-700 hover:underline flex items-center gap-1">
              Voir tout <ArrowRight size={11} />
            </Link>
          </div>

          {list.isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={20} className="animate-spin text-slate-400" />
            </div>
          ) : list.isError ? (
            <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 px-4 py-3">
              <p className="font-body text-sm text-amber-800">
                Les ventes ne sont pas encore disponibles (API en cours de déploiement).
              </p>
            </div>
          ) : recentVentes.length === 0 ? (
            <p className="font-body text-sm text-slate-400 py-4 text-center">Aucune vente enregistrée.</p>
          ) : (
            <div className="space-y-2">
              {recentVentes.map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-sand-50 ring-1 ring-inset ring-sand-200">
                      <ReceiptText size={14} className="text-sand-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-body text-sm font-semibold text-slate-900 truncate">
                        {v.patient
                          ? `${v.patient.prenom} ${v.patient.nom}`
                          : v.user
                          ? `${v.user.prenom} ${v.user.nom}`
                          : 'Client anonyme'}
                      </p>
                      <p className="font-mono text-2xs text-slate-400">
                        {formatDate(v.createdAt)} · {v.lignes.length} article{v.lignes.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-mono text-sm font-bold text-slate-900">
                      {formatMontant(v.montantTotal, v.devise)}
                    </span>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-2xs font-medium ${STATUT_STYLE[v.statut] ?? ''}`}>
                      {STATUT_LABEL[v.statut] ?? v.statut}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Raccourcis + résumé statuts */}
        <div className="space-y-3">
          <GlassCard variant="sand" className="p-5 space-y-3">
            <p className="font-display text-sm font-bold text-slate-900">Résumé</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-body text-emerald-700">
                  <CheckCircle2 size={13} /> Finalisées
                </span>
                <span className="font-mono font-bold text-slate-900">{ventesFinalisees.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-body text-rose-600">
                  <XCircle size={13} /> Annulées
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {ventes.filter((v) => v.statut === 'ANNULEE').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-body text-amber-600">
                  <Loader2 size={13} /> En cours
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {ventes.filter((v) => v.statut === 'EN_COURS').length}
                </span>
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="solid" className="p-5 space-y-2">
            <p className="font-display text-sm font-bold text-slate-900">Accès rapides</p>
            {[
              { to: '/professionnel/ventes', label: 'Ventes & CA', icon: <ReceiptText size={14} /> },
              { to: '/professionnel/file-attente', label: 'File caisse', icon: <ListOrdered size={14} /> },
            ].map((a) => (
              <Link key={a.to} to={a.to}>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 hover:border-sand-300 hover:bg-sand-50/40 transition-colors cursor-pointer mt-1">
                  <div className="flex items-center gap-2 text-slate-700">
                    {a.icon}
                    <span className="font-body text-sm font-medium text-slate-900">{a.label}</span>
                  </div>
                  <ArrowRight size={12} className="text-slate-400" />
                </div>
              </Link>
            ))}
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
