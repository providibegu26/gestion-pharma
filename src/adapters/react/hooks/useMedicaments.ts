/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  useMedicaments — Hook React encapsulant MedicamentsService
 * ─────────────────────────────────────────────────────────────────────────────
 *  Catalogue public :
 *   - list()    => GET /medicaments
 *   - getById() => GET /medicaments/:id
 *
 *  Le cache React Query évite les requêtes répétées lors de la navigation
 *  et améliore la fluidité de l'affichage du catalogue.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useQuery } from '@tanstack/react-query'
import { useServices } from '../ServicesContext'

const MEDICAMENTS_KEY = ['medicaments'] as const

export const useMedicaments = () => {
  const { medicaments } = useServices()
  const list = useQuery({
    queryKey: MEDICAMENTS_KEY,
    queryFn: () => medicaments.list(),
    staleTime: 5 * 60_000,
  })
  return { list }
}

export const useMedicament = (id: string | undefined) => {
  const { medicaments } = useServices()
  return useQuery({
    queryKey: ['medicaments', id],
    queryFn: () => medicaments.getById(id as string),
    enabled: !!id,
    staleTime: 5 * 60_000,
  })
}

