/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  CommandesService — Commandes clients (framework-agnostic)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { HttpClient } from '../http'
import type {
  ApiResponse,
  Commande,
  CommandeCodeInfo,
  CommandeCodePayload,
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

  /**
   * PHARMACIEN — valider : vérifie le stock.
   * Stock OK → PRETE (stock déduit) ; stock insuffisant → REFUSEE automatique
   * (`refuseAutomatique: true` + `motifRefus` système).
   */
  valider(id: string): Promise<Commande> {
    return this.http
      .patch<ApiResponse<Commande>>(`/commandes/${id}/valider`)
      .then((r) => r.data)
  }

  /** PHARMACIEN — refuser avec justification visible par le client (min. 5 caractères) */
  refuser(id: string, payload: RefuserCommandePayload): Promise<Commande> {
    return this.http
      .patch<ApiResponse<Commande>>(`/commandes/${id}/refuser`, payload)
      .then((r) => r.data)
  }

  /** PHARMACIEN — marquer explicitement une commande comme prête */
  marquerPrete(id: string): Promise<Commande> {
    return this.http
      .patch<ApiResponse<Commande>>(`/commandes/${id}/prete`)
      .then((r) => r.data)
  }

  /** CLIENT — annuler sa commande (uniquement si EN_ATTENTE) */
  annuler(id: string): Promise<Commande> {
    return this.http
      .patch<ApiResponse<Commande>>(`/commandes/${id}/annuler`)
      .then((r) => r.data)
  }

  /** PHARMACIEN / CAISSIER — consulter une commande via son code/QR de retrait */
  consulterCode(payload: CommandeCodePayload): Promise<CommandeCodeInfo> {
    return this.http
      .post<ApiResponse<CommandeCodeInfo>>('/commandes/code/consulter', payload)
      .then((r) => r.data)
  }

  /** PHARMACIEN — confirmer le retrait (tous les produits validés d'un coup → RETIREE) */
  retirerCode(payload: CommandeCodePayload): Promise<Commande> {
    return this.http
      .post<ApiResponse<Commande>>('/commandes/code/retirer', payload)
      .then((r) => r.data)
  }
}
