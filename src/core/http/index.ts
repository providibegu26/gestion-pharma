/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Couche HTTP — Point d'entrée unique
 * ─────────────────────────────────────────────────────────────────────────────
 *  La factory `createHttpClient()` choisit l'implémentation à l'instanciation.
 *
 *  Bascule Fetch ↔ Axios ↔ Mock :
 *    1. Soit via .env :          VITE_HTTP_CLIENT=fetch|axios|mock
 *    2. Soit en passant l'option explicite : createHttpClient({ kind: 'fetch' })
 *
 *  Aucun service ni aucune page n'a besoin d'être modifié pour basculer.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { AxiosHttpClient } from './AxiosHttpClient'
import { FetchHttpClient } from './FetchHttpClient'
import { MockHttpClient } from './MockHttpClient'
import type { HttpClient, HttpClientOptions } from './HttpClient'

export type HttpClientKind = 'axios' | 'fetch' | 'mock'

export interface CreateHttpClientOptions extends HttpClientOptions {
  /** Implémentation à utiliser. Par défaut : lue depuis l'environnement, sinon 'fetch'. */
  kind?: HttpClientKind
}

const readEnvKind = (): HttpClientKind => {
  try {
    const env = (import.meta as unknown as { env?: Record<string, string> }).env ?? {}
    // Mode démo prioritaire (rétro-compat avec l'ancien VITE_MOCK_MODE)
    if (env.VITE_MOCK_MODE === 'true') return 'mock'
    const raw = env.VITE_HTTP_CLIENT
    if (raw === 'mock')  return 'mock'
    if (raw === 'axios') return 'axios'
    // Par défaut on privilégie fetch pour la connexion frontend/backend.
    return 'fetch'
  } catch {
    return 'fetch'
  }
}

export const createHttpClient = (opts: CreateHttpClientOptions): HttpClient => {
  const kind = opts.kind ?? readEnvKind()
  switch (kind) {
    case 'mock':  return new MockHttpClient(opts)
    case 'fetch': return new FetchHttpClient(opts)
    case 'axios':
    default:      return new AxiosHttpClient(opts)
  }
}

export { HttpError } from './HttpError'
export type {
  HttpClient,
  HttpClientOptions,
  HttpRequestConfig,
} from './HttpClient'
