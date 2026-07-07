/**
 * CommandesService — Commandes clients (framework-agnostic)
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

  /** Liste de toutes les commandes (PHARMACIEN, CAISSIER) */
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

  /** PHARMACIEN — valider (vérifie le stock, passe à PRETE ou REFUSEE) */
  valider(id: string): Promise<Commande> {
    return this.http
      .patch<ApiResponse<Commande>>(`/commandes/${id}/valider`)
      .then((r) => r.data)
  }

  /** PHARMACIEN — refuser avec justification */
  refuser(id: string, payload?: RefuserCommandePayload): Promise<Commande> {
    return this.http
      .patch<ApiResponse<Commande>>(`/commandes/${id}/refuser`, payload)
      .then((r) => r.data)
  }

  /** PHARMACIEN — marquer prête manuellement */
  marquerPrete(id: string): Promise<Commande> {
    return this.http
      .patch<ApiResponse<Commande>>(`/commandes/${id}/prete`)
      .then((r) => r.data)
  }

  /** CLIENT — annuler si EN_ATTENTE */
  annuler(id: string): Promise<Commande> {
    return this.http
      .patch<ApiResponse<Commande>>(`/commandes/${id}/annuler`)
      .then((r) => r.data)
  }

  /** PHARMACIEN, CAISSIER — consulter via code QR ou CMD-... */
  consulterParCode(code: string): Promise<Commande> {
    return this.http
      .post<ApiResponse<Commande>>('/commandes/code/consulter', { code })
      .then((r) => r.data)
  }

  /** PHARMACIEN — confirmer le retrait de tous les produits */
  retirerParCode(code: string): Promise<Commande> {
    return this.http
      .post<ApiResponse<Commande>>('/commandes/code/retirer', { code })
      .then((r) => r.data)
  }
}
