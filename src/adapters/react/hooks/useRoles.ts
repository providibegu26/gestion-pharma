import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AssignRolePayload, CreateRolePayload, UpdateRolePayload } from '@/core'
import { useServices } from '../ServicesContext'

const ROLES_KEY = ['roles'] as const

interface UseRolesOptions {
  enabled?: boolean
}

export const useRoles = (opts: UseRolesOptions = {}) => {
  const qc = useQueryClient()
  const { roles } = useServices()
  const enabled = opts.enabled ?? true

  const list = useQuery({
    queryKey: ROLES_KEY,
    queryFn: () => roles.list(),
    enabled,
    staleTime: 60_000,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ROLES_KEY })

  const create = useMutation({
    mutationFn: (payload: CreateRolePayload) => roles.create(payload),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRolePayload }) => roles.update(id, data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => roles.remove(id),
    onSuccess: invalidate,
  })

  const assignToUser = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: AssignRolePayload }) =>
      roles.assignToUser(userId, data),
    onSuccess: () => {
      invalidate()
      qc.invalidateQueries({ queryKey: ['users'] })
    },
  })

  return { list, create, update, remove, assignToUser }
}

export const useRole = (id: string | undefined) => {
  const { roles } = useServices()
  return useQuery({
    queryKey: ['roles', id],
    queryFn: () => roles.getById(id as string),
    enabled: !!id,
  })
}
