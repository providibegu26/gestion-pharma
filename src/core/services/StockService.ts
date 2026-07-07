/**
 * StockService — Endpoints `/stock`.
 */

import type { HttpClient } from '../http'
import type {
  ApiResponse,
  EnvoyerRapportPayload,
  EnvoyerRapportResult,
  RapportCommande,
  Stock,
  UpdateStockPayload,
} from '../types'

export class StockService {
  constructor(private readonly http: HttpClient) {}

  list(): Promise<Stock[]> {
    return this.http.get<ApiResponse<Stock[]>>('/stock').then((r) => r.data)
  }

  getAlertes(): Promise<Stock[]> {
    return this.http.get<ApiResponse<Stock[]>>('/stock/alertes').then((r) => r.data)
  }

  getRapportCommande(): Promise<RapportCommande> {
    return this.http.get<ApiResponse<RapportCommande>>('/stock/rapport-commande').then((r) => r.data)
  }

  envoyerRapportCommande(payload: EnvoyerRapportPayload): Promise<EnvoyerRapportResult> {
    return this.http
      .post<ApiResponse<EnvoyerRapportResult>>('/stock/rapport-commande/envoyer', payload)
      .then((r) => r.data)
  }

  getByMedicamentId(medicamentId: string): Promise<Stock> {
    return this.http.get<ApiResponse<Stock>>(`/stock/${medicamentId}`).then((r) => r.data)
  }

  update(medicamentId: string, payload: UpdateStockPayload): Promise<Stock> {
    return this.http.patch<ApiResponse<Stock>>(`/stock/${medicamentId}`, payload).then((r) => r.data)
  }
}

