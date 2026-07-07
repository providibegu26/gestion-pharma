/**
 * Handlers mock pour le module Médicaments — voir API_DOC.md §8.
 */

import { HttpError } from '../http/HttpError'
import type { ApiResponse, CreateMedicamentPayload, Medicament, UpdateMedicamentPayload } from '../types'
import { medicaments, nowIso, uid } from './data'
import type { RegisterMockFn } from './types'

const ok = <T>(data: T, message = 'OK'): ApiResponse<T> => ({ success: true, data, message })

export const registerMedicamentsMocks = (register: RegisterMockFn): void => {
  // GET /medicaments (catalogue public)
  register('GET', '/medicaments', () => {
    return ok([...medicaments], `${medicaments.length} médicament(s) trouvé(s).`)
  })

  // GET /medicaments/:id (détail public)
  register('GET', '/medicaments/:id', ({ params }) => {
    const produit = medicaments.find((m) => m.id === params[0])
    if (!produit) {
      throw new HttpError({
        message: `Médicament ${params[0]} introuvable.`,
        status: 404,
        url: `/medicaments/${params[0]}`,
      })
    }
    return ok(produit as Medicament, 'Médicament récupéré.')
  })

  // POST /medicaments (admin/pharmacien côté backend, admin côté UI actuelle)
  register('POST', '/medicaments', ({ body }) => {
    const payload = (body ?? {}) as CreateMedicamentPayload
    if (!payload.nom || !payload.categorie || !payload.unite || payload.prixCDF === undefined || payload.prixUSD === undefined) {
      throw new HttpError({ message: 'Champs médicament requis manquants.', status: 400, url: '/medicaments' })
    }
    const id = uid('m')
    const created: Medicament = {
      id,
      nom: payload.nom,
      description: payload.description,
      prixCDF: String(payload.prixCDF),
      prixUSD: String(payload.prixUSD),
      categorie: payload.categorie,
      unite: payload.unite,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      stock: {
        id: uid('s'),
        medicamentId: id,
        quantite: payload.quantiteInitiale ?? 0,
        seuilMinimum: payload.seuilMinimum ?? 10,
        updatedAt: nowIso(),
      },
    }
    medicaments.unshift(created)
    return ok(created, 'Médicament créé avec son stock initial.')
  })

  // PATCH /medicaments/:id
  register('PATCH', '/medicaments/:id', ({ params, body }) => {
    const produit = medicaments.find((m) => m.id === params[0])
    if (!produit) throw new HttpError({ message: `Médicament ${params[0]} introuvable.`, status: 404, url: `/medicaments/${params[0]}` })
    const patch = (body ?? {}) as UpdateMedicamentPayload
    Object.assign(produit, {
      nom: patch.nom ?? produit.nom,
      description: patch.description ?? produit.description,
      prixCDF: patch.prixCDF !== undefined ? String(patch.prixCDF) : produit.prixCDF,
      prixUSD: patch.prixUSD !== undefined ? String(patch.prixUSD) : produit.prixUSD,
      categorie: patch.categorie ?? produit.categorie,
      unite: patch.unite ?? produit.unite,
      updatedAt: nowIso(),
    })
    return ok(produit, 'Médicament mis à jour.')
  })

  // DELETE /medicaments/:id
  register('DELETE', '/medicaments/:id', ({ params }) => {
    const index = medicaments.findIndex((m) => m.id === params[0])
    if (index === -1) throw new HttpError({ message: `Médicament ${params[0]} introuvable.`, status: 404, url: `/medicaments/${params[0]}` })
    medicaments.splice(index, 1)
    return ok(null, 'Médicament supprimé.')
  })
}

