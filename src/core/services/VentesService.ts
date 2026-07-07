/**
 * VentesService — Endpoints `/ventes`.
 */

import type { HttpClient } from '../http'
import type {
  ApiResponse,
  CreateVentePayload,
  VenteCodeQr,
  VenteDetail,
} from '../types'

export class VentesService {
  constructor(private readonly http: HttpClient) {}

  list(): Promise<VenteDetail[]> {
    return this.http.get<ApiResponse<VenteDetail[]>>('/ventes').then((r) => r.data)
  }

  getById(id: string): Promise<VenteDetail> {
    return this.http.get<ApiResponse<VenteDetail>>(`/ventes/${id}`).then((r) => r.data)
  }

  create(payload: CreateVentePayload): Promise<VenteDetail> {
    return this.http.post<ApiResponse<VenteDetail>>('/ventes', payload).then((r) => r.data)
  }

  annuler(id: string): Promise<VenteDetail> {
    return this.http.patch<ApiResponse<VenteDetail>>(`/ventes/${id}/annuler`).then((r) => r.data)
  }

  /**
   * Télécharge le ticket PDF binaire de vente.
   * Le backend renvoie `application/pdf` (pas un JSON ApiResponse).
   */
  downloadTicket(id: string): Promise<Blob> {
    return this.http.get<Blob>(`/ventes/${id}/ticket`, { responseType: 'blob' })
  }

  /** Codes QR unitaires générés pour la vente (1 par unité vendue) */
  codesQr(id: string): Promise<VenteCodeQr[]> {
    return this.http
      .get<ApiResponse<VenteCodeQr[]>>(`/ventes/${id}/codes-qr`)
      .then((r) => r.data)
  }
}

