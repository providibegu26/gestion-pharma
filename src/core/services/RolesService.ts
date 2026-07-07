/**
 * RolesService — Gestion des rôles dynamiques (framework-agnostic)
 */

import type { HttpClient } from '../http'
import type {
  ApiResponse,
  AssignRolePayload,
  CreateRolePayload,
  RoleDefinition,
  UpdateRolePayload,
  User,
} from '../types'

export class RolesService {
  constructor(private readonly http: HttpClient) {}

  list(): Promise<RoleDefinition[]> {
    return this.http.get<ApiResponse<RoleDefinition[]>>('/roles').then((r) => r.data)
  }

  getById(id: string): Promise<RoleDefinition> {
    return this.http.get<ApiResponse<RoleDefinition>>(`/roles/${id}`).then((r) => r.data)
  }

  create(payload: CreateRolePayload): Promise<RoleDefinition> {
    return this.http.post<ApiResponse<RoleDefinition>>('/roles', payload).then((r) => r.data)
  }

  update(id: string, payload: UpdateRolePayload): Promise<RoleDefinition> {
    return this.http
      .patch<ApiResponse<RoleDefinition>>(`/roles/${id}`, payload)
      .then((r) => r.data)
  }

  remove(id: string): Promise<void> {
    return this.http.delete<ApiResponse<null>>(`/roles/${id}`).then(() => undefined)
  }

  assignToUser(userId: string, payload: AssignRolePayload): Promise<User> {
    return this.http
      .patch<ApiResponse<User>>(`/users/${userId}/role`, payload)
      .then((r) => r.data)
  }
}
