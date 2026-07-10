import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Pill, ShoppingBag, Clock, CheckCircle2, AlertTriangle,
  ListOrdered, ArrowRight, PackageCheck, ScanLine, Zap,
} from 'lucide-react'
import { useAuth, usePermissions, useCommandes, useMedicaments } from '@/adapters/react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { formatDate, getStatutCommandeColor, getStatutCommandeLabel } from '@/utils/helpers'

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
        subtitle={definition?.description ?? 'Opérations pharmacie — commandes, stock et file d\'attente'}
        icon={<Pill size={20} />}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/professionnel/commandes">
              <Button variant="outline" icon={<ScanLine size={14} />}>
                Scanner un retrait
              </Button>
            </Link>
            <Link to="/professionnel/file-attente">
              <Button icon={<ListOrdered size={14} />}>
                File d'attente
                {pending.length > 0 && (
                  <span className="ml-1 rounded-full bg-white/25 px-1.5 py-0.5 text-2xs font-mono">
                    {pending.length}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        }
      />

      {/* Bandeau priorités du jour */}
      {(pending.length > 0 || prete.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pending.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/50 p-5"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 ring-1 ring-inset ring-amber-200">
                  <Zap size={18} className="text-amber-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm font-bold text-amber-900">
                    {pending.length} commande{pending.length > 1 ? 's' : ''} à valider
                  </p>
                  <p className="font-body text-xs text-amber-800/80 mt-0.5">
                    Action requise — vérifiez le stock et validez ou refusez.
                  </p>
                  <Link to="/professionnel/commandes" className="inline-block mt-3">
                    <Button size="sm" icon={<CheckCircle2 size={13} />}>Traiter maintenant</Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
          {prete.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-2xl border border-teal-200/80 bg-gradient-to-br from-teal-50 to-cyan-50/40 p-5"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-teal-100 ring-1 ring-inset ring-teal-200">
                  <PackageCheck size={18} className="text-teal-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm font-bold text-teal-900">
                    {prete.length} retrait{prete.length > 1 ? 's' : ''} en attente
                  </p>
                  <p className="font-body text-xs text-teal-800/80 mt-0.5">
                    Clients prêts à récupérer — scannez leur QR à l'accueil.
                  </p>
                  <Link to="/professionnel/commandes" className="inline-block mt-3">
                    <Button size="sm" variant="outline" icon={<ScanLine size={13} />}>Confirmer un retrait</Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Alertes stock */}
      {alertesStock.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-5 flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-rose-100 ring-1 ring-inset ring-rose-200">
            <AlertTriangle size={18} className="text-rose-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-sm font-bold text-rose-900">
              {alertesStock.length} médicament{alertesStock.length > 1 ? 's' : ''} en rupture ou sous seuil
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {alertesStock.slice(0, 6).map((s) => (
                <span key={s.id} className="inline-block rounded-full bg-white border border-rose-200 px-2.5 py-0.5 text-2xs font-body text-rose-800">
                  {s.medicament?.nom ?? s.medicamentId}
                  <span className="font-mono ml-1 text-rose-600">({s.quantite})</span>
                </span>
              ))}
              {alertesStock.length > 6 && (
                <span className="text-2xs text-rose-600 font-body self-center">+{alertesStock.length - 6} autres</span>
              )}
            </div>
          </div>
          <Link to="/professionnel/produits" className="flex-shrink-0">
            <Button size="sm" variant="outline">Gérer le stock →</Button>
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
          color={stocksBas.length > 0 ? 'rose' : 'emerald'}
          delay={0.15}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
        {/* File de travail — commandes en attente */}
        {pending.length > 0 && (
          <GlassCard variant="solid" className="p-5 space-y-3 lg:col-span-2 border-amber-200/50 bg-amber-50/20">
            <div className="flex items-center justify-between">
              <p className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock size={15} className="text-amber-600" />
                Priorité — commandes en attente
              </p>
              <Link to="/professionnel/commandes" className="font-body text-xs text-teal-600 hover:underline flex items-center gap-1">
                Voir tout <ArrowRight size={11} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
              {pending.slice(0, 3).map((c) => (
                <div key={c.id} className="rounded-xl border border-amber-200/70 bg-white p-3">
                  <p className="font-body text-sm font-semibold text-slate-900 truncate">
                    {c.client ? `${c.client.prenom} ${c.client.nom}` : 'Client'}
                  </p>
                  <p className="font-mono text-2xs text-slate-500 mt-0.5">
                    {c.lignes.length} produit{c.lignes.length > 1 ? 's' : ''} · {formatDate(c.createdAt)}
                  </p>
                  <Link to="/professionnel/commandes" className="inline-block mt-2">
                    <Button size="sm" variant="outline">Valider →</Button>
                  </Link>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

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
              {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}
            </div>
          ) : recentCommandes.length === 0 ? (
            <div className="py-8 text-center">
              <ShoppingBag size={28} className="mx-auto text-slate-300" />
              <p className="mt-2 font-body text-sm text-slate-500">Aucune commande pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentCommandes.map((c) => (
                <Link key={c.id} to="/professionnel/commandes" className="block group">
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3 transition-all group-hover:border-teal-200 group-hover:shadow-soft">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-200 flex-shrink-0">
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
                    <span className={`flex-shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-2xs font-medium ${getStatutCommandeColor(c.statut)}`}>
                      {getStatutCommandeLabel(c.statut)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Raccourcis */}
        <div className="space-y-3">
          <GlassCard variant="solid" className="p-5 space-y-2">
            <p className="font-display text-sm font-bold text-slate-900 mb-1">Accès rapides</p>
            {[
              { to: '/professionnel/commandes', label: 'Valider des commandes', icon: <CheckCircle2 size={15} />, badge: pending.length || undefined },
              { to: '/professionnel/file-attente', label: 'File pharmacie', icon: <ListOrdered size={15} /> },
              { to: '/professionnel/produits', label: 'Gérer le catalogue', icon: <Pill size={15} />, badge: stocksBas.length || undefined },
            ].map((a) => (
              <Link key={a.to} to={a.to}>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 hover:border-teal-300 hover:bg-teal-50/40 transition-all cursor-pointer mt-1.5 group">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-teal-600">{a.icon}</span>
                    <span className="font-body text-sm font-semibold text-slate-900 truncate">{a.label}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {a.badge ? (
                      <span className="rounded-full bg-rose-500 text-white text-2xs font-mono font-bold px-1.5 py-0.5 min-w-[18px] text-center">
                        {a.badge}
                      </span>
                    ) : null}
                    <ArrowRight size={13} className="text-slate-400 group-hover:text-teal-600 transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
