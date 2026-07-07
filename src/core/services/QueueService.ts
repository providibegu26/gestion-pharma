/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  QueueService — File d'attente automatique (endpoint /file-attente)
 * ─────────────────────────────────────────────────────────────────────────────
 *  Contrat backend RÉEL (voir DOCUMENTATION.md §17 / GUIDE_FRONTEND §13) :
 *    - GET   /file-attente?typeService=PHARMACIE|CAISSE   (staff — liste du jour)
 *    - GET   /file-attente/stats                          (staff — compteurs)
 *    - POST  /file-attente/appeler-suivant                (staff — appel auto suivant)
 *    - PATCH /file-attente/:id/demarrer                   (staff — démarrer service)
 *    - PATCH /file-attente/:id/terminer                   (staff — terminer + appel auto)
 *    - PATCH /file-attente/:id/annuler                    (staff/client — annuler ticket)
 *    - POST  /file-attente/rejoindre                      (client — rejoindre)
 *    - POST  /file-attente/rejoindre-public               (borne — sans compte)
 *    - GET   /file-attente/ma-position                    (client — sa position)
 *
 *  `useQueue` privilégie ces endpoints ; si le backend est indisponible, il bascule
 *  automatiquement sur `QueueStore` (simulation locale) pour rester démontrable.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { HttpClient } from '../http'
import type {
  ApiResponse,
  JoinQueuePayload,
  JoinQueuePublicPayload,
  QueuePosition,
  QueueStats,
  QueueTicket,
  TypeService,
} from '../types'

export class QueueService {
  constructor(private readonly http: HttpClient) {}

  /** Staff — liste des tickets du jour pour un guichet donné */
  list(typeService: TypeService): Promise<QueueTicket[]> {
    return this.http
      .get<ApiResponse<QueueTicket[]>>('/file-attente', { params: { typeService } })
      .then((r) => r.data)
  }

  /** Staff — compteurs temps réel des deux files */
  stats(): Promise<QueueStats> {
    return this.http.get<ApiResponse<QueueStats>>('/file-attente/stats').then((r) => r.data)
  }

  /** Staff — appeler automatiquement le prochain client */
  callNext(typeService: TypeService): Promise<QueueTicket | null> {
    return this.http
      .post<ApiResponse<QueueTicket | null>>('/file-attente/appeler-suivant', { typeService })
      .then((r) => r.data)
  }

  /** Staff — démarrer le service d'un ticket */
  start(id: string): Promise<QueueTicket> {
    return this.http
      .patch<ApiResponse<QueueTicket>>(`/file-attente/${id}/demarrer`)
      .then((r) => r.data)
  }

  /** Staff — terminer un service (déclenche l'appel automatique du suivant) */
  complete(id: string): Promise<QueueTicket> {
    return this.http
      .patch<ApiResponse<QueueTicket>>(`/file-attente/${id}/terminer`)
      .then((r) => r.data)
  }

  /** Staff ou client — annuler un ticket */
  cancel(id: string): Promise<QueueTicket> {
    return this.http
      .patch<ApiResponse<QueueTicket>>(`/file-attente/${id}/annuler`)
      .then((r) => r.data)
  }

  /** CLIENT connecté — rejoindre la file */
  join(payload: JoinQueuePayload): Promise<QueueTicket> {
    return this.http
      .post<ApiResponse<QueueTicket>>('/file-attente/rejoindre', payload)
      .then((r) => r.data)
  }

  /** Borne publique — rejoindre sans compte */
  joinPublic(payload: JoinQueuePublicPayload): Promise<QueueTicket> {
    return this.http
      .post<ApiResponse<QueueTicket>>('/file-attente/rejoindre-public', payload)
      .then((r) => r.data)
  }

  /** CLIENT — suivre sa position dans la file */
  myPosition(): Promise<QueuePosition> {
    return this.http
      .get<ApiResponse<QueuePosition>>('/file-attente/ma-position')
      .then((r) => r.data)
  }
}
