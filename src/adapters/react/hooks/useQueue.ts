/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  useQueue — File d'attente automatique (React)
 * ─────────────────────────────────────────────────────────────────────────────
 *  Source de vérité : le backend /file-attente (QueueService), interrogé via
 *  React Query avec un polling léger (le WebSocket `file-attente` complète en
 *  temps réel). Si l'API est indisponible (backend éteint / démo hors-ligne),
 *  bascule AUTOMATIQUEMENT sur `QueueStore` (simulation locale persistante) pour
 *  rester pleinement démontrable — sans changer l'UI.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueueStats, TypeService } from '@/core'
import { useServices } from '../ServicesContext'
import { useObservable } from './useObservable'

const LIST_KEY = 'file-attente'
const STATS_KEY = 'file-attente-stats'

export const useQueue = (typeService: TypeService = 'PHARMACIE') => {
  const { queue: svc, queueStore } = useServices()
  const qc = useQueryClient()

  // ─── Tentative API réelle (repli local si erreur) ──────────────────────────
  const listQuery = useQuery({
    queryKey: [LIST_KEY, typeService],
    queryFn: () => svc.list(typeService),
    retry: false,
    refetchInterval: 15_000,
  })
  const statsQuery = useQuery({
    queryKey: [STATS_KEY],
    queryFn: () => svc.stats(),
    retry: false,
    refetchInterval: 15_000,
  })

  /** True tant que l'API répond. Une erreur bascule sur la simulation locale. */
  const apiAvailable = !listQuery.isError

  // Toujours souscrit (ordre des hooks stable) — utilisé seulement en repli.
  const localTickets = useObservable(queueStore)

  const tickets = apiAvailable
    ? listQuery.data ?? []
    : localTickets.filter((t) => t.typeService === typeService)

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [LIST_KEY] })
    qc.invalidateQueries({ queryKey: [STATS_KEY] })
  }

  const join = useMutation({
    mutationFn: (nomAffiche?: string) => {
      if (apiAvailable) {
        return nomAffiche
          ? svc.joinPublic({ typeService, nomAffiche })
          : svc.join({ typeService })
      }
      return Promise.resolve(queueStore.join(typeService, nomAffiche))
    },
    onSuccess: invalidate,
  })

  const callNext = useMutation({
    mutationFn: () =>
      apiAvailable ? svc.callNext(typeService) : Promise.resolve(queueStore.callNext(typeService)),
    onSuccess: invalidate,
  })

  const start = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (apiAvailable) await svc.start(id)
      else queueStore.start(id)
    },
    onSuccess: invalidate,
  })

  const complete = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (apiAvailable) await svc.complete(id)
      else queueStore.complete(id)
    },
    onSuccess: invalidate,
  })

  const cancel = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (apiAvailable) await svc.cancel(id)
      else queueStore.cancel(id)
    },
    onSuccess: invalidate,
  })

  const clearFinished = () => {
    if (!apiAvailable) queueStore.clearFinished()
  }

  const refresh = () => {
    void listQuery.refetch()
    void statsQuery.refetch()
  }

  // ─── Vues dérivées pour le tableau de bord de la file ──────────────────────
  const derived = useMemo(() => {
    const waiting = tickets.filter((t) => t.statut === 'EN_ATTENTE')
    const called = tickets.filter((t) => t.statut === 'APPELE')
    const current =
      tickets.find((t) => t.statut === 'EN_COURS') ?? called[0] ?? null
    const done = tickets.filter((t) => t.statut === 'TERMINE')
    const cancelled = tickets.filter((t) => t.statut === 'ANNULE')

    const fallbackStats: QueueStats = queueStore.stats()
    const stats = apiAvailable ? statsQuery.data : fallbackStats
    const serviceStats =
      typeService === 'PHARMACIE' ? stats?.pharmacie : stats?.caisse

    return {
      waiting,
      called,
      current,
      next: waiting[0] ?? null,
      done,
      cancelled,
      serviceStats: serviceStats ?? { enAttente: waiting.length, enCours: current ? 1 : 0, estimeeProchaine: 0 },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickets, apiAvailable, statsQuery.data, typeService])

  return {
    typeService,
    tickets,
    apiAvailable,
    isLoading: listQuery.isLoading,
    ...derived,
    join,
    callNext,
    start,
    complete,
    cancel,
    clearFinished,
    refresh,
  }
}
