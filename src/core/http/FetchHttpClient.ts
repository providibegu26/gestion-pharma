/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  FetchHttpClient — Implémentation HttpClient basée sur fetch() natif
 * ─────────────────────────────────────────────────────────────────────────────
 *  Zéro dépendance, équivalent fonctionnel d'AxiosHttpClient :
 *  - Sérialisation JSON automatique
 *  - Query params sérialisés via URLSearchParams
 *  - Timeout via AbortController
 *  - Cookies cross-origin via `credentials: 'include'`
 *  - Refresh automatique sur 401 avec file d'attente
 *  - Toutes les erreurs sont mappées vers HttpError
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { HttpError } from './HttpError'
import type {
  HttpClient,
  HttpClientOptions,
  HttpRequestConfig,
} from './HttpClient'

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type PendingRequest = {
  resolve: () => void
  reject: (err: unknown) => void
}

const AUTH_ROUTES = ['/auth/refresh', '/auth/login', '/auth/logout']

export class FetchHttpClient implements HttpClient {
  private readonly baseURL: string
  private readonly withCredentials: boolean
  private readonly defaultHeaders: Record<string, string>
  private readonly onUnauthorized?: () => Promise<boolean>
  private readonly onAuthFailure?: () => void

  private isRefreshing = false
  private queue: PendingRequest[] = []

  constructor(opts: HttpClientOptions) {
    this.baseURL = opts.baseURL.replace(/\/+$/, '')
    this.withCredentials = opts.withCredentials ?? true
    this.defaultHeaders = { 'Content-Type': 'application/json', ...(opts.defaultHeaders ?? {}) }
    this.onUnauthorized = opts.onUnauthorized
    this.onAuthFailure = opts.onAuthFailure
  }

  // ─── Méthodes publiques ────────────────────────────────────────────────────

  get<T>(url: string, c?: HttpRequestConfig): Promise<T> {
    return this.request<T>('GET', url, undefined, c)
  }
  post<T>(url: string, body?: unknown, c?: HttpRequestConfig): Promise<T> {
    return this.request<T>('POST', url, body, c)
  }
  put<T>(url: string, body?: unknown, c?: HttpRequestConfig): Promise<T> {
    return this.request<T>('PUT', url, body, c)
  }
  patch<T>(url: string, body?: unknown, c?: HttpRequestConfig): Promise<T> {
    return this.request<T>('PATCH', url, body, c)
  }
  delete<T>(url: string, c?: HttpRequestConfig): Promise<T> {
    return this.request<T>('DELETE', url, undefined, c)
  }

  // ─── Cœur ──────────────────────────────────────────────────────────────────

  private async request<T>(
    method: Method,
    url: string,
    body?: unknown,
    config?: HttpRequestConfig,
    isRetry = false,
  ): Promise<T> {
    const fullURL = this.buildURL(url, config?.params)
    const headers = { ...this.defaultHeaders, ...(config?.headers ?? {}) }

    // Si body est FormData, retirer Content-Type (le navigateur gère le boundary)
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
    if (isFormData) delete headers['Content-Type']

    const ctrl = new AbortController()
    const timeout = config?.timeout
    const tId = timeout ? setTimeout(() => ctrl.abort(), timeout) : null
    if (config?.signal) {
      if (config.signal.aborted) ctrl.abort()
      else config.signal.addEventListener('abort', () => ctrl.abort(), { once: true })
    }

    let response: Response
    try {
      response = await fetch(fullURL, {
        method,
        headers,
        credentials: (config?.withCredentials ?? this.withCredentials) ? 'include' : 'same-origin',
        body:
          body === undefined ? undefined :
          isFormData ? (body as FormData) :
          JSON.stringify(body),
        signal: ctrl.signal,
      })
    } catch (err) {
      if (tId) clearTimeout(tId)
      throw new HttpError({
        message: err instanceof Error ? err.message : 'Network error',
        status: 0,
        url: fullURL,
        isNetworkError: true,
      })
    }
    if (tId) clearTimeout(tId)

    // ─── 401 → tentative de refresh ──────────────────────────────────────────
    const isAuthRoute = AUTH_ROUTES.some((p) => url.includes(p))
    if (response.status === 401 && this.onUnauthorized && !isAuthRoute && !isRetry) {
      if (this.isRefreshing) {
        await new Promise<void>((resolve, reject) =>
          this.queue.push({ resolve, reject }),
        )
        return this.request<T>(method, url, body, config, true)
      }
      this.isRefreshing = true
      try {
        const ok = await this.onUnauthorized()
        if (!ok) throw new Error('Refresh failed')
        this.flushQueue(null)
        return this.request<T>(method, url, body, config, true)
      } catch (refreshErr) {
        this.flushQueue(refreshErr)
        this.onAuthFailure?.()
        throw await this.toHttpError(response, fullURL)
      } finally {
        this.isRefreshing = false
      }
    }

    if (!response.ok) throw await this.toHttpError(response, fullURL)

    // 204 No Content
    if (response.status === 204) return undefined as T

    if (config?.responseType === 'blob') {
      return (await response.blob()) as T
    }
    if (config?.responseType === 'arrayBuffer') {
      return (await response.arrayBuffer()) as T
    }
    if (config?.responseType === 'text') {
      return (await response.text()) as unknown as T
    }

    const contentType = response.headers.get('Content-Type') ?? ''
    if (contentType.includes('application/json')) {
      return (await response.json()) as T
    }
    return (await response.text()) as unknown as T
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private buildURL(path: string, params?: HttpRequestConfig['params']): string {
    const isAbsolute = /^https?:\/\//i.test(path)
    const base = isAbsolute ? path : `${this.baseURL}/${path.replace(/^\/+/, '')}`
    if (!params) return base
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue
      qs.append(k, String(v))
    }
    const str = qs.toString()
    return str ? `${base}${base.includes('?') ? '&' : '?'}${str}` : base
  }

  private async toHttpError(response: Response, url: string): Promise<HttpError> {
    let data: unknown = undefined
    try {
      const ct = response.headers.get('Content-Type') ?? ''
      data = ct.includes('application/json') ? await response.json() : await response.text()
    } catch { /* corps illisible — on ignore */ }
    const message =
      (typeof data === 'object' && data && 'message' in (data as Record<string, unknown>)
        ? (() => {
            const m = (data as Record<string, unknown>).message
            return Array.isArray(m) ? m.join(', ') : String(m)
          })()
        : response.statusText) || `HTTP ${response.status}`
    return new HttpError({
      message,
      status: response.status,
      url,
      data,
      isNetworkError: false,
    })
  }

  private flushQueue(err: unknown) {
    for (const p of this.queue) err ? p.reject(err) : p.resolve()
    this.queue = []
  }
}
