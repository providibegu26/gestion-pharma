/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  MedicamentsService — Catalogue public des produits
 * ─────────────────────────────────────────────────────────────────────────────
 *  Endpoints API_DOC.md :
 *    - GET /medicaments
 *    - GET /medicaments/:id
 *
 *  Le backend expose ces routes en public, donc pas de rôle requis.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { HttpClient } from '../http'
import type {
  ApiResponse,
  CreateMedicamentPayload,
  Medicament,
  UpdateMedicamentPayload,
} from '../types'

export class MedicamentsService {
  constructor(private readonly http: HttpClient) {}

  list(): Promise<Medicament[]> {
    return this.http.get<ApiResponse<Medicament[]>>('/medicaments').then((r) => r.data)
  }

  getById(id: string): Promise<Medicament> {
    return this.http.get<ApiResponse<Medicament>>(`/medicaments/${id}`).then((r) => r.data)
  }

  create(payload: CreateMedicamentPayload): Promise<Medicament> {
    return this.http.post<ApiResponse<Medicament>>('/medicaments', payload).then((r) => r.data)
  }

  update(id: string, payload: UpdateMedicamentPayload): Promise<Medicament> {
    return this.http.patch<ApiResponse<Medicament>>(`/medicaments/${id}`, payload).then((r) => r.data)
  }

  remove(id: string): Promise<void> {
    return this.http.delete<ApiResponse<null>>(`/medicaments/${id}`).then(() => undefined)
  }
}

