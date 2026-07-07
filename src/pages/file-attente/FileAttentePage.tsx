import { RefreshCw, SkipForward, Check, XCircle, ListOrdered } from 'lucide-react'
import { useApiError, useFileAttente } from '@/adapters/react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { GlassCard } from '@/components/ui/GlassCard'
import { toast } from '@/components/ui/Toast'
import { Can } from '@/components/auth/Can'
import { QueueStats } from '@/components/file-attente/QueueStats'
import { QueueTicket, CurrentClientPanel } from '@/components/file-attente/QueueTicket'
import type { TicketFile } from '@/core'

export const FileAttentePage = () => {
  const { getErrorMessage } = useApiError()
  const { state, appelerSuivant, terminer, annuler, refetch } = useFileAttente('PHARMACIE')

  const data = state.data
  const isLoading = state.isLoading
  const enCours = data?.enCours ?? null
  const prochain = data?.prochain ?? null

  const waiting = data?.tickets.filter((t) => t.statut === 'EN_ATTENTE') ?? []
  const done = data?.tickets.filter((t) => t.statut === 'TERMINE') ?? []
  const cancelled = data?.tickets.filter((t) => t.statut === 'ANNULE') ?? []

  const handleError = (e: unknown) => toast.error(getErrorMessage(e))

  const callNext = () => appelerSuivant.mutate(undefined, {
    onSuccess: () => toast.success('Client appelé'),
    onError: handleError,
  })

  const finish = (t: TicketFile) => terminer.mutate(t.id, {
    onSuccess: () => toast.success('Service terminé'),
    onError: handleError,
  })

  const cancelTicket = (t: TicketFile) => annuler.mutate(t.id, {
    onSuccess: () => toast.success('Ticket annulé'),
    onError: handleError,
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="File d'attente"
        subtitle="Gestion de la file pharmacie — appel et traitement des clients"
        icon={<ListOrdered size={20} />}
        actions={
          <Button variant="outline" size="sm" icon={<RefreshCw size={14} />} loading={state.isFetching && !isLoading} onClick={() => refetch()}>
            Rafraîchir
          </Button>
        }
      />

      {state.isError && (
        <div className="rounded-2xl border border-rose-200/70 bg-rose-50/50 p-4 flex items-center justify-between gap-4">
          <p className="font-body text-sm text-rose-700">Impossible de charger la file d'attente.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Réessayer</Button>
        </div>
      )}

      <QueueStats state={data} loading={isLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CurrentClientPanel ticket={enCours} label="Client en cours" emptyMessage="Aucun client en traitement" accent="teal" />
        <CurrentClientPanel ticket={prochain} label="Prochain client" emptyMessage="File vide" accent="amber" />
      </div>

      <Can permission="file:manage">
        <div className="flex flex-wrap gap-2">
          <Button
            icon={<SkipForward size={15} />}
            onClick={() => callNext()}
            loading={appelerSuivant.isPending}
            disabled={!!enCours || waiting.length === 0}
          >
            Appeler le suivant
          </Button>
          {enCours && (
            <>
              <Button variant="success" icon={<Check size={15} />} onClick={() => finish(enCours)} loading={terminer.isPending}>
                Terminer le service
              </Button>
              <Button variant="danger" icon={<XCircle size={15} />} onClick={() => cancelTicket(enCours)} loading={annuler.isPending}>
                Annuler le ticket
              </Button>
            </>
          )}
        </div>
      </Can>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard variant="solid">
          <h3 className="font-display text-sm font-bold text-slate-900 mb-3">
            En attente <span className="font-mono text-teal-600">({waiting.length})</span>
          </h3>
          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />)}</div>
          ) : waiting.length === 0 ? (
            <p className="font-body text-sm text-slate-500 py-4 text-center">Aucun client en attente</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {waiting.map((t) => <QueueTicket key={t.id} ticket={t} />)}
            </div>
          )}
        </GlassCard>

        <GlassCard variant="solid">
          <h3 className="font-display text-sm font-bold text-slate-900 mb-3">
            Terminés <span className="font-mono text-emerald-600">({done.length})</span>
          </h3>
          {done.length === 0 ? (
            <p className="font-body text-sm text-slate-500 py-4 text-center">Aucun service terminé</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {done.slice().reverse().map((t) => <QueueTicket key={t.id} ticket={t} />)}
            </div>
          )}
        </GlassCard>

        <GlassCard variant="solid">
          <h3 className="font-display text-sm font-bold text-slate-900 mb-3">
            Annulés <span className="font-mono text-rose-600">({cancelled.length})</span>
          </h3>
          {cancelled.length === 0 ? (
            <p className="font-body text-sm text-slate-500 py-4 text-center">Aucun ticket annulé</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {cancelled.slice().reverse().map((t) => <QueueTicket key={t.id} ticket={t} />)}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  )
}
