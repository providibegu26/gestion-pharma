/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  CodesQrService — Codes QR ventes unitaires (module /codes-qr)
 * ─────────────────────────────────────────────────────────────────────────────
 *  Système DISTINCT du QR commande : ici 1 code = 1 unité d'1 produit vendu.
 *  Payload : `PHARMACIE-CODE:PHARM-...` (vs `PHARMACIE-COMMANDE:CMD-...`).
 *    - POST /codes-qr/consulter  (prévisualiser — PHARMACIEN, CAISSIER)
 *    - POST /codes-qr/utiliser   (valider, usage unique — PHARMACIEN, CAISSIER)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { HttpClient } from '../http'
import type { ApiResponse, CodeQrInfo, CodeQrPayload, VenteCodeQr } from '../types'

export class CodesQrService {
  constructor(private readonly http: HttpClient) {}

  /** Prévisualiser un code QR vente (ne le consomme pas) */
  consulter(payload: CodeQrPayload): Promise<CodeQrInfo> {
    return this.http
      .post<ApiResponse<CodeQrInfo>>('/codes-qr/consulter', payload)
      .then((r) => r.data)
  }

  /** Valider un code QR vente (usage unique) */
  utiliser(payload: CodeQrPayload): Promise<VenteCodeQr> {
    return this.http
      .post<ApiResponse<VenteCodeQr>>('/codes-qr/utiliser', payload)
      .then((r) => r.data)
  }
}
