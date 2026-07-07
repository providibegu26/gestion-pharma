/**
 * OrdonnancesService — Endpoints `/ordonnances`.
 */

import type { HttpClient } from '../http'
import type {
  ApiResponse,
  CreateOrdonnancePayload,
  Ordonnance,
  UpdateOrdonnancePayload,
} from '../types'

export class OrdonnancesService {
  constructor(private readonly http: HttpClient) {}

  list(): Promise<Ordonnance[]> {
    return this.http.get<ApiResponse<Ordonnance[]>>('/ordonnances').then((r) => r.data)
  }

  getById(id: string): Promise<Ordonnance> {
    return this.http.get<ApiResponse<Ordonnance>>(`/ordonnances/${id}`).then((r) => r.data)
  }

  create(payload: CreateOrdonnancePayload): Promise<Ordonnance> {
    return this.http.post<ApiResponse<Ordonnance>>('/ordonnances', payload).then((r) => r.data)
  }

  update(id: string, payload: UpdateOrdonnancePayload): Promise<Ordonnance> {
    return this.http.patch<ApiResponse<Ordonnance>>(`/ordonnances/${id}`, payload).then((r) => r.data)
  }

  valider(id: string): Promise<Ordonnance> {
    return this.http.patch<ApiResponse<Ordonnance>>(`/ordonnances/${id}/valider`).then((r) => r.data)
  }

  refuser(id: string): Promise<Ordonnance> {
    return this.http.patch<ApiResponse<Ordonnance>>(`/ordonnances/${id}/refuser`).then((r) => r.data)
  }
}

