import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ShoppingBag, Pill, Clock, CheckCircle2, ArrowRight,
  PackageCheck, QrCode, Plus, Sparkles, Heart,
} from 'lucide-react'
import { useAuth, usePermissions, useCommandes } from '@/adapters/react'
import { StatCard } from '@/components/ui/StatCard'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { HowItWorksStrip } from '@/components/ui/HowItWorksStrip'
import { OrderStatusStepper } from '@/components/ui/OrderStatusStepper'
import { formatDate, getStatutCommandeColor, getStatutCommandeLabel } from '@/utils/helpers'

export const DashboardClient = () => {
  const { user } = useAuth()
  const { definition } = usePermissions()
  const { list } = useCommandes()

  const commandes = list.data ?? []
  const pending = commandes.filter((c) => c.statut === 'EN_ATTENTE').length
  const prete = commandes.filter((c) => c.statut === 'PRETE').length
  const total = commandes.length

  const recent = [...commandes]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4)

  const hasOrders = total > 0

  return (
    <div className="space-y-6">
      {/* Bandeau d'accueil */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-600 via-teal-600 to-teal-700 p-6 lg:p-8 text-white shadow-card"
      >
        <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-28 w-28 rounded-full bg-emerald-300/20 blur-xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 font-medical text-2xs font-semibold uppercase tracking-wider">
              <Heart size={11} />
              Espace client
            </span>
            <h1 className="mt-3 font-display text-2xl lg:text-3xl font-bold tracking-tight">
              Bonjour {user?.prenom ?? ''} 👋
            </h1>
            <p className="mt-2 font-body text-sm text-white/85 max-w-lg leading-relaxed">
              {definition?.description ?? 'Commandez vos médicaments en ligne et suivez chaque étape jusqu\'au retrait en pharmacie.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <Link to="/client/produits">
              <Button
                className="bg-white text-emerald-800 hover:bg-emerald-50 border-0 shadow-soft"
                icon={<Plus size={14} />}
              >
                Nouvelle commande
              </Button>
            </Link>
            {prete > 0 && (
              <Link to="/client/commandes">
                <Button
                  variant="outline"
                  className="border-white/40 text-white hover:bg-white/10"
                  icon={<QrCode size={14} />}
                >
                  Mon QR de retrait
                </Button>
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      {/* Alerte : commande prête à retirer */}
      {prete > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-emerald-300/70 bg-emerald-50 p-5 shadow-soft"
        >
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 ring-1 ring-inset ring-emerald-200">
            <PackageCheck size={22} className="text-emerald-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-base font-bold text-emerald-900">
              {prete} commande{prete > 1 ? 's prêtes' : ' prête'} à retirer
            </p>
            <p className="font-body text-sm text-emerald-700 mt-0.5">
              Rendez-vous en pharmacie avec votre code QR pour récupérer vos médicaments.
            </p>
          </div>
          <Link to="/client/commandes" className="flex-shrink-0">
            <Button icon={<QrCode size={14} />}>Voir mes codes</Button>
          </Link>
        </motion.div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          title="Mes commandes"
          value={list.isLoading ? '…' : total}
          subtitle="Passées au total"
          icon={<ShoppingBag size={18} />}
          color="emerald"
        />
        <StatCard
          title="En attente"
          value={list.isLoading ? '…' : pending}
          subtitle="Validation en cours"
          icon={<Clock size={18} />}
          color="amber"
          delay={0.05}
        />
        <StatCard
          title="Prêtes"
          value={list.isLoading ? '…' : prete}
          subtitle="Prêtes à récupérer"
          icon={<CheckCircle2 size={18} />}
          color="teal"
          delay={0.1}
        />
        <StatCard
          title="Retirées"
          value={list.isLoading ? '…' : commandes.filter((c) => c.statut === 'RETIREE').length}
          subtitle="Commandes récupérées"
          icon={<PackageCheck size={18} />}
          color="cyan"
          delay={0.15}
        />
      </div>

      {!hasOrders && !list.isLoading && (
        <GlassCard variant="solid" className="p-6 space-y-5">
          <div className="text-center max-w-md mx-auto">
            <Sparkles size={28} className="mx-auto text-emerald-400" />
            <p className="mt-3 font-display text-lg font-bold text-slate-900">Première commande ?</p>
            <p className="mt-1 font-body text-sm text-slate-500">
              Voici comment fonctionne PharmaDigital en 3 étapes simples.
            </p>
          </div>
          <HowItWorksStrip variant="client" />
          <div className="flex justify-center pt-2">
            <Link to="/client/produits">
              <Button size="lg" icon={<Pill size={15} />}>Découvrir le catalogue</Button>
            </Link>
          </div>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.6fr] gap-4">
        {/* Dernières commandes */}
        <GlassCard variant="solid" className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-display text-sm font-bold text-slate-900">Mes dernières commandes</p>
            <Link to="/client/commandes" className="font-body text-xs text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1">
              Tout voir <ArrowRight size={11} />
            </Link>
          </div>

          {list.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />)}
            </div>
          ) : recent.length === 0 ? (
            <div className="py-6 text-center space-y-3">
              <ShoppingBag size={28} className="mx-auto text-slate-300" />
              <p className="font-body text-sm text-slate-500">Aucune commande pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map((c) => (
                <Link key={c.id} to="/client/commandes" className="block group">
                  <div className="rounded-xl border border-slate-100 bg-white p-4 transition-all group-hover:border-emerald-200 group-hover:shadow-soft">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 ring-1 ring-inset ring-emerald-200">
                          <ShoppingBag size={14} className="text-emerald-700" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-body text-sm font-semibold text-slate-900 truncate">
                            {c.lignes.length} médicament{c.lignes.length > 1 ? 's' : ''}
                            {c.montantTotal ? ` · ${Number(c.montantTotal).toLocaleString('fr-FR')} CDF` : ''}
                          </p>
                          <p className="font-mono text-2xs text-slate-400">{formatDate(c.createdAt)}</p>
                        </div>
                      </div>
                      <span className={`flex-shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-2xs font-medium ${getStatutCommandeColor(c.statut)}`}>
                        {getStatutCommandeLabel(c.statut)}
                      </span>
                    </div>
                    <OrderStatusStepper statut={c.statut} compact accent="emerald" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Raccourcis */}
        <div className="space-y-3">
          <GlassCard variant="glass" className="p-5 bg-gradient-to-br from-emerald-50/90 to-teal-50/60 border-emerald-200/60">
            <p className="font-display text-sm font-bold text-emerald-900 mb-2">Commander</p>
            <p className="font-body text-xs text-emerald-800/80 mb-4 leading-relaxed">
              Parcourez le catalogue, ajoutez vos médicaments et validez en un clic.
            </p>
            <Link to="/client/produits">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700" icon={<Pill size={14} />}>
                Parcourir le catalogue
              </Button>
            </Link>
          </GlassCard>

          <GlassCard variant="solid" className="p-5 space-y-2">
            <p className="font-display text-sm font-bold text-slate-900 mb-1">Accès rapides</p>
            {[
              { to: '/client/commandes', label: 'Mes commandes & QR', icon: <QrCode size={14} />, hint: prete > 0 ? `${prete} prête(s)` : undefined },
              { to: '/client/produits', label: 'Catalogue médicaments', icon: <Pill size={14} /> },
            ].map((a) => (
              <Link key={a.to} to={a.to}>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all cursor-pointer mt-1.5 group">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-emerald-600">{a.icon}</span>
                    <div className="min-w-0">
                      <span className="font-body text-sm font-medium text-slate-900 block truncate">{a.label}</span>
                      {a.hint && (
                        <span className="font-body text-2xs text-emerald-600">{a.hint}</span>
                      )}
                    </div>
                  </div>
                  <ArrowRight size={12} className="text-slate-400 group-hover:text-emerald-600 transition-colors flex-shrink-0" />
                </div>
              </Link>
            ))}
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
