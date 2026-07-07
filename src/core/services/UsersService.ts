/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  UsersService — Gestion des comptes staff (framework-agnostic)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { HttpClient } from '../http'
import type {
  ApiResponse,
  CreateStaffUserPayload,
  UpdateUserPayload,
  User,
} from '../types'

export class UsersService {
  constructor(private readonly http: HttpClient) {}

  list(): Promise<User[]> {
    return this.http.get<ApiResponse<User[]>>('/users').then((r) => r.data)
  }

  getById(id: string): Promise<User> {
    return this.http.get<ApiResponse<User>>(`/users/${id}`).then((r) => r.data)
  }

  /** Création d'un compte staff — mot de passe généré et envoyé par email */
  create(payload: CreateStaffUserPayload): Promise<{ user: User; message: string }> {
    return this.http
      .post<ApiResponse<User>>('/users', payload)
      .then((r) => ({ user: r.data, message: r.message }))
  }

  update(id: string, payload: UpdateUserPayload): Promise<User> {
    return this.http
      .patch<ApiResponse<User>>(`/users/${id}`, payload)
      .then((r) => r.data)
  }

  remove(id: string): Promise<void> {
    return this.http.delete<ApiResponse<null>>(`/users/${id}`).then(() => undefined)
  }
}
