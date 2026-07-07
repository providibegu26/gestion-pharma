import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ShoppingBag, Check, X, Eye, Filter, Clock, CheckCircle2, XCircle, PackageCheck,
  User as UserIcon, Pill, Mail, RefreshCw, ArrowLeft, ScanLine, Ban, Coins,
  BookOpen, Plus, PackagePlus, Trash2, AlertTriangle,
} from 'lucide-react'
import { useAuth, useApiError, useCommandes, usePermissions, useMedicaments } from '@/adapters/react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { QrCode } from '@/components/ui/QrCode'
import { SearchBox } from '@/components/ui/SearchBox'
import { Pagination } from '@/components/ui/Pagination'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toast } from '@/components/ui/Toast'
import {
  formatDate, getStatutCommandeColor, getStatutCommandeLabel, getInitials,
} from '@/utils/helpers'
import type {
  Commande, CommandeCodeInfo, CreateMedicamentPayload, Medicament, StatutCommande,
} from '@/core'

const PAGE_SIZE = 8

/** Montant total : privilégie `montantTotal` (backend), sinon calcul depuis les lignes. */
const montantCommande = (c: Commande): number => {
  if (c.montantTotal != null && c.montantTotal !== '') return Number(c.montantTotal)
  return c.lignes.reduce((sum, l) => sum + Number(l.medicament?.prixCDF ?? 0) * l.quantite, 0)
}

const formatCDF = (n: number) => `${n.toLocaleString('fr-FR')} CDF`

export const CommandesPage = () => {
  const qc = useQueryClient()
  const { isClient } = useAuth()
  const { can } = usePermissions()
  const { getErrorMessage } = useApiError()
  const { list, valider, refuser, annuler, consulterCode, retirerCode } = useCommandes()

  const [filter, setFilter] = useState<'ALL' | StatutCommande>('ALL')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Commande | null>(null)
  const [refusReason, setRefusReason] = useState('')

  // Scan de retrait (pharmacien) — saisie/lecture d'un code QR commande.
  const [scanOpen, setScanOpen] = useState(false)
  const [scanCode, setScanCode] = useState('')
  const [scanInfo, setScanInfo] = useState<CommandeCodeInfo | null>(null)

  const canValidateCommande = can('commandes.validate') // pharmacien
  const canPickup = can('commandes.pickup') // pharmacien (scan + retrait)
  const canManageProduits = can('produits.manage') // pharmacien — CRUD catalogue
  const isClientUser = isClient()

  // ─── Catalogue médicaments (pharmacien) ─────────────────────────────────────
  const {
    list: medList, alertes, create: createMed, remove: removeMed, updateStock,
  } = useMedicaments()
  const medicaments = medList.data ?? []

  const [catalogOpen, setCatalogOpen] = useState(false)
  const [newMedOpen, setNewMedOpen] = useState(false)
  const [restockMed, setRestockMed] = useState<Medicament | null>(null)
  const [deleteMed, setDeleteMed] = useState<Medicament | null>(null)
  const [restockQty, setRestockQty] = useState('')
  const [restockSeuil, setRestockSeuil] = useState('')

  const [newMedForm, setNewMedForm] = useState<CreateMedicamentPayload>({
    nom: '', description: '', prixCDF: 0, prixUSD: 0,
    categorie: '', unite: 'comprimé', quantiteInitiale: 100, seuilMinimum: 20,
  })

  const handleCreateMed = () => {
    if (!newMedForm.nom.trim() || !newMedForm.categorie.trim()) {
      toast.error('Nom et catégorie sont requis.')
      return
    }
    createMed.mutate(newMedForm, {
      onSuccess: () => { toast.success('Médicament ajouté au catalogue.'); setNewMedOpen(false) },
      onError: (e) => toast.error(getErrorMessage(e)),
    })
  }

  const handleRestock = () => {
    if (!restockMed) return
    const qty = parseInt(restockQty, 10)
    if (isNaN(qty) || qty <= 0) { toast.error('Quantité invalide.'); return }
    const payload = { quantite: qty, ...(restockSeuil ? { seuilMinimum: parseInt(restockSeuil, 10) } : {}) }
    updateStock.mutate({ medicamentId: restockMed.id, payload }, {
      onSuccess: () => {
        toast.success(`Stock mis à jour pour ${restockMed.nom}.`)
        setRestockMed(null); setRestockQty(''); setRestockSeuil('')
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    })
  }

  const handleDeleteMed = () => {
    if (!deleteMed) return
    removeMed.mutate(deleteMed.id, {
      onSuccess: () => { toast.success(`${deleteMed.nom} supprimé du catalogue.`); setDeleteMed(null) },
      onError: (e) => toast.error(getErrorMessage(e)),
    })
  }

  const alertesCount = alertes.data?.length ?? 0

  const commandes = list.data ?? []
  const isLoading = list.isLoading

  const stats = {
    all: commandes.length,
    pending: commandes.filter(c => c.statut === 'EN_ATTENTE').length,
    prete: commandes.filter(c => c.statut === 'PRETE').length,
    retiree: commandes.filter(c => c.statut === 'RETIREE').length,
    refused: commandes.filter(c => c.statut === 'REFUSEE').length,
  }

  // Filtre par statut + recherche (nom/email client, référence, code retrait).
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return commandes.filter((c) => {
      if (filter !== 'ALL' && c.statut !== filter) return false
      if (!q) return true
      const ref = c.id.slice(-6).toLowerCase()
      const code = (c.codeRetrait ?? '').toLowerCase()
      const nom = `${c.client?.prenom ?? ''} ${c.client?.nom ?? ''}`.toLowerCase()
      const email = (c.client?.email ?? '').toLowerCase()
      return ref.includes(q) || code.includes(q) || nom.includes(q) || email.includes(q)
    })
  }, [commandes, filter, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  )

  const changeFilter = (f: 'ALL' | StatutCommande) => { setFilter(f); setPage(1) }
  const changeQuery = (v: string) => { setQuery(v); setPage(1) }
  const refresh = () => qc.invalidateQueries({ queryKey: ['commandes'] })

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleValider = (c: Commande) =>
    valider.mutate(c.id, {
      onSuccess: (data) => {
        if (data.statut === 'REFUSEE') {
          // Refus automatique (stock insuffisant) — motif renvoyé par le backend.
          toast.error(data.motifRefus || 'Refusée : stock insuffisant')
        } else {
          toast.success('Commande validée — prête pour le retrait')
        }
        setSelected(null)
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    })

  const handleRefuser = (c: Commande) => {
    const motif = refusReason.trim()
    if (motif.length < 5) {
      toast.error('Le motif doit contenir au moins 5 caractères')
      return
    }
    refuser.mutate({ id: c.id, data: { motifRefus: motif } }, {
      onSuccess: () => { toast.success('Commande refusée'); setSelected(null) },
      onError: (e) => toast.error(getErrorMessage(e)),
    })
  }

  const handleAnnuler = (c: Commande) =>
    annuler.mutate(c.id, {
      onSuccess: () => { toast.success('Commande annulée'); setSelected(null) },
      onError: (e) => toast.error(getErrorMessage(e)),
    })

  const handleRetrait = (c: Commande) => {
    const code = c.codeRetrait || c.payloadQr
    if (!code) { toast.error('Aucun code de retrait disponible pour cette commande'); return }
    retirerCode.mutate({ code }, {
      onSuccess: () => { toast.success('Retrait confirmé — commande remise au client'); setSelected(null) },
      onError: (e) => toast.error(getErrorMessage(e)),
    })
  }

  const openScan = () => { setScanOpen(true); setScanCode(''); setScanInfo(null); consulterCode.reset() }

  const handleConsulterScan = () => {
    const code = scanCode.trim()
    if (!code) return
    consulterCode.mutate({ code }, {
      onSuccess: (info) => setScanInfo(info),
      onError: (e) => { setScanInfo(null); toast.error(getErrorMessage(e)) },
    })
  }

  const handleConfirmScan = () => {
    const code = scanCode.trim()
    if (!code) return
    retirerCode.mutate({ code }, {
      onSuccess: () => {
        toast.success('Retrait confirmé — tous les produits validés')
        setScanOpen(false); setScanCode(''); setScanInfo(null)
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    })
  }

  const filterTabs = [
    { key: 'ALL',        label: 'Toutes',     count: stats.all,     icon: Filter },
    { key: 'EN_ATTENTE', label: 'En attente', count: stats.pending, icon: Clock },
    { key: 'PRETE',      label: 'Prêtes',     count: stats.prete,   icon: CheckCircle2 },
    { key: 'RETIREE',    label: 'Retirées',   count: stats.retiree, icon: PackageCheck },
    { key: 'REFUSEE',    label: 'Refusées',   count: stats.refused, icon: XCircle },
  ] as const

  return (
    <div className="space-y-6">
      <PageHeader
        title={isClientUser ? 'Mes commandes' : 'Commandes clients'}
        subtitle={isClientUser
          ? 'Suivi de vos commandes et code de retrait en pharmacie'
          : 'Validation, suivi et retrait des commandes en ligne'}
        icon={<ShoppingBag size={20} />}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {canManageProduits && (
              <Button
                variant="outline"
                icon={<BookOpen size={14} />}
                onClick={() => setCatalogOpen(true)}
              >
                Catalogue
                {alertesCount > 0 && (
                  <span className="ml-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-2xs font-mono text-white">
                    {alertesCount}
                  </span>
                )}
              </Button>
            )}
            {canPickup && (
              <Button variant="outline" icon={<ScanLine size={14} />} onClick={openScan}>
                Scanner un retrait
              </Button>
            )}
            <Button
              variant="outline"
              icon={<RefreshCw size={14} className={list.isFetching ? 'animate-spin' : ''} />}
              onClick={refresh}
              disabled={list.isFetching}
            >
              Rafraîchir
            </Button>
          </div>
        }
      />

      {/* Filtres + recherche */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap gap-2">
          {filterTabs.map((tab) => {
            const Icon = tab.icon
            const active = filter === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => changeFilter(tab.key)}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-body font-medium transition-all ${
                  active
                    ? 'bg-slate-900 text-white shadow-soft'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700'
                }`}
              >
                <Icon size={13} />
                {tab.label}
                <span className={`rounded-full px-1.5 py-0.5 text-2xs font-mono ${active ? 'bg-white/15' : 'bg-slate-100 text-slate-600'}`}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
        <SearchBox
          value={query}
          onChange={(e) => changeQuery(e.target.value)}
          placeholder="Rechercher (client, email, code, réf.)…"
        />
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-2xl bg-slate-100/70 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-12 text-center shadow-soft">
          <ShoppingBag size={28} className="mx-auto text-slate-300" />
          <p className="mt-3 font-display text-base font-bold text-slate-900">Aucune commande</p>
          <p className="mt-1 font-body text-sm text-slate-500">Aucune commande ne correspond à ce filtre.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paged.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.2) }}
              className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card hover:shadow-card-hover hover:border-teal-200 transition-all"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-inset ring-emerald-200 text-emerald-700">
                    {c.client ? (
                      <span className="font-mono text-xs font-bold">{getInitials(c.client.nom, c.client.prenom)}</span>
                    ) : <UserIcon size={16} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-display text-sm font-bold text-slate-900">
                        {c.client ? `${c.client.prenom} ${c.client.nom}` : 'Client inconnu'}
                      </p>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-medical font-semibold ${getStatutCommandeColor(c.statut)}`}>
                        {getStatutCommandeLabel(c.statut)}
                      </span>
                      {c.statut === 'REFUSEE' && c.refuseAutomatique && (
                        <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-2xs font-medical font-semibold text-rose-700">
                          Refus automatique
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {c.client?.email && (
                        <span className="font-body text-2xs text-slate-500 inline-flex items-center gap-1">
                          <Mail size={10} /> {c.client.email}
                        </span>
                      )}
                      <span className="font-mono text-2xs text-slate-500">
                        {c.codeRetrait ? c.codeRetrait : `#${c.id.slice(-6).toUpperCase()}`} · {c.lignes.length} produit{c.lignes.length > 1 ? 's' : ''} · {formatDate(c.createdAt)}
                      </span>
                      <span className="font-mono text-2xs font-semibold text-teal-700 inline-flex items-center gap-1">
                        <Coins size={10} /> {formatCDF(montantCommande(c))}
                      </span>
                    </div>
                    {c.note && (
                      <p className="font-body text-xs text-slate-600 mt-2 italic line-clamp-1">« {c.note} »</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" icon={<Eye size={13} />} onClick={() => { setSelected(c); setRefusReason('') }}>
                    Détails
                  </Button>

                  {/* Client — annuler tant que EN_ATTENTE */}
                  {isClientUser && c.statut === 'EN_ATTENTE' && (
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => handleAnnuler(c)}
                      loading={annuler.isPending && annuler.variables === c.id}
                    >
                      <Ban size={13} className="text-rose-600" /> Annuler
                    </Button>
                  )}

                  {/* Pharmacien — valider / refuser une commande EN_ATTENTE */}
                  {c.statut === 'EN_ATTENTE' && canValidateCommande && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => { setSelected(c); setRefusReason('') }}>
                        <X size={13} className="text-rose-600" /> Refuser
                      </Button>
                      <Button size="sm" onClick={() => handleValider(c)} loading={valider.isPending && valider.variables === c.id}>
                        <Check size={13} /> Valider
                      </Button>
                    </>
                  )}

                  {/* Pharmacien — confirmer le retrait d'une commande PRETE */}
                  {c.statut === 'PRETE' && canPickup && (
                    <Button
                      size="sm"
                      onClick={() => handleRetrait(c)}
                      loading={retirerCode.isPending}
                    >
                      <PackageCheck size={13} /> Confirmer retrait
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {c.lignes.slice(0, 4).map(l => (
                  <span key={l.id} className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-2xs font-body text-slate-700 ring-1 ring-inset ring-slate-200">
                    <Pill size={9} className="text-teal-600" />
                    {l.medicament?.nom ?? '—'} × {l.quantite}
                  </span>
                ))}
                {c.lignes.length > 4 && (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-2xs font-body text-slate-500">
                    +{c.lignes.length - 4}
                  </span>
                )}
              </div>
            </motion.div>
          ))}

          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filtered.length}
            itemLabel="commande"
          />
        </div>
      )}

      {/* Modal détail */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? (selected.codeRetrait || `Commande #${selected.id.slice(-6).toUpperCase()}`) : ''}
        size="lg"
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3">
                <p className="font-medical text-2xs text-slate-500 uppercase tracking-widest">Client</p>
                <p className="mt-1 font-body text-sm font-semibold text-slate-900">
                  {selected.client ? `${selected.client.prenom} ${selected.client.nom}` : '—'}
                </p>
                {selected.client?.email && (
                  <p className="font-mono text-2xs text-slate-500 mt-0.5">{selected.client.email}</p>
                )}
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3">
                <p className="font-medical text-2xs text-slate-500 uppercase tracking-widest">Statut · Total</p>
                <span className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-2xs font-medical font-semibold ${getStatutCommandeColor(selected.statut)}`}>
                  {getStatutCommandeLabel(selected.statut)}
                </span>
                <p className="font-mono text-xs font-semibold text-teal-700 mt-1">{formatCDF(montantCommande(selected))}</p>
                <p className="font-mono text-2xs text-slate-500 mt-0.5">{formatDate(selected.createdAt)}</p>
              </div>
            </div>

            {selected.note && (
              <div className="rounded-xl border border-amber-200/70 bg-amber-50/40 p-3">
                <p className="font-medical text-2xs font-semibold text-amber-700 uppercase tracking-widest mb-1">Note client</p>
                <p className="font-body text-sm text-amber-900 italic">« {selected.note} »</p>
              </div>
            )}

            {selected.motifRefus && (
              <div className="rounded-xl border border-rose-200/70 bg-rose-50/50 p-3">
                <p className="font-medical text-2xs font-semibold text-rose-700 uppercase tracking-widest mb-1">
                  Motif de refus · {selected.refuseAutomatique ? 'Système (stock insuffisant)' : 'Pharmacien'}
                </p>
                <p className="font-body text-sm text-rose-900">{selected.motifRefus}</p>
              </div>
            )}

            {/* QR de retrait côté client — image fournie par le backend, sinon repli local */}
            {isClientUser && selected.statut !== 'REFUSEE' && (
              <div className="rounded-xl border border-teal-200/70 bg-teal-50/40 p-4">
                <p className="font-display text-sm font-bold text-teal-900 mb-2">Code de retrait</p>
                <p className="font-body text-xs text-teal-700 mb-3">
                  Présentez ce code QR au pharmacien lors du retrait pour authentifier votre commande.
                </p>
                <div className="flex flex-col items-center gap-2">
                  {selected.qrImage ? (
                    <img
                      src={selected.qrImage}
                      alt={`QR ${selected.codeRetrait ?? ''}`}
                      className="h-44 w-44 rounded-xl border border-teal-200 bg-white p-2"
                    />
                  ) : (
                    <QrCode
                      value={selected.payloadQr || selected.codeRetrait || selected.id}
                      label={selected.codeRetrait ?? `#${selected.id.slice(-6).toUpperCase()}`}
                    />
                  )}
                  {selected.codeRetrait && (
                    <p className="font-mono text-sm font-bold tracking-wider text-teal-800">{selected.codeRetrait}</p>
                  )}
                </div>
              </div>
            )}

            <div>
              <p className="font-display text-sm font-bold text-slate-900 mb-2">Médicaments demandés</p>
              <div className="space-y-2">
                {selected.lignes.map(l => (
                  <div key={l.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-200">
                      <Pill size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-semibold text-slate-900 truncate">{l.medicament?.nom ?? '—'}</p>
                      {l.medicament && (
                        <p className="font-mono text-2xs text-slate-500 mt-0.5">
                          {Number(l.medicament.prixCDF).toLocaleString('fr-FR')} CDF · {l.medicament.unite}
                        </p>
                      )}
                    </div>
                    <p className="font-mono text-sm font-bold text-teal-700">× {l.quantite}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions pharmacien : valider / refuser (EN_ATTENTE) */}
            {selected.statut === 'EN_ATTENTE' && canValidateCommande ? (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div>
                  <label className="font-medical text-2xs font-semibold text-slate-500 uppercase tracking-widest">
                    Justification en cas de refus (min. 5 caractères)
                  </label>
                  <textarea
                    value={refusReason}
                    onChange={(e) => setRefusReason(e.target.value)}
                    placeholder="Ex: Ordonnance obligatoire pour ce médicament…"
                    className="mt-1 min-h-20 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-body text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <div className="flex gap-3 justify-end flex-wrap">
                  <Button variant="ghost" onClick={() => setSelected(null)}>
                    <ArrowLeft size={14} /> Retour
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleRefuser(selected)}
                    loading={refuser.isPending}
                    disabled={refusReason.trim().length < 5}
                  >
                    <X size={14} className="text-rose-600" /> Refuser avec motif
                  </Button>
                  <Button onClick={() => handleValider(selected)} loading={valider.isPending}>
                    <Check size={14} /> Valider la commande
                  </Button>
                </div>
              </div>
            ) : selected.statut === 'PRETE' && canPickup ? (
              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <Button variant="ghost" onClick={() => setSelected(null)}>
                  <ArrowLeft size={14} /> Retour
                </Button>
                <Button onClick={() => handleRetrait(selected)} loading={retirerCode.isPending}>
                  <PackageCheck size={14} /> Confirmer le retrait
                </Button>
              </div>
            ) : isClientUser && selected.statut === 'EN_ATTENTE' ? (
              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <Button variant="ghost" onClick={() => setSelected(null)}>
                  <ArrowLeft size={14} /> Retour
                </Button>
                <Button variant="danger" onClick={() => handleAnnuler(selected)} loading={annuler.isPending}>
                  <Ban size={14} /> Annuler la commande
                </Button>
              </div>
            ) : (
              <div className="flex justify-end pt-3 border-t border-slate-100">
                <Button variant="ghost" onClick={() => setSelected(null)}>
                  <ArrowLeft size={14} /> Retour
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal scan de retrait (pharmacien) */}
      <Modal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        title="Scanner un retrait"
        size="md"
      >
        <div className="space-y-4">
          <p className="font-body text-sm text-slate-600">
            Saisissez ou scannez le code de retrait présenté par le client
            (ex. <span className="font-mono">CMD-A3F2-9B1C</span>).
          </p>
          <div className="flex gap-2">
            <input
              value={scanCode}
              onChange={(e) => { setScanCode(e.target.value); setScanInfo(null) }}
              placeholder="CMD-…"
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono uppercase tracking-wider text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            <Button
              variant="outline"
              onClick={handleConsulterScan}
              loading={consulterCode.isPending}
              disabled={!scanCode.trim()}
            >
              Consulter
            </Button>
          </div>

          {scanInfo && (
            <div className="rounded-xl border border-teal-200/70 bg-teal-50/40 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-display text-sm font-bold text-teal-900">
                  {scanInfo.commande.client
                    ? `${scanInfo.commande.client.prenom} ${scanInfo.commande.client.nom}`
                    : 'Client'}
                </p>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-2xs font-medical font-semibold ${getStatutCommandeColor(scanInfo.commande.statut)}`}>
                  {getStatutCommandeLabel(scanInfo.commande.statut)}
                </span>
              </div>
              <p className="font-mono text-2xs text-slate-600">
                {scanInfo.commande.codeRetrait} · {scanInfo.commande.lignes.length} produit
                {scanInfo.commande.lignes.length > 1 ? 's' : ''} · {formatCDF(montantCommande(scanInfo.commande))}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setScanOpen(false)}>Fermer</Button>
            <Button
              onClick={handleConfirmScan}
              loading={retirerCode.isPending}
              disabled={!scanInfo || scanInfo.commande.statut !== 'PRETE'}
            >
              <PackageCheck size={14} /> Confirmer le retrait
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Panel catalogue médicaments (pharmacien) ──────────────────────── */}
      {canManageProduits && (
        <>
          {/* Modal catalogue principal */}
          <Modal
            open={catalogOpen}
            onClose={() => setCatalogOpen(false)}
            title="Gestion du catalogue"
            size="xl"
          >
            <div className="space-y-4">
              {/* Alertes stock */}
              {alertesCount > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200/70 bg-rose-50/60 px-4 py-2.5">
                  <AlertTriangle size={15} className="text-rose-600" />
                  <p className="font-body text-xs text-rose-800 font-semibold">
                    {alertesCount} médicament{alertesCount > 1 ? 's' : ''} en rupture ou sous seuil.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="font-body text-sm text-slate-500">{medicaments.length} médicaments référencés</p>
                <Button
                  size="sm"
                  icon={<Plus size={14} />}
                  onClick={() => setNewMedOpen(true)}
                >
                  Nouveau médicament
                </Button>
              </div>

              {medList.isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}
                </div>
              ) : medicaments.length === 0 ? (
                <p className="py-8 text-center font-body text-sm text-slate-400">Aucun médicament dans le catalogue.</p>
              ) : (
                <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1">
                  {medicaments.map((m) => {
                    const stock = m.stock?.quantite
                    const seuil = m.stock?.seuilMinimum
                    const isLow = stock !== undefined && seuil !== undefined && stock <= seuil
                    return (
                      <div
                        key={m.id}
                        className={`flex items-center justify-between gap-4 rounded-xl border p-3 ${
                          isLow ? 'border-rose-200/70 bg-rose-50/40' : 'border-slate-200/70 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${
                            isLow ? 'bg-rose-100 ring-rose-200 text-rose-700' : 'bg-teal-50 ring-teal-200 text-teal-700'
                          }`}>
                            <Pill size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-body text-sm font-semibold text-slate-900 truncate">{m.nom}</p>
                            <p className="font-mono text-2xs text-slate-500 mt-0.5">
                              {Number(m.prixCDF).toLocaleString('fr-FR')} CDF · {m.unite}
                              {stock !== undefined && (
                                <span className={`ml-2 font-semibold ${isLow ? 'text-rose-600' : 'text-teal-700'}`}>
                                  Stock : {stock}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Button
                            variant="outline" size="sm"
                            icon={<PackagePlus size={13} />}
                            onClick={() => { setRestockMed(m); setRestockQty(''); setRestockSeuil('') }}
                          >
                            Stock
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => setDeleteMed(m)}
                          >
                            <Trash2 size={13} className="text-rose-600" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </Modal>

          {/* Modal : nouveau médicament */}
          <Modal
            open={newMedOpen}
            onClose={() => setNewMedOpen(false)}
            title="Ajouter un médicament"
            size="md"
          >
            <div className="space-y-3">
              <Input
                label="Nom *"
                value={newMedForm.nom}
                onChange={(e) => setNewMedForm((f) => ({ ...f, nom: e.target.value }))}
                placeholder="Ex : Paracétamol 500mg"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Prix CDF *"
                  type="number"
                  value={newMedForm.prixCDF || ''}
                  onChange={(e) => setNewMedForm((f) => ({ ...f, prixCDF: Number(e.target.value) }))}
                  placeholder="3500"
                />
                <Input
                  label="Prix USD"
                  type="number"
                  value={newMedForm.prixUSD || ''}
                  onChange={(e) => setNewMedForm((f) => ({ ...f, prixUSD: Number(e.target.value) }))}
                  placeholder="1.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Catégorie *"
                  value={newMedForm.categorie}
                  onChange={(e) => setNewMedForm((f) => ({ ...f, categorie: e.target.value }))}
                  placeholder="Ex : Analgésiques"
                />
                <Input
                  label="Unité"
                  value={newMedForm.unite}
                  onChange={(e) => setNewMedForm((f) => ({ ...f, unite: e.target.value }))}
                  placeholder="comprimé"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Stock initial"
                  type="number"
                  value={newMedForm.quantiteInitiale ?? ''}
                  onChange={(e) => setNewMedForm((f) => ({ ...f, quantiteInitiale: Number(e.target.value) }))}
                  placeholder="100"
                />
                <Input
                  label="Seuil minimum"
                  type="number"
                  value={newMedForm.seuilMinimum ?? ''}
                  onChange={(e) => setNewMedForm((f) => ({ ...f, seuilMinimum: Number(e.target.value) }))}
                  placeholder="20"
                />
              </div>
              <div>
                <label className="font-medical text-xs font-medium text-slate-600 tracking-wide">Description</label>
                <textarea
                  value={newMedForm.description ?? ''}
                  onChange={(e) => setNewMedForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Indications, contre-indications…"
                  className="mt-1 min-h-16 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-body text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button variant="ghost" onClick={() => setNewMedOpen(false)}>Annuler</Button>
                <Button
                  onClick={handleCreateMed}
                  loading={createMed.isPending}
                  icon={<Plus size={14} />}
                >
                  Ajouter
                </Button>
              </div>
            </div>
          </Modal>

          {/* Modal : réapprovisionner le stock */}
          <Modal
            open={!!restockMed}
            onClose={() => { setRestockMed(null); setRestockQty(''); setRestockSeuil('') }}
            title={restockMed ? `Stock — ${restockMed.nom}` : ''}
            size="sm"
          >
            {restockMed && (
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm">
                  <p className="font-body text-slate-500 text-xs mb-0.5">Stock actuel</p>
                  <p className="font-mono font-bold text-slate-900">
                    {restockMed.stock?.quantite ?? '—'} unités (seuil : {restockMed.stock?.seuilMinimum ?? '—'})
                  </p>
                </div>
                <Input
                  label="Nouvelle quantité totale *"
                  type="number"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  placeholder="Ex : 150"
                />
                <Input
                  label="Nouveau seuil minimum (optionnel)"
                  type="number"
                  value={restockSeuil}
                  onChange={(e) => setRestockSeuil(e.target.value)}
                  placeholder="Ex : 20"
                />
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <Button variant="ghost" onClick={() => setRestockMed(null)}>Annuler</Button>
                  <Button
                    onClick={handleRestock}
                    loading={updateStock.isPending}
                    icon={<PackagePlus size={14} />}
                  >
                    Mettre à jour
                  </Button>
                </div>
              </div>
            )}
          </Modal>

          {/* Confirmation suppression médicament */}
          <ConfirmDialog
            open={!!deleteMed}
            title="Supprimer ce médicament ?"
            message={deleteMed
              ? `« ${deleteMed.nom} » sera retiré du catalogue. Cette action est irréversible.`
              : ''}
            confirmLabel="Supprimer"
            tone="danger"
            loading={removeMed.isPending}
            onConfirm={handleDeleteMed}
            onClose={() => setDeleteMed(null)}
          />
        </>
      )}
    </div>
  )
}
