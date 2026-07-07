import { Link } from 'react-router-dom'
import {
  ShoppingBag, Pill, Clock, CheckCircle2, XCircle, ArrowRight,
  PackageCheck, QrCode, Plus, Sparkles,
} from 'lucide-react'
import { useAuth, usePermissions, useCommandes } from '@/adapters/react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { formatDate, getStatutCommandeColor, getStatutCommandeLabel } from '@/utils/helpers'

/**
 * Tableau de bord CLIENT.
 * Périmètre : mes commandes, catalogue, suivi du statut.
 * Interface orientée consommateur — aucun élément de gestion professionnelle.
 */
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bonjour ${user?.prenom ?? ''} 👋`}
        subtitle={definition?.description ?? 'Bienvenue dans votre espace client'}
        icon={<Sparkles size={20} />}
        actions={
          <Link to="/client/produits">
            <Button icon={<Plus size={14} />}>Nouvelle commande</Button>
          </Link>
        }
      />

      {/* Alerte : commande prête à retirer */}
      {prete > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4">
          <PackageCheck size={20} className="text-teal-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-body text-sm font-semibold text-teal-900">
              {prete} commande{prete > 1 ? 's prêtes' : ' prête'} à retirer !
            </p>
            <p className="font-body text-xs text-teal-700">
              Présentez votre QR code à la pharmacie pour récupérer votre commande.
            </p>
          </div>
          <Link to="/client/commandes">
            <Button size="sm" icon={<QrCode size={13} />}>Voir mon QR</Button>
          </Link>
        </div>
      )}

      {/* KPIs personnels */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          title="Mes commandes"
          value={list.isLoading ? '…' : total}
          subtitle="Passées au total"
          icon={<ShoppingBag size={18} />}
          color="teal"
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
          color="emerald"
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

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.6fr] gap-4">
        {/* Dernières commandes */}
        <GlassCard variant="solid" className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-display text-sm font-bold text-slate-900">Mes dernières commandes</p>
            <Link to="/client/commandes" className="font-body text-xs text-teal-600 hover:underline flex items-center gap-1">
              Tout voir <ArrowRight size={11} />
            </Link>
          </div>

          {list.isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}
            </div>
          ) : recent.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <ShoppingBag size={28} className="mx-auto text-slate-300" />
              <p className="font-body text-sm text-slate-500">Vous n'avez pas encore passé de commande.</p>
              <Link to="/client/produits">
                <Button icon={<Pill size={14} />}>Parcourir le catalogue</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-teal-50 ring-1 ring-inset ring-teal-200">
                      <ShoppingBag size={14} className="text-teal-700" />
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
              ))}
            </div>
          )}
        </GlassCard>

        {/* Raccourcis client */}
        <div className="space-y-3">
          <GlassCard variant="glass" className="p-5 bg-teal-50/80 border-teal-200/60">
            <p className="font-display text-sm font-bold text-teal-800 mb-3">Commander</p>
            <p className="font-body text-xs text-teal-700 mb-3">
              Choisissez vos médicaments dans le catalogue et passez votre commande en quelques clics.
            </p>
            <Link to="/client/produits">
              <Button className="w-full" icon={<Pill size={14} />}>
                Parcourir le catalogue
              </Button>
            </Link>
          </GlassCard>

          <GlassCard variant="solid" className="p-5 space-y-2">
            <p className="font-display text-sm font-bold text-slate-900">Mes accès</p>
            {[
              { to: '/client/commandes', label: 'Mes commandes & QR', icon: <QrCode size={14} /> },
              { to: '/client/produits', label: 'Catalogue médicaments', icon: <Pill size={14} /> },
            ].map((a) => (
              <Link key={a.to} to={a.to}>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 hover:border-teal-300 hover:bg-teal-50/40 transition-colors cursor-pointer mt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-teal-600">{a.icon}</span>
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
