/**
 * NotificationsService — endpoint REST de documentation WebSocket.
 */

import type { HttpClient } from '../http'
import type { ApiResponse } from '../types'

export interface NotificationEventsDoc {
  description?: string
  connexion?: unknown
  evenements?: unknown[]
  [key: string]: unknown
}

export class NotificationsService {
  constructor(private readonly http: HttpClient) {}

  getEventsContract(): Promise<NotificationEventsDoc> {
    return this.http
      .get<ApiResponse<NotificationEventsDoc>>('/notifications/events')
      .then((r) => r.data)
  }
}

