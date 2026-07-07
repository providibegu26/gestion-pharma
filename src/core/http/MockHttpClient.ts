/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  MockHttpClient — Implémentation HttpClient pour le mode démo
 * ─────────────────────────────────────────────────────────────────────────────
 *  Couvre uniquement les modules auth / users / commandes (cf. API_DOC.md).
 *  Aucun appel réseau. Données stockées en mémoire pour la session.
 *
 *  Sélection :
 *    .env → VITE_MOCK_MODE=true   ou   VITE_HTTP_CLIENT=mock
 *
 *  Aucun service / page / hook n'est conscient du mock — c'est la beauté
 *  d'avoir mis l'abstraction au bon niveau (HttpClient).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { HttpError } from './HttpError'
import type {
  HttpClient,
  HttpClientOptions,
  HttpRequestConfig,
} from './HttpClient'
import { registerAuthMocks } from '../mocks/auth.mocks'
import { registerCommandesMocks } from '../mocks/commandes.mocks'
import { registerMedicamentsMocks } from '../mocks/medicaments.mocks'
import { registerStockMocks } from '../mocks/stock.mocks'
import { registerUsersMocks } from '../mocks/users.mocks'
import type { MockHandler, MockMethod } from '../mocks/types'

type Route = { method: MockMethod; pattern: RegExp; handler: MockHandler }

export class MockHttpClient implements HttpClient {
  private readonly latencyMs: number
  private readonly routes: Route[] = []

  constructor(_opts: HttpClientOptions, latencyMs = 200) {
    this.latencyMs = latencyMs
    // Enregistrement des handlers par module — ordre indifférent
    registerAuthMocks(this.register)
    registerUsersMocks(this.register)
    registerCommandesMocks(this.register)
    registerMedicamentsMocks(this.register)
    registerStockMocks(this.register)
  }

  // ─── API publique HttpClient ───────────────────────────────────────────────

  get<T>(url: string, c?: HttpRequestConfig): Promise<T>       { return this.dispatch('GET',    url, undefined, c) }
  post<T>(url: string, b?: unknown, c?: HttpRequestConfig): Promise<T>  { return this.dispatch('POST',   url, b, c) }
  put<T>(url: string, b?: unknown, c?: HttpRequestConfig): Promise<T>   { return this.dispatch('PUT',    url, b, c) }
  patch<T>(url: string, b?: unknown, c?: HttpRequestConfig): Promise<T> { return this.dispatch('PATCH',  url, b, c) }
  delete<T>(url: string, c?: HttpRequestConfig): Promise<T>            { return this.dispatch('DELETE', url, undefined, c) }

  // ─── Enregistrement de routes (passé aux modules de mocks) ────────────────

  private register = (method: MockMethod, pattern: string, handler: MockHandler) => {
    const re = new RegExp('^' + pattern.replace(/:[^/]+/g, '([^/]+)') + '/?$')
    this.routes.push({ method, pattern: re, handler })
  }

  // ─── Dispatch interne ──────────────────────────────────────────────────────

  private async dispatch<T>(
    method: MockMethod,
    url: string,
    body: unknown,
    _config?: HttpRequestConfig,
  ): Promise<T> {
    // Simulation de latence réseau (UX réaliste)
    await new Promise((r) => setTimeout(r, this.latencyMs))

    const cleanUrl = url.split('?')[0]
    for (const r of this.routes) {
      if (r.method !== method) continue
      const m = r.pattern.exec(cleanUrl)
      if (!m) continue
      const params = m.slice(1)
      try {
        const result = await r.handler({ params, body, url: cleanUrl })
        return result as T
      } catch (err) {
        // Re-propage HttpError directement, encapsule le reste en 500
        if (err instanceof HttpError) throw err
        throw new HttpError({
          message: err instanceof Error ? err.message : 'Mock handler error',
          status: 500,
          url: cleanUrl,
        })
      }
    }

    throw new HttpError({
      message: `[Mock] Aucune route mockée pour ${method} ${cleanUrl}`,
      status: 404,
      url: cleanUrl,
    })
  }
}
