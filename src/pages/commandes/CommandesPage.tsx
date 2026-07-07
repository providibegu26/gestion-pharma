import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ShoppingBag, Check, X, Eye, Filter, Clock, CheckCircle2, XCircle, User as UserIcon, Pill, Mail,
  RefreshCw, ArrowLeft, AlertTriangle,
} from 'lucide-react'
import { useAuth, useApiError, useCommandes } from '@/adapters/react'
import { Can } from '@/components/auth/Can'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { QrCode } from '@/components/ui/QrCode'
import { SearchBox } from '@/components/ui/SearchBox'
import { toast } from '@/components/ui/Toast'
import {
  formatDate, getStatutCommandeColor, getStatutCommandeLabel, getInitials,
} from '@/utils/helpers'
import type { Commande, StatutCommande } from '@/core'

const PAGE_SIZE = 8

export const CommandesPage = () => {
  const { user, isClient } = useAuth()
  const { getErrorMessage } = useApiError()
  const { list, valider, refuser } = useCommandes()

  const [filter, setFilter] = useState<'ALL' | StatutCommande>('ALL')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Commande | null>(null)
  const [refusReason, setRefusReason] = useState('')
  const [confirmAction, setConfirmAction] = useState<'valider' | 'refuser' | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<Commande | null>(null)

  const canValidateCommande = user?.role === 'PHARMACIEN'
  const isClientUser = isClient()

  const invalidateList = () => list.refetch()

  const validerMut = {
    ...valider,
    mutate: (id: string) => valider.mutate(id, {
      onSuccess: () => {
        toast.success('Commande validée — prête pour retrait')
        setSelected(null)
        setConfirmAction(null)
        setConfirmTarget(null)
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    }),
  }

  const refuserMut = {
    ...refuser,
    mutate: (id: string, motifRefus: string) => refuser.mutate({ id, data: { motifRefus } }, {
      onSuccess: () => {
        toast.success('Commande refusée')
        setSelected(null)
        setRefusReason('')
        setConfirmAction(null)
        setConfirmTarget(null)
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    }),
  }

  const commandes = list.data ?? []
  const isLoading = list.isLoading

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return commandes
      .filter((c) => filter === 'ALL' || c.statut === filter)
      .filter((c) => {
        if (!q) return true
        const clientName = c.client ? `${c.client.prenom} ${c.client.nom}`.toLowerCase() : ''
        const email = c.client?.email?.toLowerCase() ?? ''
        const id = c.id.toLowerCase()
        return clientName.includes(q) || email.includes(q) || id.includes(q)
      })
  }, [commandes, filter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const stats = {
    all: commandes.length,
    pending: commandes.filter((c) => c.statut === 'EN_ATTENTE').length,
    ready: commandes.filter((c) => c.statut === 'PRETE').length,
    picked: commandes.filter((c) => c.statut === 'RETIREE').length,
    refused: commandes.filter((c) => c.statut === 'REFUSEE').length,
  }

  const openConfirm = (action: 'valider' | 'refuser', cmd: Commande) => {
    setConfirmAction(action)
    setConfirmTarget(cmd)
  }

  const executeConfirm = () => {
    if (!confirmTarget || !confirmAction) return
    if (confirmAction === 'valider') {
      validerMut.mutate(confirmTarget.id)
    } else {
      const motif = selected?.id === confirmTarget.id ? refusReason.trim() : ''
      if (!motif) {
        toast.error('Veuillez saisir un motif de refus')
        return
      }
      refuserMut.mutate(confirmTarget.id, motif)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isClientUser ? 'Mes commandes' : 'Commandes clients'}
        subtitle={isClientUser
          ? 'Suivez l\'état de vos commandes et récupérez votre code de retrait'
          : 'Validation et suivi des commandes en ligne passées par les clients'}
        icon={<ShoppingBag size={20} />}
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw size={14} />}
            loading={list.isFetching && !isLoading}
            onClick={() => invalidateList()}
          >
            Rafraîchir
          </Button>
        }
      />

      {list.isError && (
        <div className="rounded-2xl border border-rose-200/70 bg-rose-50/50 p-4 flex items-center justify-between gap-4 flex-wrap">
          <p className="font-body text-sm text-rose-700">Échec du chargement des commandes.</p>
          <Button variant="outline" size="sm" onClick={() => invalidateList()}>Réessayer</Button>
        </div>
      )}

      {/* Filtres + recherche */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex flex-wrap gap-2 flex-1">
          {[
            { key: 'ALL',        label: 'Toutes',     count: stats.all,       icon: Filter },
            { key: 'EN_ATTENTE', label: 'En attente', count: stats.pending,   icon: Clock },
            { key: 'PRETE',      label: 'Prêtes',     count: stats.ready,     icon: CheckCircle2 },
            { key: 'RETIREE',    label: 'Retirées',   count: stats.picked,    icon: Check },
            { key: 'REFUSEE',    label: 'Refusées',   count: stats.refused,   icon: XCircle },
          ].map((tab) => {
            const Icon = tab.icon
            const active = filter === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => { setFilter(tab.key as 'ALL' | StatutCommande); setPage(1) }}
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
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Client, email ou n° commande…"
          containerClassName="w-full lg:w-72"
        />
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl bg-slate-100/70 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-12 text-center shadow-soft">
          <ShoppingBag size={28} className="mx-auto text-slate-300" />
          <p className="mt-3 font-display text-base font-bold text-slate-900">Aucune commande</p>
          <p className="mt-1 font-body text-sm text-slate-500">Aucune commande ne correspond à ce filtre.</p>
        </div>
      ) : (
        <>
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
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {c.client?.email && (
                          <span className="font-body text-2xs text-slate-500 inline-flex items-center gap-1">
                            <Mail size={10} /> {c.client.email}
                          </span>
                        )}
                        <span className="font-mono text-2xs text-slate-500">
                          #{c.id.slice(-6).toUpperCase()} · {c.lignes.length} produit{c.lignes.length > 1 ? 's' : ''} · {formatDate(c.createdAt)}
                        </span>
                      </div>
                      {c.note && (
                        <p className="font-body text-xs text-slate-600 mt-2 italic line-clamp-1">« {c.note} »</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelected(c)}>
                      <Eye size={13} />
                      Détails
                    </Button>
                    <Can permission="commandes:valider">
                      {c.statut === 'EN_ATTENTE' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSelected(c); setRefusReason('') }}
                          >
                            <X size={13} className="text-rose-600" />
                            Refuser
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openConfirm('valider', c)}
                            loading={validerMut.isPending && validerMut.variables === c.id}
                          >
                            <Check size={13} />
                            Confirmer
                          </Button>
                        </>
                      )}
                    </Can>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {c.lignes.slice(0, 4).map((l) => (
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
          </div>

          <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
            <p className="text-xs text-slate-500 font-body">
              {filtered.length} commande(s) · page {currentPage}/{totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>
                Précédent
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
                Suivant
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Modal détail */}
      <Modal
        open={!!selected && !confirmAction}
        onClose={() => setSelected(null)}
        title={selected ? `Commande #${selected.id.slice(-6).toUpperCase()}` : ''}
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
                <p className="font-medical text-2xs text-slate-500 uppercase tracking-widest">Statut · Date</p>
                <span className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-2xs font-medical font-semibold ${getStatutCommandeColor(selected.statut)}`}>
                  {getStatutCommandeLabel(selected.statut)}
                </span>
                <p className="font-mono text-2xs text-slate-500 mt-1">{formatDate(selected.createdAt)}</p>
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
                <p className="font-medical text-2xs font-semibold text-rose-700 uppercase tracking-widest mb-1">Motif de refus</p>
                <p className="font-body text-sm text-rose-900">{selected.motifRefus}</p>
              </div>
            )}

            {isClientUser && (selected.codeRetrait || selected.payloadQr || selected.qrImage) && (
              <div className="rounded-xl border border-teal-200/70 bg-teal-50/40 p-4">
                <p className="font-display text-sm font-bold text-teal-900 mb-2">Code de retrait</p>
                <p className="font-body text-xs text-teal-700 mb-3">
                  Présentez ce code QR au pharmacien lors du retrait.
                  {selected.codeRetrait && (
                    <span className="block mt-1 font-mono font-semibold">{selected.codeRetrait}</span>
                  )}
                </p>
                <QrCode
                  value={selected.payloadQr ?? selected.codeRetrait ?? selected.id}
                  imageSrc={selected.qrImage}
                  label={selected.codeRetrait ?? `Commande #${selected.id.slice(-6).toUpperCase()}`}
                />
              </div>
            )}

            <div>
              <p className="font-display text-sm font-bold text-slate-900 mb-2">Médicaments demandés</p>
              <div className="space-y-2">
                {selected.lignes.map((l) => (
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

            <Can permission="commandes:valider">
              {selected.statut === 'EN_ATTENTE' && (
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div>
                    <label className="font-medical text-2xs font-semibold text-slate-500 uppercase tracking-widest">
                      Justification en cas de refus
                    </label>
                    <textarea
                      value={refusReason}
                      onChange={(e) => setRefusReason(e.target.value)}
                      placeholder="Ex: Produit indisponible, ordonnance à vérifier…"
                      className="mt-1 min-h-20 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-body text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                  <div className="flex gap-3 justify-between">
                    <Button variant="ghost" onClick={() => setSelected(null)} icon={<ArrowLeft size={14} />}>
                      Retour
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => openConfirm('refuser', selected)}
                        disabled={!refusReason.trim()}
                      >
                        <X size={14} className="text-rose-600" />
                        Refuser avec motif
                      </Button>
                      <Button onClick={() => openConfirm('valider', selected)} loading={validerMut.isPending}>
                        <Check size={14} />
                        Valider la commande
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Can>

            {(selected.statut !== 'EN_ATTENTE' || !canValidateCommande) && (
              <div className="flex justify-start pt-3 border-t border-slate-100">
                <Button variant="ghost" onClick={() => setSelected(null)} icon={<ArrowLeft size={14} />}>
                  Retour
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Confirmation valider / refuser */}
      <Modal
        open={!!confirmAction}
        onClose={() => { setConfirmAction(null); setConfirmTarget(null) }}
        title={confirmAction === 'valider' ? 'Confirmer la validation' : 'Confirmer le refus'}
        size="sm"
      >
        <div className="flex items-start gap-3 mb-5">
          <div className="rounded-lg bg-amber-50 ring-1 ring-inset ring-amber-200 p-2 flex-shrink-0">
            <AlertTriangle size={16} className="text-amber-700" />
          </div>
          <div>
            <p className="font-body text-sm text-slate-700">
              {confirmAction === 'valider'
                ? 'Valider cette commande ? Le stock sera vérifié et la commande passera en statut « Prête » si tout est disponible.'
                : 'Refuser cette commande ? Le client sera notifié avec le motif saisi.'}
            </p>
            {confirmTarget?.client && (
              <p className="font-body text-xs text-slate-500 mt-1">
                {confirmTarget.client.prenom} {confirmTarget.client.nom} — #{confirmTarget.id.slice(-6).toUpperCase()}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => { setConfirmAction(null); setConfirmTarget(null) }}>Annuler</Button>
          <Button
            variant={confirmAction === 'refuser' ? 'danger' : 'primary'}
            loading={validerMut.isPending || refuserMut.isPending}
            onClick={executeConfirm}
          >
            {confirmAction === 'valider' ? 'Confirmer' : 'Refuser'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
