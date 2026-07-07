/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  useCommandes — Hook React encapsulant le CommandesService
 * ─────────────────────────────────────────────────────────────────────────────
 *  - `list` choisit automatiquement `listMine` (CLIENT) vs `listAll` (staff)
 *  - `create`  : POST /commandes (CLIENT)
 *  - `valider` : PATCH /commandes/:id/valider (staff)
 *  - `refuser` : PATCH /commandes/:id/refuser (staff)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateCommandePayload, RefuserCommandePayload } from '@/core'
import { useServices } from '../ServicesContext'
import { useAuth } from './useAuth'

const COMMANDES_KEY = ['commandes'] as const

export const useCommandes = () => {
  const qc = useQueryClient()
  const { commandes } = useServices()
  const { isClient } = useAuth()
  const isClientUser = isClient()

  const list = useQuery({
    queryKey: [...COMMANDES_KEY, isClientUser ? 'mine' : 'all'],
    queryFn: () => (isClientUser ? commandes.listMine() : commandes.listAll()),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: COMMANDES_KEY })

  const create = useMutation({
    mutationFn: (payload: CreateCommandePayload) => commandes.create(payload),
    onSuccess: invalidate,
  })

  const valider = useMutation({
    mutationFn: (id: string) => commandes.valider(id),
    onSuccess: invalidate,
  })

  const refuser = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RefuserCommandePayload }) => commandes.refuser(id, data),
    onSuccess: invalidate,
  })

  return { list, create, valider, refuser, isClientUser }
}

export const useCommande = (id: string | undefined) => {
  const { commandes } = useServices()
  return useQuery({
    queryKey: ['commandes', id],
    queryFn: () => commandes.getById(id as string),
    enabled: !!id,
  })
}
