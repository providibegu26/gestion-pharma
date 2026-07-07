/**
 * Handlers mock pour le module Stock — endpoints utilisés par l'admin.
 */

import { HttpError } from '../http/HttpError'
import type { ApiResponse, Stock, UpdateStockPayload } from '../types'
import { medicaments, nowIso } from './data'
import type { RegisterMockFn } from './types'

const ok = <T>(data: T, message = 'OK'): ApiResponse<T> => ({ success: true, data, message })

const toStock = (m: typeof medicaments[number]): Stock | null =>
  m.stock ? { ...m.stock, medicament: m } : null

export const registerStockMocks = (register: RegisterMockFn): void => {
  register('GET', '/stock', () => {
    return ok(medicaments.map(toStock).filter(Boolean), 'Stock récupéré.')
  })

  register('GET', '/stock/alertes', () => {
    const alertes = medicaments
      .map(toStock)
      .filter((s): s is Stock => !!s && s.quantite <= s.seuilMinimum)
    return ok(alertes, `${alertes.length} stock(s) en alerte.`)
  })

  register('GET', '/stock/:medicamentId', ({ params }) => {
    const produit = medicaments.find((m) => m.id === params[0])
    const stock = produit && toStock(produit)
    if (!stock) throw new HttpError({ message: 'Stock introuvable.', status: 404, url: `/stock/${params[0]}` })
    return ok(stock, 'Stock récupéré.')
  })

  register('PATCH', '/stock/:medicamentId', ({ params, body }) => {
    const produit = medicaments.find((m) => m.id === params[0])
    if (!produit?.stock) throw new HttpError({ message: 'Stock introuvable.', status: 404, url: `/stock/${params[0]}` })
    const payload = (body ?? {}) as UpdateStockPayload
    produit.stock.quantite = payload.quantite
    produit.stock.seuilMinimum = payload.seuilMinimum ?? produit.stock.seuilMinimum
    produit.stock.updatedAt = nowIso()
    return ok(toStock(produit), 'Stock mis à jour.')
  })
}

