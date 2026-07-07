/**
 * FournisseursService — Endpoints `/fournisseurs`.
 */

import type { HttpClient } from '../http'
import type {
  ApiResponse,
  CreateFournisseurPayload,
  Fournisseur,
  UpdateFournisseurPayload,
} from '../types'

export class FournisseursService {
  constructor(private readonly http: HttpClient) {}

  list(): Promise<Fournisseur[]> {
    return this.http.get<ApiResponse<Fournisseur[]>>('/fournisseurs').then((r) => r.data)
  }

  getById(id: string): Promise<Fournisseur> {
    return this.http.get<ApiResponse<Fournisseur>>(`/fournisseurs/${id}`).then((r) => r.data)
  }

  create(payload: CreateFournisseurPayload): Promise<Fournisseur> {
    return this.http.post<ApiResponse<Fournisseur>>('/fournisseurs', payload).then((r) => r.data)
  }

  update(id: string, payload: UpdateFournisseurPayload): Promise<Fournisseur> {
    return this.http.patch<ApiResponse<Fournisseur>>(`/fournisseurs/${id}`, payload).then((r) => r.data)
  }

  remove(id: string): Promise<void> {
    return this.http.delete<ApiResponse<null>>(`/fournisseurs/${id}`).then(() => undefined)
  }
}

