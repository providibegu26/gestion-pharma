/**
 * Handlers mock pour le module Commandes — voir API_DOC.md §13.
 */

import { HttpError } from '../http/HttpError'
import type {
  ApiResponse,
  Commande,
  CreateCommandePayload,
  RefuserCommandePayload,
} from '../types'
import {
  commandes,
  getCurrentUser,
  medicaments,
  nowIso,
  uid,
} from './data'
import type { RegisterMockFn } from './types'

const ok = <T>(data: T, message = 'OK'): ApiResponse<T> => ({ success: true, data, message })

const findCommande = (id: string): Commande | undefined =>
  commandes.find((c) => c.id === id)

const notFound = (id: string) =>
  new HttpError({
    message: `Commande ${id} introuvable.`,
    status: 404,
    url: `/commandes/${id}`,
  })

const requireAuth = (): NonNullable<ReturnType<typeof getCurrentUser>> => {
  const u = getCurrentUser()
  if (!u) throw new HttpError({ message: 'Non authentifié.', status: 401, url: '/commandes' })
  return u
}

export const registerCommandesMocks = (register: RegisterMockFn): void => {
  // GET /commandes  — Staff
  register('GET', '/commandes', () => {
    requireAuth()
    return ok([...commandes], `${commandes.length} commande(s) trouvée(s).`)
  })

  // GET /commandes/mes-commandes  — CLIENT
  register('GET', '/commandes/mes-commandes', () => {
    const me = requireAuth()
    const mine = commandes.filter((c) => c.clientId === me.id)
    return ok(mine, `${mine.length} commande(s) trouvée(s).`)
  })

  // GET /commandes/:id
  register('GET', '/commandes/:id', ({ params }) => {
    const me = requireAuth()
    const c = findCommande(params[0])
    if (!c) throw notFound(params[0])
    if (me.role === 'CLIENT' && c.clientId !== me.id) {
      throw new HttpError({ message: 'Accès refusé.', status: 403, url: `/commandes/${params[0]}` })
    }
    return ok(c, 'Commande récupérée.')
  })

  // POST /commandes  — CLIENT
  register('POST', '/commandes', ({ body }) => {
    const me = requireAuth()
    if (me.role !== 'CLIENT') {
      throw new HttpError({ message: 'Seuls les clients peuvent passer commande.', status: 403, url: '/commandes' })
    }
    const payload = (body ?? {}) as CreateCommandePayload
    if (!payload.lignes || payload.lignes.length === 0) {
      throw new HttpError({ message: 'Au moins une ligne est requise.', status: 400, url: '/commandes' })
    }
    // Vérifier que tous les medicamentId existent
    const unknown = payload.lignes.find((l) => !medicaments.some((m) => m.id === l.medicamentId))
    if (unknown) {
      throw new HttpError({
        message: `Médicament ${unknown.medicamentId} introuvable.`,
        status: 404,
        url: '/commandes',
      })
    }
    const cmdId = uid('cmd')
    const codeRetrait = `CMD-${cmdId.slice(-6).toUpperCase()}`
    const created: Commande = {
      id: cmdId,
      clientId: me.id,
      statut: 'EN_ATTENTE',
      note: payload.note ?? null,
      codeRetrait,
      payloadQr: `PHARMACIE-COMMANDE:${cmdId}`,
      montantTotal: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      client: { id: me.id, nom: me.nom, prenom: me.prenom, email: me.email },
      lignes: payload.lignes.map((l) => ({
        id: uid('l'),
        commandeId: cmdId,
        medicamentId: l.medicamentId,
        quantite: l.quantite,
        medicament: medicaments.find((m) => m.id === l.medicamentId),
      })),
    }
    commandes.unshift(created)
    return ok(created, 'Commande créée. Elle sera traitée par notre équipe.')
  })

  // PATCH /commandes/:id/valider — Staff
  register('PATCH', '/commandes/:id/valider', ({ params }) => {
    const c = findCommande(params[0])
    if (!c) throw notFound(params[0])
    if (c.statut !== 'EN_ATTENTE') {
      throw new HttpError({
        message: 'Cette commande a déjà été traitée.',
        status: 400,
        url: `/commandes/${c.id}/valider`,
      })
    }
    c.statut = 'PRETE'
    c.preteAt = nowIso()
    c.updatedAt = nowIso()
    return ok(c, 'Commande validée.')
  })

  // PATCH /commandes/:id/refuser — Staff
  register('PATCH', '/commandes/:id/refuser', ({ params, body }) => {
    const c = findCommande(params[0])
    if (!c) throw notFound(params[0])
    const payload = (body ?? {}) as Partial<RefuserCommandePayload>
    if (!payload.motifRefus?.trim()) {
      throw new HttpError({
        message: 'La justification du refus est obligatoire.',
        status: 400,
        url: `/commandes/${c.id}/refuser`,
      })
    }
    if (c.statut !== 'EN_ATTENTE') {
      throw new HttpError({
        message: 'Cette commande a déjà été traitée.',
        status: 400,
        url: `/commandes/${c.id}/refuser`,
      })
    }
    c.statut = 'REFUSEE'
    c.motifRefus = payload.motifRefus.trim()
    c.refusedAt = nowIso()
    c.updatedAt = nowIso()
    return ok(c, 'Commande refusée.')
  })
}
