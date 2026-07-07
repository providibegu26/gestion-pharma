/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  RealtimeBridge — Passerelle WebSocket temps réel (Socket.IO)
 * ─────────────────────────────────────────────────────────────────────────────
 *  Écoute les événements documentés (GUIDE_FRONTEND §14 / DOCUMENTATION §18) et
 *  synchronise l'UI :
 *    - `stock-alerte`         → toast pharmacien + invalidation catalogue/stock
 *    - `commande-notification`→ toast client/pharmacien + invalidation commandes
 *    - `file-attente`         → invalidation de la file
 *    - `file-attente-stats`   → invalidation des compteurs
 *
 *  Robuste par conception : si `wsUrl` est vide ou le serveur injoignable, la
 *  connexion échoue silencieusement (reconnexions limitées) sans impacter l'app.
 *  Monté une seule fois dans l'espace authentifié (AdminLayout).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect } from 'react'
import { io, type Socket } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth, useServices } from '@/adapters/react'
import { toast } from '@/components/ui/Toast'

interface StockAlertePayload { message?: string; nom?: string }
interface CommandeNotifPayload { type?: string; message?: string; automatique?: boolean }

export const RealtimeBridge = () => {
  const { wsUrl } = useServices()
  const { isAuthenticated } = useAuth()
  const qc = useQueryClient()

  useEffect(() => {
    if (!wsUrl || !isAuthenticated) return

    let socket: Socket | null = null
    try {
      socket = io(wsUrl, {
        transports: ['websocket'],
        withCredentials: true,
        reconnectionAttempts: 3,
        timeout: 8000,
        autoConnect: true,
      })
    } catch {
      return // socket.io indisponible : temps réel désactivé, l'app reste fonctionnelle
    }

    const invalidate = (key: string) => qc.invalidateQueries({ queryKey: [key] })

    socket.on('stock-alerte', (data: StockAlertePayload) => {
      toast.warning(data?.message ?? `Stock critique : ${data?.nom ?? 'un médicament'}`)
      invalidate('medicaments')
      invalidate('stock')
    })

    socket.on('commande-notification', (data: CommandeNotifPayload) => {
      const msg = data?.message ?? 'Mise à jour d\'une commande'
      if (data?.type === 'refusee') toast.error(msg)
      else toast.success(msg)
      invalidate('commandes')
    })

    socket.on('file-attente', () => {
      invalidate('file-attente')
      invalidate('file-attente-stats')
    })

    socket.on('file-attente-stats', () => invalidate('file-attente-stats'))

    // Les erreurs de connexion sont des événements (pas des exceptions) → on ignore.
    socket.on('connect_error', () => { /* silencieux : repli sur polling/local */ })

    return () => { socket?.disconnect() }
  }, [wsUrl, isAuthenticated, qc])

  return null
}
