import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useServices } from '../ServicesContext'
import { useAuth } from './useAuth'
import { toast } from '@/components/ui/Toast'
import { WS_URL } from '@/config/api'

/**
 * Branche les événements WebSocket backend (Socket.IO) sur l'UI.
 * Rafraîchit les caches React Query et affiche des toasts.
 */
export const useNotifications = () => {
  const { socket } = useServices()
  const { isAuthenticated } = useAuth()
  const qc = useQueryClient()

  useEffect(() => {
    if (!isAuthenticated) {
      socket.disconnect()
      return
    }

    const wsUrl = WS_URL
    if (wsUrl) socket.connect(wsUrl)

    const offStock = socket.onStockAlerte((data) => {
      toast.error(data.message || `Stock critique : ${data.nom}`)
      qc.invalidateQueries({ queryKey: ['stock'] })
      qc.invalidateQueries({ queryKey: ['medicaments'] })
    })

    const offCommande = socket.onCommandeNotification((data) => {
      toast.info(data.message || 'Mise à jour de commande')
      qc.invalidateQueries({ queryKey: ['commandes'] })
    })

    const offFile = socket.onFileAttente(() => {
      qc.invalidateQueries({ queryKey: ['file-attente'] })
    })

    const offFileStats = socket.onFileAttenteStats(() => {
      qc.invalidateQueries({ queryKey: ['file-attente'] })
    })

    return () => {
      offStock()
      offCommande()
      offFile()
      offFileStats()
    }
  }, [isAuthenticated, socket, qc])
}
