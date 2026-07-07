/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  RolesService — Gestion dynamique des rôles (endpoint /roles)
 * ─────────────────────────────────────────────────────────────────────────────
 *  Appels API PRÉPARÉS pour une future gestion serveur des rôles :
 *    - GET    /roles
 *    - GET    /roles/:id
 *    - POST   /roles
 *    - PATCH  /roles/:id
 *    - DELETE /roles/:id
 *
 *  Le backend actuel n'expose PAS encore ces routes (rôles = enum fixe).
 *  Tant qu'elles sont absentes, la couche React (`useRoles`) bascule sur un
 *  fallback en lecture seule dérivé du registre `core/permissions`.
 *  L'attribution d'un rôle à un utilisateur reste, elle, 100% fonctionnelle
 *  via `UsersService` (PATCH /users/:id).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { HttpClient } from '../http'
import type {
  ApiResponse,
  CreateRolePayload,
  ManagedRole,
  UpdateRolePayload,
} from '../types'

export class RolesService {
  constructor(private readonly http: HttpClient) {}

  list(): Promise<ManagedRole[]> {
    return this.http.get<ApiResponse<ManagedRole[]>>('/roles').then((r) => r.data)
  }

  getById(id: string): Promise<ManagedRole> {
    return this.http.get<ApiResponse<ManagedRole>>(`/roles/${id}`).then((r) => r.data)
  }

  create(payload: CreateRolePayload): Promise<ManagedRole> {
    return this.http.post<ApiResponse<ManagedRole>>('/roles', payload).then((r) => r.data)
  }

  update(id: string, payload: UpdateRolePayload): Promise<ManagedRole> {
    return this.http.patch<ApiResponse<ManagedRole>>(`/roles/${id}`, payload).then((r) => r.data)
  }

  remove(id: string): Promise<void> {
    return this.http.delete<ApiResponse<null>>(`/roles/${id}`).then(() => undefined)
  }
}
