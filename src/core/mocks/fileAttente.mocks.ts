/**
 * Handlers mock pour la file d'attente (alignés sur l'API backend)
 */

import { HttpError } from '../http/HttpError'
import type { ApiResponse, FileAttenteState, FileAttenteStats, TicketFile } from '../types'
import { fileTickets, nowIso } from './data'
import type { RegisterMockFn } from './types'

const ok = <T>(data: T, message = 'OK'): ApiResponse<T> => ({ success: true, data, message })

const buildState = (): FileAttenteState => {
  const enCours = fileTickets.find((t) => t.statut === 'EN_COURS') ?? null
  const prochain = fileTickets.find((t) => t.statut === 'EN_ATTENTE') ?? null
  const stats: FileAttenteStats = {
    pharmacie: {
      enAttente: fileTickets.filter((t) => t.statut === 'EN_ATTENTE').length,
      enCours: fileTickets.filter((t) => t.statut === 'EN_COURS').length,
      termines: fileTickets.filter((t) => t.statut === 'TERMINE').length,
      annules: fileTickets.filter((t) => t.statut === 'ANNULE').length,
    },
  }
  return {
    tickets: [...fileTickets].sort((a, b) => a.numero - b.numero),
    enCours,
    prochain,
    stats,
  }
}

const findTicket = (id: string): TicketFile | undefined =>
  fileTickets.find((t) => t.id === id)

export const registerFileAttenteMocks = (register: RegisterMockFn): void => {
  register('GET', '/file-attente', () => ok(buildState().tickets, 'File d\'attente récupérée.'))

  register('GET', '/file-attente/stats', () => {
    const state = buildState()
    return ok(state.stats ?? {}, 'Statistiques file d\'attente.')
  })

  register('POST', '/file-attente/appeler-suivant', () => {
    const state = buildState()
    if (state.enCours) {
      throw new HttpError({ message: 'Un client est déjà en cours de traitement.', status: 400, url: '/file-attente/appeler-suivant' })
    }
    const next = fileTickets.find((t) => t.statut === 'EN_ATTENTE')
    if (!next) {
      throw new HttpError({ message: 'Aucun client en attente.', status: 404, url: '/file-attente/appeler-suivant' })
    }
    next.statut = 'EN_COURS'
    next.appeleAt = nowIso()
    return ok(next, 'Client appelé.')
  })

  register('PATCH', '/file-attente/:id/demarrer', ({ params }) => {
    const t = findTicket(params[0])
    if (!t) throw new HttpError({ message: 'Ticket introuvable.', status: 404, url: `/file-attente/${params[0]}/demarrer` })
    const current = fileTickets.find((x) => x.statut === 'EN_COURS')
    if (current && current.id !== t.id) {
      throw new HttpError({ message: 'Un autre client est déjà en cours.', status: 400, url: `/file-attente/${params[0]}/demarrer` })
    }
    t.statut = 'EN_COURS'
    t.appeleAt = nowIso()
    return ok(t, 'Service démarré.')
  })

  register('PATCH', '/file-attente/:id/terminer', ({ params }) => {
    const t = findTicket(params[0])
    if (!t) throw new HttpError({ message: 'Ticket introuvable.', status: 404, url: `/file-attente/${params[0]}/terminer` })
    t.statut = 'TERMINE'
    t.termineAt = nowIso()
    return ok(t, 'Service terminé.')
  })

  register('PATCH', '/file-attente/:id/annuler', ({ params }) => {
    const t = findTicket(params[0])
    if (!t) throw new HttpError({ message: 'Ticket introuvable.', status: 404, url: `/file-attente/${params[0]}/annuler` })
    t.statut = 'ANNULE'
    t.termineAt = nowIso()
    return ok(t, 'Ticket annulé.')
  })
}
