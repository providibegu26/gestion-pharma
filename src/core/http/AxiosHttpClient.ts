/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  AxiosHttpClient — Implémentation HttpClient basée sur Axios
 * ─────────────────────────────────────────────────────────────────────────────
 *  - Mappe AxiosError → HttpError (aucune fuite d'axios hors de ce fichier)
 *  - Gère le refresh automatique sur 401 via `onUnauthorized`
 *  - Met en file d'attente les requêtes pendant le refresh
 * ─────────────────────────────────────────────────────────────────────────────
 */

import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'
import { HttpError } from './HttpError'
import type {
  HttpClient,
  HttpClientOptions,
  HttpRequestConfig,
} from './HttpClient'

type PendingRequest = {
  resolve: () => void
  reject: (err: unknown) => void
}

export class AxiosHttpClient implements HttpClient {
  private readonly axios: AxiosInstance
  private readonly onUnauthorized?: () => Promise<boolean>
  private readonly onAuthFailure?: () => void

  private isRefreshing = false
  private queue: PendingRequest[] = []

  constructor(opts: HttpClientOptions) {
    this.onUnauthorized = opts.onUnauthorized
    this.onAuthFailure = opts.onAuthFailure

    this.axios = axios.create({
      baseURL: opts.baseURL,
      withCredentials: opts.withCredentials ?? true,
      headers: { 'Content-Type': 'application/json', ...(opts.defaultHeaders ?? {}) },
    })

    this.axios.interceptors.response.use(
      (r) => r,
      (error: AxiosError) => this.handleResponseError(error),
    )
  }

  // ─── Méthodes publiques ────────────────────────────────────────────────────

  async get<T>(url: string, config?: HttpRequestConfig): Promise<T> {
    const r = await this.axios.get(url, this.toAxiosConfig(config))
    return r.data as T
  }
  async post<T>(url: string, body?: unknown, config?: HttpRequestConfig): Promise<T> {
    const r = await this.axios.post(url, body, this.toAxiosConfig(config))
    return r.data as T
  }
  async put<T>(url: string, body?: unknown, config?: HttpRequestConfig): Promise<T> {
    const r = await this.axios.put(url, body, this.toAxiosConfig(config))
    return r.data as T
  }
  async patch<T>(url: string, body?: unknown, config?: HttpRequestConfig): Promise<T> {
    const r = await this.axios.patch(url, body, this.toAxiosConfig(config))
    return r.data as T
  }
  async delete<T>(url: string, config?: HttpRequestConfig): Promise<T> {
    const r = await this.axios.delete(url, this.toAxiosConfig(config))
    return r.data as T
  }

  // ─── Helpers privés ────────────────────────────────────────────────────────

  private toAxiosConfig(c?: HttpRequestConfig): AxiosRequestConfig | undefined {
    if (!c) return undefined
    const responseType =
      c.responseType === 'arrayBuffer'
        ? 'arraybuffer'
        : c.responseType
    return {
      headers: c.headers,
      params: c.params,
      timeout: c.timeout,
      withCredentials: c.withCredentials,
      signal: c.signal,
      responseType,
    }
  }

  private async handleResponseError(error: AxiosError): Promise<never> {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined

    const isAuthRoute = !!originalRequest?.url && ['/auth/refresh', '/auth/login', '/auth/logout']
      .some((p) => originalRequest.url!.includes(p))

    // Tentative de refresh automatique sur 401
    if (
      this.onUnauthorized &&
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRoute
    ) {
      if (this.isRefreshing) {
        // Mise en file d'attente le temps que le refresh en cours aboutisse
        await new Promise<void>((resolve, reject) => {
          this.queue.push({ resolve, reject })
        })
        return this.axios(originalRequest) as Promise<never>
      }

      originalRequest._retry = true
      this.isRefreshing = true

      try {
        const ok = await this.onUnauthorized()
        if (!ok) throw new Error('Refresh failed')
        this.flushQueue(null)
        return this.axios(originalRequest) as Promise<never>
      } catch (refreshErr) {
        this.flushQueue(refreshErr)
        this.onAuthFailure?.()
        throw this.toHttpError(error)
      } finally {
        this.isRefreshing = false
      }
    }

    throw this.toHttpError(error)
  }

  private flushQueue(err: unknown) {
    for (const p of this.queue) err ? p.reject(err) : p.resolve()
    this.queue = []
  }

  private toHttpError(error: AxiosError): HttpError {
    const status = error.response?.status ?? 0
    const url = error.config?.url ?? ''
    return new HttpError({
      message: error.message,
      status,
      url,
      data: error.response?.data,
      isNetworkError: !error.response,
    })
  }
}
