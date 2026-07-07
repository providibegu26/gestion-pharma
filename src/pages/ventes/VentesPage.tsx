import { useState, useMemo } from 'react'
import {
  ReceiptText, TrendingUp, Banknote, ShoppingCart,
  CheckCircle2, RefreshCw, ChevronDown, ChevronUp,
  Download, Ban, Loader2, AlertTriangle, WifiOff,
} from 'lucide-react'
import { useVentes } from '@/adapters/react'
import type { VenteDetail } from '@/core'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { GlassCard } from '@/components/ui/GlassCard'
import { StatCard } from '@/components/ui/StatCard'
import { SearchBox } from '@/components/ui/SearchBox'
import { toast } from '@/components/ui/Toast'
import { formatDate } from '@/utils/helpers'

type FiltrePeriode = 'today' | 'week' | 'month' | 'all'
type FiltreStatut = 'ALL' | 'FINALISEE' | 'EN_COURS' | 'ANNULEE'

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

const formatMontant = (montant: string, devise: string) => {
  const n = parseFloat(montant)
  if (isNaN(n)) return '—'
  return devise === 'USD'
    ? `$${n.toFixed(2)}`
    : `${n.toLocaleString('fr-FR')} CDF`
}

const isInPeriod = (dateStr: string, periode: FiltrePeriode): boolean => {
  const date = new Date(dateStr)
  const now = new Date()
  if (periode === 'today') return date.toDateString() === now.toDateString()
  if (periode === 'week') {
    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7)
    return date >= weekAgo
  }
  if (periode === 'month') {
    const monthAgo = new Date(now); monthAgo.setMonth(monthAgo.getMonth() - 1)
    return date >= monthAgo
  }
  return true
}

const SIMULATED_VENTES: VenteDetail[] = [
  {
    id: 'sim-1', userId: 'u1', patientId: null, ordonnanceId: null,
    montantTotal: '15000', devise: 'CDF', statut: 'FINALISEE',
    qrCode: null, ticketUrl: null,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    lignes: [{ id: 'l1', venteId: 'sim-1', medicamentId: 'm1', quantite: 3, prixUnitaire: '5000', devise: 'CDF', medicament: { id: 'm1', nom: 'Paracétamol 500mg', categorie: 'Analgésiques', unite: 'comprimé', prixCDF: '5000', prixUSD: '2' } }],
    user: { id: 'u1', prenom: 'Jean', nom: 'Dupont' },
  },
  {
    id: 'sim-2', userId: 'u2', patientId: null, ordonnanceId: null,
    montantTotal: '8.5', devise: 'USD', statut: 'FINALISEE',
    qrCode: null, ticketUrl: null,
    createdAt: new Date(Date.now() - 3600_000).toISOString(), updatedAt: new Date().toISOString(),
    lignes: [{ id: 'l2', venteId: 'sim-2', medicamentId: 'm2', quantite: 1, prixUnitaire: '8.5', devise: 'USD', medicament: { id: 'm2', nom: 'Amoxicilline 500mg', categorie: 'Antibiotiques', unite: 'boîte', prixCDF: '20000', prixUSD: '8.5' } }],
    user: { id: 'u2', prenom: 'Marie', nom: 'Kalinda' },
  },
  {
    id: 'sim-3', userId: 'u1', patientId: null, ordonnanceId: null,
    montantTotal: '30000', devise: 'CDF', statut: 'ANNULEE',
    qrCode: null, ticketUrl: null,
    createdAt: new Date(Date.now() - 86400_000).toISOString(), updatedAt: new Date().toISOString(),
    lignes: [{ id: 'l3', venteId: 'sim-3', medicamentId: 'm3', quantite: 2, prixUnitaire: '15000', devise: 'CDF', medicament: { id: 'm3', nom: 'Metformine 850mg', categorie: 'Antidiabétiques', unite: 'boîte', prixCDF: '15000', prixUSD: '6' } }],
    user: { id: 'u1', prenom: 'Jean', nom: 'Dupont' },
  },
]

/**
 * Page Ventes & Chiffre d'Affaires — CAISSIER uniquement.
 * Affiche toutes les ventes, les statistiques économiques par période et devise,
 * ainsi que le détail par transaction (médicaments, montant, statut).
 */
export const VentesPage = () => {
  const { list } = useVentes()

  const [query, setQuery] = useState('')
  const [periode, setPeriode] = useState<FiltrePeriode>('today')
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>('ALL')
  const [expanded, setExpanded] = useState<string | null>(null)

  const isSimulation = list.isError
  const rawVentes: VenteDetail[] = list.data ?? (isSimulation ? SIMULATED_VENTES : [])

  // Filtres combinés
  const ventesFiltered = useMemo(() => {
    return rawVentes.filter((v) => {
      const matchPeriode = isInPeriod(v.createdAt, periode)
      const matchStatut = filtreStatut === 'ALL' || v.statut === filtreStatut
      const searchStr = [
        v.patient?.nom, v.patient?.prenom,
        v.user?.nom, v.user?.prenom,
        v.id,
        ...v.lignes.map((l) => l.medicament?.nom ?? ''),
      ].join(' ').toLowerCase()
      const matchQuery = !query.trim() || searchStr.includes(query.toLowerCase())
      return matchPeriode && matchStatut && matchQuery
    })
  }, [rawVentes, periode, filtreStatut, query])

  const finalisees = ventesFiltered.filter((v) => v.statut === 'FINALISEE')
  const caCDF = finalisees.filter((v) => v.devise === 'CDF').reduce((s, v) => s + parseFloat(v.montantTotal || '0'), 0)
  const caUSD = finalisees.filter((v) => v.devise === 'USD').reduce((s, v) => s + parseFloat(v.montantTotal || '0'), 0)

  const PERIODES: { key: FiltrePeriode; label: string }[] = [
    { key: 'today', label: "Aujourd'hui" },
    { key: 'week', label: '7 derniers jours' },
    { key: 'month', label: '30 derniers jours' },
    { key: 'all', label: 'Tout' },
  ]

  const STATUTS: { key: FiltreStatut; label: string }[] = [
    { key: 'ALL', label: 'Tous' },
    { key: 'FINALISEE', label: 'Finalisées' },
    { key: 'EN_COURS', label: 'En cours' },
    { key: 'ANNULEE', label: 'Annulées' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ventes & Chiffre d'Affaires"
        subtitle="Suivi des transactions et de l'activité économique"
        icon={<ReceiptText size={20} />}
        actions={
          <Button
            variant="outline"
            icon={<RefreshCw size={14} className={list.isFetching ? 'animate-spin' : ''} />}
            onClick={() => list.refetch()}
          >
            Rafraîchir
          </Button>
        }
      />

      {/* Bannière simulation */}
      {isSimulation && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200/70 bg-amber-50/60 px-4 py-2.5">
          <WifiOff size={15} className="text-amber-600" />
          <p className="font-body text-xs text-amber-800">
            Mode démonstration — les données affichées sont simulées.
            <span className="font-mono"> /ventes</span> momentanément indisponible.
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          title="CA (CDF)"
          value={`${caCDF.toLocaleString('fr-FR')}`}
          subtitle="Franc congolais"
          icon={<Banknote size={18} />}
          color="sand"
        />
        <StatCard
          title="CA (USD)"
          value={`$${caUSD.toFixed(2)}`}
          subtitle="Dollar américain"
          icon={<TrendingUp size={18} />}
          color="teal"
          delay={0.05}
        />
        <StatCard
          title="Transactions"
          value={finalisees.length}
          subtitle="Ventes finalisées"
          icon={<ShoppingCart size={18} />}
          color="cyan"
          delay={0.1}
        />
        <StatCard
          title="Annulées"
          value={ventesFiltered.filter((v) => v.statut === 'ANNULEE').length}
          subtitle="Sur la période"
          icon={<Ban size={18} />}
          color="rose"
          delay={0.15}
        />
      </div>

      {/* Filtres */}
      <GlassCard variant="solid" className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchBox
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher client, médicament…"
          />
          {/* Période */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
            {PERIODES.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriode(p.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  periode === p.key
                    ? 'bg-white text-teal-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {/* Statut */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
            {STATUTS.map((s) => (
              <button
                key={s.key}
                onClick={() => setFiltreStatut(s.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  filtreStatut === s.key
                    ? 'bg-white text-teal-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Liste des ventes */}
      <GlassCard variant="solid" className="p-5 space-y-2">
        <div className="flex items-center justify-between mb-3">
          <p className="font-display text-sm font-bold text-slate-900">
            {ventesFiltered.length} vente{ventesFiltered.length !== 1 ? 's' : ''}
          </p>
        </div>

        {list.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={22} className="animate-spin text-slate-400" />
          </div>
        ) : ventesFiltered.length === 0 ? (
          <div className="py-10 text-center">
            <AlertTriangle size={24} className="mx-auto text-slate-300 mb-2" />
            <p className="font-body text-sm text-slate-400">Aucune vente sur cette période.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ventesFiltered.map((v) => (
              <div key={v.id} className="rounded-xl border border-slate-200/70 bg-white overflow-hidden">
                {/* En-tête de la ligne */}
                <button
                  className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-slate-50/60 transition-colors"
                  onClick={() => setExpanded(expanded === v.id ? null : v.id)}
                >
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
                        {formatDate(v.createdAt)} · {v.lignes.length} article{v.lignes.length !== 1 ? 's' : ''}
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
                    {expanded === v.id
                      ? <ChevronUp size={14} className="text-slate-400" />
                      : <ChevronDown size={14} className="text-slate-400" />}
                  </div>
                </button>

                {/* Détails expandés */}
                {expanded === v.id && (
                  <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-3">
                    <div className="space-y-1.5">
                      {v.lignes.map((l) => (
                        <div key={l.id} className="flex items-center justify-between gap-2 text-sm">
                          <span className="font-body text-slate-800 truncate">
                            {l.medicament?.nom ?? l.medicamentId}
                            <span className="text-slate-400 font-mono ml-1">({l.medicament?.categorie ?? ''})</span>
                          </span>
                          <span className="font-mono text-slate-600 text-xs flex-shrink-0">
                            ×{l.quantite} — {formatMontant(
                              String(parseFloat(l.prixUnitaire) * l.quantite),
                              l.devise,
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                    {v.ticketUrl && (
                      <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                        <a href={v.ticketUrl} target="_blank" rel="noreferrer">
                          <Button variant="outline" size="sm" icon={<Download size={13} />}>
                            Ticket PDF
                          </Button>
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </GlassCard>

    </div>
  )
}
