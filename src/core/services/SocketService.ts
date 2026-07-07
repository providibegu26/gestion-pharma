/**
 * SocketService — WebSocket Socket.IO (notifications temps réel).
 * Événements : stock-alerte, commande-notification, file-attente, file-attente-stats
 */

import { io, type Socket } from 'socket.io-client'
import type {
  CommandeNotificationEvent,
  FileAttenteEvent,
  FileAttenteStats,
  StockAlerteEvent,
} from '../types'

export type SocketEventHandler<T> = (data: T) => void

export class SocketService {
  private socket: Socket | null = null

  connect(wsUrl: string): void {
    if (!wsUrl || this.socket?.connected) return
    this.disconnect()
    this.socket = io(wsUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    })
  }

  disconnect(): void {
    this.socket?.disconnect()
    this.socket = null
  }

  get connected(): boolean {
    return !!this.socket?.connected
  }

  onStockAlerte(handler: SocketEventHandler<StockAlerteEvent>): () => void {
    this.socket?.on('stock-alerte', handler)
    return () => this.socket?.off('stock-alerte', handler)
  }

  onCommandeNotification(handler: SocketEventHandler<CommandeNotificationEvent>): () => void {
    this.socket?.on('commande-notification', handler)
    return () => this.socket?.off('commande-notification', handler)
  }

  onFileAttente(handler: SocketEventHandler<FileAttenteEvent>): () => void {
    this.socket?.on('file-attente', handler)
    return () => this.socket?.off('file-attente', handler)
  }

  onFileAttenteStats(handler: SocketEventHandler<FileAttenteStats>): () => void {
    this.socket?.on('file-attente-stats', handler)
    return () => this.socket?.off('file-attente-stats', handler)
  }
}
