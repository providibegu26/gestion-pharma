/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  useVentes — Hook React pour VentesService
 * ─────────────────────────────────────────────────────────────────────────────
 *  Caissier uniquement (`ventes.view` / `ventes.manage`).
 *
 *  list()      => GET  /ventes
 *  annuler()   => PATCH /ventes/:id/annuler
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useServices } from '../ServicesContext'

export const VENTES_KEY = ['ventes'] as const

export const useVentes = () => {
  const { ventes } = useServices()
  const qc = useQueryClient()

  const list = useQuery({
    queryKey: VENTES_KEY,
    queryFn: () => ventes.list(),
    staleTime: 30_000,
    retry: 1,
  })

  const annuler = useMutation({
    mutationFn: (id: string) => ventes.annuler(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: VENTES_KEY }),
  })

  return { list, annuler }
}
