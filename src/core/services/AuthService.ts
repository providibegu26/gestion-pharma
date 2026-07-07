/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  AuthService — Service d'authentification (framework-agnostic)
 * ─────────────────────────────────────────────────────────────────────────────
 *  Encapsule tous les appels HTTP liés à l'auth.
 *  Ne dépend QUE de l'interface HttpClient — aucun import React/Angular/Vue.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { HttpClient, HttpRequestConfig } from '../http'
import type {
  ApiResponse,
  ChangePasswordPayload,
  LoginPayload,
  RegisterClientPayload,
  User,
} from '../types'

export class AuthService {
  constructor(private readonly http: HttpClient) {}

  login(payload: LoginPayload): Promise<User> {
    return this.http
      .post<ApiResponse<User>>('/auth/login', payload)
      .then((r) => r.data)
  }

  /** Inscription publique CLIENT */
  register(payload: RegisterClientPayload): Promise<User> {
    return this.http
      .post<ApiResponse<User>>('/auth/register', payload)
      .then((r) => r.data)
  }

  /** Récupère l'utilisateur courant (via cookie HTTP-only) */
  me(config?: HttpRequestConfig): Promise<User> {
    return this.http
      .get<ApiResponse<User>>('/auth/me', config)
      .then((r) => r.data)
  }

  /** Renouvelle les tokens — utilisé par l'intercepteur du HttpClient */
  refresh(): Promise<void> {
    return this.http.post<ApiResponse<unknown>>('/auth/refresh').then(() => undefined)
  }

  logout(): Promise<void> {
    return this.http.post<ApiResponse<null>>('/auth/logout').then(() => undefined)
  }

  changePassword(payload: ChangePasswordPayload): Promise<string> {
    return this.http
      .patch<ApiResponse<null>>('/auth/change-password', payload)
      .then((r) => r.message)
  }
}
