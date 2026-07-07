import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ShoppingBag, Check, X, Eye, Filter, Clock, CheckCircle2, XCircle, User as UserIcon, Pill, Mail,
} from 'lucide-react'
import { useAuth, useApiError, useCommandes } from '@/adapters/react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { QrCode } from '@/components/ui/QrCode'
import { toast } from '@/components/ui/Toast'
import {
  formatDate, getStatutCommandeColor, getStatutCommandeLabel, getInitials,
} from '@/utils/helpers'
import type { Commande, StatutCommande } from '@/core'

export const CommandesPage = () => {
  const { user, isClient } = useAuth()
  const { getErrorMessage } = useApiError()
  const { list, valider, refuser } = useCommandes()

  const [filter, setFilter] = useState<'ALL' | StatutCommande>('ALL')
  const [selected, setSelected] = useState<Commande | null>(null)
  const [refusReason, setRefusReason] = useState('')
  const canValidateCommande = user?.role === 'PHARMACIEN'
  const isClientUser = isClient()

  const validerMut = {
    ...valider,
    mutate: (id: string) => valider.mutate(id, {
      onSuccess: () => { toast.success('Commande validée'); setSelected(null) },
      onError: (e) => toast.error(getErrorMessage(e)),
    }),
  }
  const refuserMut = {
    ...refuser,
    mutate: (id: string, motifRefus: string) => refuser.mutate({ id, data: { motifRefus } }, {
      onSuccess: () => { toast.success('Commande refusée'); setSelected(null) },
      onError: (e) => toast.error(getErrorMessage(e)),
    }),
  }

  const commandes = list.data ?? []
  const isLoading = list.isLoading
  const filtered = filter === 'ALL' ? commandes : commandes.filter(c => c.statut === filter)
  const stats = {
    all: commandes.length,
    pending: commandes.filter(c => c.statut === 'EN_ATTENTE').length,
    validated: commandes.filter(c => c.statut === 'VALIDEE').length,
    refused: commandes.filter(c => c.statut === 'REFUSEE').length,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commandes clients"
        subtitle="Validation et suivi des commandes en ligne passées par les clients"
        icon={<ShoppingBag size={20} />}
      />

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'ALL',        label: 'Toutes',     count: stats.all,       icon: Filter },
          { key: 'EN_ATTENTE', label: 'En attente', count: stats.pending,   icon: Clock },
          { key: 'VALIDEE',    label: 'Validées',   count: stats.validated, icon: CheckCircle2 },
          { key: 'REFUSEE',    label: 'Refusées',   count: stats.refused,   icon: XCircle },
        ].map((tab) => {
          const Icon = tab.icon
          const active = filter === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as 'ALL' | StatutCommande)}
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
          {filtered.map((c, i) => (
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
                    Voir
                  </Button>
                  {c.statut === 'EN_ATTENTE' && canValidateCommande && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => { setSelected(c); setRefusReason('') }} loading={refuserMut.isPending && refuserMut.variables?.id === c.id}>
                        <X size={13} className="text-rose-600" />
                        Refuser
                      </Button>
                      <Button size="sm" onClick={() => validerMut.mutate(c.id)} loading={validerMut.isPending && validerMut.variables === c.id}>
                        <Check size={13} />
                        Valider
                      </Button>
                    </>
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
        </div>
      )}

      {/* Modal détail */}
      <Modal
        open={!!selected}
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

            {isClientUser && (
              <div className="rounded-xl border border-teal-200/70 bg-teal-50/40 p-4">
                <p className="font-display text-sm font-bold text-teal-900 mb-2">Code de retrait</p>
                <p className="font-body text-xs text-teal-700 mb-3">
                  Présentez ce code QR au pharmacien lors du retrait pour vérifier la commande.
                </p>
                <QrCode
                  value={JSON.stringify({ type: 'COMMANDE_RETRAIT', commandeId: selected.id, clientId: selected.clientId })}
                  label={`Commande #${selected.id.slice(-6).toUpperCase()}`}
                />
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

            {selected.statut === 'EN_ATTENTE' && canValidateCommande && (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div>
                  <label className="font-medical text-2xs font-semibold text-slate-500 uppercase tracking-widest">
                    Justification en cas de refus
                  </label>
                  <textarea
                    value={refusReason}
                    onChange={(e) => setRefusReason(e.target.value)}
                    placeholder="Ex: Produit indisponible, ordonnance à vérifier, quantité non justifiée…"
                    className="mt-1 min-h-20 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-body text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="ghost"
                    onClick={() => refuserMut.mutate(selected.id, refusReason.trim())}
                    loading={refuserMut.isPending}
                    disabled={!refusReason.trim()}
                  >
                    <X size={14} className="text-rose-600" />
                    Refuser avec motif
                  </Button>
                  <Button onClick={() => validerMut.mutate(selected.id)} loading={validerMut.isPending}>
                    <Check size={14} />
                    Valider la commande
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
