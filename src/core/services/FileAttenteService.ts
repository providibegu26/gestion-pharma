/**
 * FileAttenteService — Endpoints `/file-attente` (API backend).
 */

import type { HttpClient } from '../http'
import type {
  ApiResponse,
  FileAttenteState,
  FileAttenteStats,
  RejoindreFilePayload,
  TicketFile,
  TypeServiceFile,
} from '../types'

const buildState = (tickets: TicketFile[], stats?: FileAttenteStats): FileAttenteState => ({
  tickets,
  enCours: tickets.find((t) => t.statut === 'EN_COURS' || t.statut === 'APPELE') ?? null,
  prochain: tickets.find((t) => t.statut === 'EN_ATTENTE') ?? null,
  stats,
})

export class FileAttenteService {
  constructor(private readonly http: HttpClient) {}

  /** Liste de la file du jour (staff) */
  list(typeService?: TypeServiceFile): Promise<TicketFile[]> {
    const params = typeService ? { typeService } : undefined
    return this.http.get<ApiResponse<TicketFile[]>>('/file-attente', { params }).then((r) => r.data)
  }

  /** Compteurs temps réel (staff) */
  getStats(): Promise<FileAttenteStats> {
    return this.http.get<ApiResponse<FileAttenteStats>>('/file-attente/stats').then((r) => r.data)
  }

  /** État composé pour l'UI (liste + stats) */
  async getState(typeService?: TypeServiceFile): Promise<FileAttenteState> {
    const [tickets, stats] = await Promise.all([
      this.list(typeService),
      this.getStats().catch(() => undefined),
    ])
    return buildState(tickets, stats)
  }

  /** CLIENT — rejoindre la file */
  rejoindre(payload?: RejoindreFilePayload): Promise<TicketFile> {
    return this.http
      .post<ApiResponse<TicketFile>>('/file-attente/rejoindre', payload ?? {})
      .then((r) => r.data)
  }

  /** CLIENT — position actuelle */
  getMaPosition(): Promise<TicketFile | null> {
    return this.http
      .get<ApiResponse<TicketFile | null>>('/file-attente/ma-position')
      .then((r) => r.data)
  }

  /** Staff — appeler automatiquement le ticket suivant */
  appelerSuivant(typeService?: TypeServiceFile): Promise<TicketFile> {
    return this.http
      .post<ApiResponse<TicketFile>>('/file-attente/appeler-suivant', typeService ? { typeService } : {})
      .then((r) => r.data)
  }

  /** Staff — démarrer le service d'un ticket */
  demarrer(id: string): Promise<TicketFile> {
    return this.http
      .patch<ApiResponse<TicketFile>>(`/file-attente/${id}/demarrer`)
      .then((r) => r.data)
  }

  /** Staff — terminer le service (+ appel auto du suivant côté backend) */
  terminer(id: string): Promise<TicketFile> {
    return this.http
      .patch<ApiResponse<TicketFile>>(`/file-attente/${id}/terminer`)
      .then((r) => r.data)
  }

  /** Client ou staff — annuler un ticket */
  annuler(id: string): Promise<TicketFile> {
    return this.http
      .patch<ApiResponse<TicketFile>>(`/file-attente/${id}/annuler`)
      .then((r) => r.data)
  }
}
