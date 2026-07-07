/**
 * Handlers mock pour le module Commandes — voir API_DOC.md §13.
 */

import { HttpError } from '../http/HttpError'
import type {
  ApiResponse,
  Commande,
  CommandeCodePayload,
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

/** Génère un code de retrait au format backend (CMD-XXXX-XXXX). */
const genCodeRetrait = (): string => {
  const seg = () => Math.random().toString(36).slice(2, 6).toUpperCase()
  return `CMD-${seg()}-${seg()}`
}

const montantOf = (c: Commande): string =>
  c.lignes
    .reduce((sum, l) => sum + Number(l.medicament?.prixCDF ?? 0) * l.quantite, 0)
    .toFixed(2)

const findByCode = (code: string): Commande | undefined => {
  const clean = code.replace(/^PHARMACIE-COMMANDE:/, '').trim()
  return commandes.find((c) => c.codeRetrait === clean || c.payloadQr === code)
}

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
    const codeRetrait = genCodeRetrait()
    const created: Commande = {
      id: cmdId,
      clientId: me.id,
      statut: 'EN_ATTENTE',
      note: payload.note ?? null,
      refuseAutomatique: false,
      codeRetrait,
      payloadQr: `PHARMACIE-COMMANDE:${codeRetrait}`,
      qrImage: null, // le vrai backend renvoie une image base64 ; ici repli QrCode côté UI
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
    created.montantTotal = montantOf(created)
    commandes.unshift(created)
    return ok(created, 'Commande créée. Code de retrait généré.')
  })

  // PATCH /commandes/:id/valider — PHARMACIEN (→ PRETE ou REFUSEE auto si stock KO)
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
    // Simulation d'une vérification de stock (refus automatique si insuffisant).
    const rupture = c.lignes
      .map((l) => ({ ligne: l, med: medicaments.find((m) => m.id === l.medicamentId) }))
      .find(({ ligne, med }) => {
        const dispo = med?.stock?.quantite
        return dispo !== undefined && dispo < ligne.quantite
      })
    if (rupture) {
      const dispo = rupture.med?.stock?.quantite
      c.statut = 'REFUSEE'
      c.refuseAutomatique = true
      c.motifRefus = `Stock insuffisant — ${rupture.med?.nom ?? 'produit'} (demandé : ${rupture.ligne.quantite}, disponible : ${dispo})`
      c.refusedAt = nowIso()
      c.updatedAt = nowIso()
      return ok(c, 'Commande refusée automatiquement (stock insuffisant).')
    }
    c.statut = 'PRETE'
    c.validatedAt = nowIso()
    c.updatedAt = nowIso()
    return ok(c, 'Commande validée — prête pour le retrait.')
  })

  // PATCH /commandes/:id/prete — PHARMACIEN
  register('PATCH', '/commandes/:id/prete', ({ params }) => {
    const c = findCommande(params[0])
    if (!c) throw notFound(params[0])
    c.statut = 'PRETE'
    c.updatedAt = nowIso()
    return ok(c, 'Commande marquée comme prête.')
  })

  // PATCH /commandes/:id/annuler — CLIENT (si EN_ATTENTE)
  register('PATCH', '/commandes/:id/annuler', ({ params }) => {
    const me = requireAuth()
    const c = findCommande(params[0])
    if (!c) throw notFound(params[0])
    if (me.role === 'CLIENT' && c.clientId !== me.id) {
      throw new HttpError({ message: 'Accès refusé.', status: 403, url: `/commandes/${c.id}/annuler` })
    }
    if (c.statut !== 'EN_ATTENTE') {
      throw new HttpError({
        message: 'Seule une commande en attente peut être annulée.',
        status: 400,
        url: `/commandes/${c.id}/annuler`,
      })
    }
    c.statut = 'REFUSEE'
    c.motifRefus = 'Annulée par le client.'
    c.refuseAutomatique = false
    c.updatedAt = nowIso()
    return ok(c, 'Commande annulée.')
  })

  // POST /commandes/code/consulter — PHARMACIEN, CAISSIER
  register('POST', '/commandes/code/consulter', ({ body }) => {
    requireAuth()
    const { code } = (body ?? {}) as CommandeCodePayload
    const c = code ? findByCode(code) : undefined
    if (!c) throw new HttpError({ message: 'Code de retrait introuvable.', status: 404, url: '/commandes/code/consulter' })
    return ok({ commande: c, utilisable: c.statut === 'PRETE' }, 'Commande trouvée.')
  })

  // POST /commandes/code/retirer — PHARMACIEN
  register('POST', '/commandes/code/retirer', ({ body }) => {
    requireAuth()
    const { code } = (body ?? {}) as CommandeCodePayload
    const c = code ? findByCode(code) : undefined
    if (!c) throw new HttpError({ message: 'Code de retrait introuvable.', status: 404, url: '/commandes/code/retirer' })
    if (c.statut !== 'PRETE') {
      throw new HttpError({ message: 'La commande doit être prête pour être retirée.', status: 400, url: '/commandes/code/retirer' })
    }
    c.statut = 'RETIREE'
    c.retraitAt = nowIso()
    c.updatedAt = nowIso()
    return ok(c, 'Retrait confirmé.')
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
