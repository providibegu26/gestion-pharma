import { Link } from 'react-router-dom'
import {
  Pill, ShoppingBag, Clock, CheckCircle2, AlertTriangle,
  ListOrdered, ArrowRight, PackageCheck, ScanLine,
} from 'lucide-react'
import { useAuth, usePermissions, useCommandes, useMedicaments } from '@/adapters/react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/utils/helpers'

/**
 * Tableau de bord PHARMACIEN.
 * Périmètre : opérations médicales — stock, commandes, alertes, file d'attente.
 */
export const DashboardPharmacien = () => {
  const { user } = useAuth()
  const { definition } = usePermissions()
  const { list: commandesList } = useCommandes()
  const { list: medList, alertes } = useMedicaments()

  const commandes = commandesList.data ?? []
  const medicaments = medList.data ?? []
  const alertesStock = alertes.data ?? []

  const pending = commandes.filter((c) => c.statut === 'EN_ATTENTE')
  const prete = commandes.filter((c) => c.statut === 'PRETE')

  // Médicaments avec stock critique (≤ seuil)
  const stocksBas = medicaments.filter((m) => {
    const q = m.stock?.quantite
    const s = m.stock?.seuilMinimum
    return q !== undefined && s !== undefined && q <= s
  })

  const recentCommandes = [...commandes]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bonjour Dr. ${user?.prenom ?? ''}`}
        subtitle={definition?.description ?? 'Opérations pharmacie'}
        icon={<Pill size={20} />}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/professionnel/commandes">
              <Button variant="outline" icon={<ScanLine size={14} />}>
                Scanner un retrait
              </Button>
            </Link>
            <Link to="/professionnel/file-attente">
              <Button icon={<ListOrdered size={14} />}>File d'attente</Button>
            </Link>
          </div>
        }
      />

      {/* Alertes critiques */}
      {alertesStock.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-rose-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-body text-sm font-semibold text-rose-900">
              {alertesStock.length} médicament{alertesStock.length > 1 ? 's' : ''} en rupture ou sous seuil
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {alertesStock.slice(0, 5).map((s) => (
                <span key={s.id} className="inline-block rounded-full bg-rose-100 border border-rose-200 px-2 py-0.5 text-2xs font-mono text-rose-800">
                  {s.medicament?.nom ?? s.medicamentId} ({s.quantite} unités)
                </span>
              ))}
              {alertesStock.length > 5 && (
                <span className="text-2xs text-rose-600 font-body">+{alertesStock.length - 5} autres</span>
              )}
            </div>
          </div>
          <Link to="/professionnel/commandes">
            <Button size="sm" variant="ghost">Gérer le stock →</Button>
          </Link>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          title="En attente"
          value={commandesList.isLoading ? '…' : pending.length}
          subtitle="Commandes à valider"
          icon={<Clock size={18} />}
          color="amber"
        />
        <StatCard
          title="Prêtes à retirer"
          value={commandesList.isLoading ? '…' : prete.length}
          subtitle="Attendent le client"
          icon={<PackageCheck size={18} />}
          color="teal"
          delay={0.05}
        />
        <StatCard
          title="Médicaments"
          value={medList.isLoading ? '…' : medicaments.length}
          subtitle="Dans le catalogue"
          icon={<Pill size={18} />}
          color="cyan"
          delay={0.1}
        />
        <StatCard
          title="Stocks bas"
          value={medList.isLoading ? '…' : stocksBas.length}
          subtitle="Sous le seuil minimum"
          icon={<AlertTriangle size={18} />}
          color={stocksBas.length > 0 ? 'amber' : 'emerald'}
          delay={0.15}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
        {/* Dernières commandes */}
        <GlassCard variant="solid" className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-display text-sm font-bold text-slate-900">Commandes récentes</p>
            <Link to="/professionnel/commandes" className="font-body text-xs text-teal-600 hover:underline flex items-center gap-1">
              Voir tout <ArrowRight size={11} />
            </Link>
          </div>
          {commandesList.isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />)}
            </div>
          ) : recentCommandes.length === 0 ? (
            <p className="font-body text-sm text-slate-400 py-4 text-center">Aucune commande pour le moment.</p>
          ) : (
            <div className="space-y-2">
              {recentCommandes.map((c) => {
                const statusColors: Record<string, string> = {
                  EN_ATTENTE: 'border-amber-200 bg-amber-50 text-amber-800',
                  PRETE: 'border-teal-200 bg-teal-50 text-teal-800',
                  RETIREE: 'border-emerald-200 bg-emerald-50 text-emerald-800',
                  REFUSEE: 'border-rose-200 bg-rose-50 text-rose-800',
                }
                const statusLabels: Record<string, string> = {
                  EN_ATTENTE: 'En attente',
                  PRETE: 'Prête',
                  RETIREE: 'Retirée',
                  REFUSEE: 'Refusée',
                }
                return (
                  <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-200 text-xs font-bold flex-shrink-0">
                        <ShoppingBag size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-body text-sm font-semibold text-slate-900 truncate">
                          {c.client ? `${c.client.prenom} ${c.client.nom}` : 'Client'}
                        </p>
                        <p className="font-mono text-2xs text-slate-400">
                          {formatDate(c.createdAt)} · {c.lignes.length} produit{c.lignes.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <span className={`flex-shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-2xs font-medium ${statusColors[c.statut] ?? ''}`}>
                      {statusLabels[c.statut] ?? c.statut}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </GlassCard>

        {/* Raccourcis */}
        <div className="space-y-3">
          <GlassCard variant="solid" className="p-5 space-y-3">
            <p className="font-display text-sm font-bold text-slate-900">Accès rapides</p>
            <div className="space-y-2">
              {[
                { to: '/professionnel/commandes', label: 'Valider des commandes', icon: <CheckCircle2 size={15} /> },
                { to: '/professionnel/file-attente', label: "Ouvrir la file pharmacie", icon: <ListOrdered size={15} /> },
                { to: '/professionnel/produits', label: 'Gérer le catalogue', icon: <Pill size={15} /> },
              ].map((a) => (
                <Link key={a.to} to={a.to}>
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 hover:border-teal-300 hover:bg-teal-50/40 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2.5 text-teal-700">
                      {a.icon}
                      <span className="font-body text-sm font-semibold text-slate-900">{a.label}</span>
                    </div>
                    <ArrowRight size={13} className="text-slate-400" />
                  </div>
                </Link>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
