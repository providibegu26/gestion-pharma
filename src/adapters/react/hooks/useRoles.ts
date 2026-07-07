/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  useRoles — Hook React encapsulant le RolesService (/roles)
 * ─────────────────────────────────────────────────────────────────────────────
 *  Le backend n'expose pas encore /roles. En cas d'échec de la requête, le hook
 *  bascule sur un FALLBACK en lecture seule dérivé du registre core/permissions
 *  (les rôles "système"). L'UI reste ainsi fonctionnelle et informative.
 *
 *  Quand le backend fournira /roles, le CRUD deviendra automatiquement actif
 *  sans aucune modification de la page.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ROLE_REGISTRY,
  type CreateRolePayload,
  type ManagedRole,
  type RoleDefinition,
  type UpdateRolePayload,
} from '@/core'
import { useServices } from '../ServicesContext'

const ROLES_KEY = ['roles'] as const

/** Rôles "système" dérivés du registre (fallback lecture seule). */
const registryRoles = (): ManagedRole[] =>
  (Object.values(ROLE_REGISTRY) as RoleDefinition[])
    .filter((r) => !r.hidden)
    .map((r) => ({
      id: r.key,
      nom: r.key,
      label: r.label,
      description: r.description,
      permissions: r.permissions,
      systeme: true,
    }))

export const useRoles = () => {
  const qc = useQueryClient()
  const { roles } = useServices()

  const list = useQuery({
    queryKey: ROLES_KEY,
    queryFn: () => roles.list(),
    retry: false,
  })

  // Fallback : si la requête a échoué (404/route absente), on affiche les rôles
  // système du registre en lecture seule.
  const fallback = useMemo(() => registryRoles(), [])
  const isBackendAvailable = list.isSuccess
  const isReadOnly = list.isError
  const data: ManagedRole[] = list.data ?? (list.isError ? fallback : [])

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

  return { list, data, isBackendAvailable, isReadOnly, create, update, remove }
}
