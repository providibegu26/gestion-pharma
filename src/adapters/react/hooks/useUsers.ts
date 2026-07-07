/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  useUsers — Hook React encapsulant le UsersService
 * ─────────────────────────────────────────────────────────────────────────────
 *  Expose les opérations CRUD sur le personnel via React Query :
 *    - `list`            : useQuery sur GET /users
 *    - `getById(id)`     : useQuery sur GET /users/:id
 *    - `create`          : useMutation sur POST /users
 *    - `update`          : useMutation sur PATCH /users/:id
 *    - `remove`          : useMutation sur DELETE /users/:id
 *
 *  Aucune logique HTTP ici — tout passe par UsersService (core/services).
 *  Pour migrer vers Angular/Vue : réécrire CE fichier en gardant le service.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CreateStaffUserPayload,
  UpdateUserPayload,
} from '@/core'
import { useServices } from '../ServicesContext'

const USERS_KEY = ['users'] as const

export const useUsers = () => {
  const qc = useQueryClient()
  const { users } = useServices()

  const list = useQuery({
    queryKey: USERS_KEY,
    queryFn: () => users.list(),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: USERS_KEY })

  const create = useMutation({
    mutationFn: (payload: CreateStaffUserPayload) => users.create(payload),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserPayload }) => users.update(id, data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => users.remove(id),
    onSuccess: invalidate,
  })

  return { list, create, update, remove }
}

export const useUser = (id: string | undefined) => {
  const { users } = useServices()
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => users.getById(id as string),
    enabled: !!id,
  })
}
