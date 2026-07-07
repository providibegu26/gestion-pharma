/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  CommandesService — Commandes clients (framework-agnostic)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { HttpClient } from '../http'
import type {
  ApiResponse,
  Commande,
  CreateCommandePayload,
  RefuserCommandePayload,
} from '../types'

export class CommandesService {
  constructor(private readonly http: HttpClient) {}

  /** Liste de toutes les commandes (staff) */
  listAll(): Promise<Commande[]> {
    return this.http.get<ApiResponse<Commande[]>>('/commandes').then((r) => r.data)
  }

  /** Liste des commandes du client connecté */
  listMine(): Promise<Commande[]> {
    return this.http
      .get<ApiResponse<Commande[]>>('/commandes/mes-commandes')
      .then((r) => r.data)
  }

  getById(id: string): Promise<Commande> {
    return this.http
      .get<ApiResponse<Commande>>(`/commandes/${id}`)
      .then((r) => r.data)
  }

  /** CLIENT — passer une commande */
  create(payload: CreateCommandePayload): Promise<Commande> {
    return this.http
      .post<ApiResponse<Commande>>('/commandes', payload)
      .then((r) => r.data)
  }

  /** PHARMACIEN — valider */
  valider(id: string): Promise<Commande> {
    return this.http
      .patch<ApiResponse<Commande>>(`/commandes/${id}/valider`)
      .then((r) => r.data)
  }

  /** PHARMACIEN — refuser avec justification visible par le client */
  refuser(id: string, payload?: RefuserCommandePayload): Promise<Commande> {
    return this.http
      .patch<ApiResponse<Commande>>(`/commandes/${id}/refuser`, payload)
      .then((r) => r.data)
  }
}
