import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  ListOrdered, PhoneCall, Check, X, Users, Clock,
  CheckCircle2, Play, Trash2, Hourglass, WifiOff, RefreshCw, Zap,
} from 'lucide-react'
import { usePermissions, useQueue, useCommandes, useApiError } from '@/adapters/react'
import type { QueueTicket, TypeService } from '@/core'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { GlassCard } from '@/components/ui/GlassCard'
import { StatCard } from '@/components/ui/StatCard'
import { toast } from '@/components/ui/Toast'
import { getStatutQueueColor, getStatutQueueLabel } from '@/utils/helpers'

/**
 * File d'attente automatique — vue temps réel pour le personnel.
 *
 * Les clients sont ajoutés AUTOMATIQUEMENT à la file à partir des commandes
 * EN_ATTENTE : dès qu'une commande est en attente de validation, son client
 * apparaît dans la file. Aucun ajout manuel n'est nécessaire ou autorisé.
 *
 * Alimentée par `useQueue` (API /file-attente + repli simulation locale).
 */
export const FileAttentePage = () => {
  const { role } = usePermissions()
  const { getErrorMessage } = useApiError()
  const typeService: TypeService = role === 'CAISSIER' ? 'CAISSE' : 'PHARMACIE'
  const serviceLabel = typeService === 'CAISSE' ? 'Caisse' : 'Pharmacie'

  const {
    apiAvailable, isLoading,
    tickets, waiting, current, next, done, serviceStats,
    join, callNext, start, complete, cancel, clearFinished, refresh,
  } = useQueue(typeService)

  const { list: commandesList } = useCommandes()

  // ─── Auto-peuplement depuis les commandes EN_ATTENTE ─────────────────────
  // Suit les ID de commandes déjà synchronisées dans cette session (évite les doublons).
  const syncedIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (commandesList.isLoading || join.isPending) return

    const pendingOrders = (commandesList.data ?? []).filter(c => c.statut === 'EN_ATTENTE')

    // Clients déjà actifs dans la file (EN_ATTENTE, APPELE, EN_COURS).
    const activeNames = new Set(
      tickets
        .filter(t => !['TERMINE', 'ANNULE'].includes(t.statut))
        .map(t => t.nomAffiche?.toLowerCase().trim() ?? ''),
    )

    pendingOrders.forEach(commande => {
      if (syncedIds.current.has(commande.id)) return

      const nomAffiche = commande.client
        ? `${commande.client.prenom} ${commande.client.nom}`.trim()
        : `Client #${commande.id.slice(-4)}`

      // Ne pas ajouter si le client est déjà dans la file active.
      if (activeNames.has(nomAffiche.toLowerCase())) {
        syncedIds.current.add(commande.id)
        return
      }

      syncedIds.current.add(commande.id)
      join.mutate(nomAffiche, {
        onError: () => {
          // Autoriser un nouvel essai lors du prochain cycle.
          syncedIds.current.delete(commande.id)
        },
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commandesList.data, tickets])

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleCallNext = () => {
    callNext.mutate(undefined, {
      onSuccess: (called) => {
        if (called) toast.success(`Ticket n°${called.numeroTicket} appelé${called.nomAffiche ? ` : ${called.nomAffiche}` : ''}`)
        else toast.info('Aucun client en attente.')
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    })
  }

  const handleStart = (id: string) =>
    start.mutate(id, { onError: (err) => toast.error(getErrorMessage(err)) })

  const handleComplete = (id: string) =>
    complete.mutate(id, {
      onSuccess: () => toast.success('Service terminé — suivant appelé automatiquement.'),
      onError: (err) => toast.error(getErrorMessage(err)),
    })

  const handleCancel = (id: string) =>
    cancel.mutate(id, { onError: (err) => toast.error(getErrorMessage(err)) })

  const handleSync = () => {
    // Forcer un nouveau cycle de synchronisation.
    syncedIds.current.clear()
    refresh()
    commandesList.refetch()
  }

  const doneCount = done.length

  return (
    <div className="space-y-6">
      <PageHeader
        title={`File ${serviceLabel}`}
        subtitle="Les clients ayant des commandes en attente apparaissent ici automatiquement"
        icon={<ListOrdered size={20} />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
              onClick={refresh}
            >
              Rafraîchir
            </Button>
            <Button
              variant="outline"
              icon={<Zap size={14} />}
              onClick={handleSync}
              title="Resynchroniser les commandes en attente"
            >
              Synchroniser
            </Button>
            <Button
              icon={<PhoneCall size={15} />}
              onClick={handleCallNext}
              loading={callNext.isPending}
              disabled={!next && !current}
            >
              Appeler le suivant
            </Button>
          </div>
        }
      />

      {/* Bannière : repli simulation */}
      {!apiAvailable && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200/70 bg-amber-50/60 px-4 py-2.5">
          <WifiOff size={15} className="text-amber-600" />
          <p className="font-body text-xs text-amber-800">
            Mode démonstration — file locale synchronisée depuis les commandes en attente.
            <span className="font-mono"> /file-attente</span> momentanément indisponible.
          </p>
        </div>
      )}

      {/* Indicateurs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard title="En attente" value={serviceStats.enAttente} subtitle="Clients dans la file" icon={<Clock size={18} />} color="amber" />
        <StatCard title="En cours" value={serviceStats.enCours} subtitle="Au comptoir" icon={<Play size={18} />} color="teal" delay={0.05} />
        <StatCard title="Attente estimée" value={`~${serviceStats.estimeeProchaine} min`} subtitle="Prochain passage" icon={<Hourglass size={18} />} color="cyan" delay={0.1} />
        <StatCard title="Terminés" value={doneCount} subtitle="Servis aujourd'hui" icon={<CheckCircle2 size={18} />} color="emerald" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4">
        {/* Colonne gauche : en cours / appelé + prochain */}
        <div className="space-y-4">
          <GlassCard variant="solid" className="p-5">
            <p className="font-medical text-2xs font-semibold text-teal-600 uppercase tracking-widest mb-3">
              {current?.statut === 'APPELE' ? 'Client appelé' : 'Client en cours'}
            </p>
            {current ? (
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-teal-sm">
                    <span className="font-mono text-lg font-bold">{current.numeroTicket}</span>
                  </div>
                  <div>
                    <p className="font-display text-lg font-bold text-slate-900">
                      {current.nomAffiche || `Ticket n°${current.numeroTicket}`}
                    </p>
                    <span className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-medical font-semibold ${getStatutQueueColor(current.statut)}`}>
                      {getStatutQueueLabel(current.statut)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleCancel(current.id)} loading={cancel.isPending}>
                    <X size={13} className="text-rose-600" /> Annuler
                  </Button>
                  {current.statut === 'APPELE' ? (
                    <Button size="sm" onClick={() => handleStart(current.id)} loading={start.isPending}>
                      <Play size={13} /> Démarrer
                    </Button>
                  ) : (
                    <Button variant="success" size="sm" onClick={() => handleComplete(current.id)} loading={complete.isPending}>
                      <Check size={13} /> Terminer
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Hourglass size={26} className="text-slate-300" />
                <p className="mt-2 font-body text-sm text-slate-500">Aucun client au comptoir.</p>
                <p className="font-body text-xs text-slate-400">Cliquez sur « Appeler le suivant » pour démarrer.</p>
              </div>
            )}
          </GlassCard>

          {next && (
            <GlassCard variant="sand" className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 ring-1 ring-inset ring-sand-200 text-sand-700">
                    <span className="font-mono text-sm font-bold">{next.numeroTicket}</span>
                  </div>
                  <div>
                    <p className="font-medical text-2xs font-semibold text-sand-700 uppercase tracking-widest">Prochain</p>
                    <p className="font-body text-sm font-semibold text-slate-900">{next.nomAffiche || `Ticket n°${next.numeroTicket}`}</p>
                  </div>
                </div>
                <Button size="sm" onClick={handleCallNext} loading={callNext.isPending}>
                  <PhoneCall size={13} /> Appeler
                </Button>
              </div>
            </GlassCard>
          )}
        </div>

        {/* Colonne droite : file d'attente */}
        <GlassCard variant="solid" className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-display text-sm font-bold text-slate-900">En attente ({waiting.length})</p>
            <Users size={15} className="text-slate-400" />
          </div>
          {waiting.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center">
              <p className="font-body text-sm text-slate-400">
                {commandesList.isLoading ? 'Synchronisation…' : 'Aucun client en attente.'}
              </p>
              {!commandesList.isLoading && (
                <p className="font-body text-xs text-slate-400 mt-1">
                  Les clients avec des commandes EN_ATTENTE apparaîtront ici automatiquement.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {waiting.map((t, i) => (
                <QueueRow
                  key={t.id}
                  ticket={t}
                  position={t.position ?? i + 1}
                  onCancel={() => handleCancel(t.id)}
                />
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Historique récent (terminés) */}
      {doneCount > 0 && (
        <GlassCard variant="solid" className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-display text-sm font-bold text-slate-900">Récemment servis</p>
            {!apiAvailable && (
              <Button variant="ghost" size="sm" icon={<Trash2 size={13} />} onClick={clearFinished}>
                Vider l'historique
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {done.slice(-12).reverse().map((t) => (
              <span key={t.id} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/70 px-2.5 py-1 text-2xs font-body text-emerald-700">
                <CheckCircle2 size={10} /> n°{t.numeroTicket}{t.nomAffiche ? ` · ${t.nomAffiche}` : ''}
              </span>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  )
}

const QueueRow = ({
  ticket, position, onCancel,
}: {
  ticket: QueueTicket
  position: number
  onCancel: () => void
}) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-white p-3 shadow-soft"
  >
    <div className="flex items-center gap-3 min-w-0">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <span className="font-mono text-xs font-bold">{ticket.numeroTicket}</span>
      </div>
      <div className="min-w-0">
        <p className="font-body text-sm font-semibold text-slate-900 truncate">
          {ticket.nomAffiche || `Ticket n°${ticket.numeroTicket}`}
        </p>
        <span className="font-mono text-2xs text-slate-400">
          Position {position}{ticket.estimeeMinutes != null ? ` · ~${ticket.estimeeMinutes} min` : ''}
        </span>
      </div>
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-medical font-semibold ${getStatutQueueColor(ticket.statut)}`}>
        {getStatutQueueLabel(ticket.statut)}
      </span>
      <Button
        variant="ghost" size="sm"
        icon={<X size={13} className="text-rose-600" />}
        onClick={onCancel}
        aria-label="Retirer de la file"
      />
    </div>
  </motion.div>
)
