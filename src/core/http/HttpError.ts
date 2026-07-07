/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  HttpError — Erreur HTTP normalisée
 * ─────────────────────────────────────────────────────────────────────────────
 *  Quelle que soit l'implémentation (axios, fetch, futur ky/superagent…), les
 *  services et le code applicatif manipulent UNIQUEMENT cette classe.
 *  -> Pas de fuite d'AxiosError dans les couches supérieures.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { ApiErrorPayload } from '../types'

export class HttpError extends Error {
  /** Statut HTTP (0 si réseau / inconnu) */
  readonly status: number
  /** URL ciblée (best-effort) */
  readonly url: string
  /** Corps de la réponse tel que renvoyé par le backend (souvent ApiErrorPayload) */
  readonly data: ApiErrorPayload | unknown
  /** True si pas de réponse du serveur (timeout / offline / CORS) */
  readonly isNetworkError: boolean

  constructor(opts: {
    message: string
    status: number
    url: string
    data?: unknown
    isNetworkError?: boolean
  }) {
    super(opts.message)
    this.name = 'HttpError'
    this.status = opts.status
    this.url = opts.url
    this.data = opts.data
    this.isNetworkError = opts.isNetworkError ?? false
  }

  /** Vrai si le backend a renvoyé un payload conforme à ApiErrorPayload */
  isApiError(): this is HttpError & { data: ApiErrorPayload } {
    const d = this.data as Partial<ApiErrorPayload> | null
    return !!d && typeof d === 'object' && typeof d.message === 'string' && d.success === false
  }

  /** Extrait un message lisible pour l'utilisateur */
  toUserMessage(fallback = 'Une erreur inattendue est survenue.'): string {
    if (this.isApiError()) return this.data.message
    if (this.isNetworkError) return 'Connexion au serveur impossible. Vérifiez votre réseau.'
    return this.message || fallback
  }
}
