import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useServices } from '../ServicesContext'
import type { TypeServiceFile } from '@/core'

const FILE_KEY = ['file-attente'] as const

export const useFileAttente = (typeService?: TypeServiceFile) => {
  const qc = useQueryClient()
  const { fileAttente } = useServices()

  const state = useQuery({
    queryKey: [...FILE_KEY, typeService ?? 'all'],
    queryFn: () => fileAttente.getState(typeService),
    refetchInterval: 10_000,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: FILE_KEY })

  const appelerSuivant = useMutation({
    mutationFn: () => fileAttente.appelerSuivant(typeService),
    onSuccess: invalidate,
  })

  const demarrer = useMutation({
    mutationFn: (id: string) => fileAttente.demarrer(id),
    onSuccess: invalidate,
  })

  const terminer = useMutation({
    mutationFn: (id: string) => fileAttente.terminer(id),
    onSuccess: invalidate,
  })

  const annuler = useMutation({
    mutationFn: (id: string) => fileAttente.annuler(id),
    onSuccess: invalidate,
  })

  const rejoindre = useMutation({
    mutationFn: () => fileAttente.rejoindre(typeService ? { typeService } : undefined),
    onSuccess: invalidate,
  })

  const refetch = () => state.refetch()

  return { state, appelerSuivant, demarrer, terminer, annuler, rejoindre, refetch }
}

export const useMaPositionFile = () => {
  const { fileAttente } = useServices()
  return useQuery({
    queryKey: ['file-attente', 'ma-position'],
    queryFn: () => fileAttente.getMaPosition(),
    refetchInterval: 15_000,
  })
}
