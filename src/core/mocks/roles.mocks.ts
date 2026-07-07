/**
 * Handlers mock pour le module Rôles
 */

import { HttpError } from '../http/HttpError'
import type {
  ApiResponse,
  AssignRolePayload,
  CreateRolePayload,
  PermissionCode,
  Role,
  RoleDefinition,
  UpdateRolePayload,
} from '../types'
import { roles, users, uid, nowIso } from './data'
import type { RegisterMockFn } from './types'

const ok = <T>(data: T, message = 'OK'): ApiResponse<T> => ({ success: true, data, message })

const SYSTEM_CODES: Role[] = ['ADMIN', 'PHARMACIEN', 'PREPARATEUR', 'CAISSIER', 'CLIENT']

const countUsersForRole = (code: string): number =>
  users.filter((u) => u.role === code).length

const enrich = (r: RoleDefinition): RoleDefinition => ({
  ...r,
  userCount: countUsersForRole(r.code),
})

export const registerRolesMocks = (register: RegisterMockFn): void => {
  register('GET', '/roles', () =>
    ok(roles.map(enrich), `${roles.length} rôle(s) trouvé(s).`),
  )

  register('GET', '/roles/:id', ({ params }) => {
    const r = roles.find((x) => x.id === params[0])
    if (!r) throw new HttpError({ message: 'Rôle introuvable.', status: 404, url: `/roles/${params[0]}` })
    return ok(enrich(r), 'Rôle récupéré.')
  })

  register('POST', '/roles', ({ body }) => {
    const payload = (body ?? {}) as CreateRolePayload
    if (!payload.code?.trim() || !payload.label?.trim()) {
      throw new HttpError({ message: 'Code et libellé requis.', status: 400, url: '/roles' })
    }
    const code = payload.code.trim().toUpperCase()
    if (SYSTEM_CODES.includes(code as Role) || roles.some((r) => r.code === code)) {
      throw new HttpError({ message: 'Ce code de rôle existe déjà.', status: 409, url: '/roles' })
    }
    const created: RoleDefinition = {
      id: uid('role'),
      code,
      label: payload.label.trim(),
      description: payload.description?.trim() ?? null,
      permissions: (payload.permissions ?? []) as PermissionCode[],
      isSystem: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    roles.push(created)
    return ok(enrich(created), 'Rôle créé.')
  })

  register('PATCH', '/roles/:id', ({ params, body }) => {
    const r = roles.find((x) => x.id === params[0])
    if (!r) throw new HttpError({ message: 'Rôle introuvable.', status: 404, url: `/roles/${params[0]}` })
    if (r.isSystem) {
      throw new HttpError({ message: 'Les rôles système ne peuvent pas être modifiés.', status: 403, url: `/roles/${params[0]}` })
    }
    const payload = (body ?? {}) as UpdateRolePayload
    if (payload.label !== undefined) r.label = payload.label.trim()
    if (payload.description !== undefined) r.description = payload.description?.trim() ?? null
    if (payload.permissions !== undefined) r.permissions = payload.permissions
    r.updatedAt = nowIso()
    return ok(enrich(r), 'Rôle mis à jour.')
  })

  register('DELETE', '/roles/:id', ({ params }) => {
    const idx = roles.findIndex((x) => x.id === params[0])
    if (idx === -1) throw new HttpError({ message: 'Rôle introuvable.', status: 404, url: `/roles/${params[0]}` })
    const r = roles[idx]
    if (r.isSystem) {
      throw new HttpError({ message: 'Les rôles système ne peuvent pas être supprimés.', status: 403, url: `/roles/${params[0]}` })
    }
    if (countUsersForRole(r.code) > 0) {
      throw new HttpError({ message: 'Ce rôle est encore attribué à des utilisateurs.', status: 409, url: `/roles/${params[0]}` })
    }
    roles.splice(idx, 1)
    return ok(null, 'Rôle supprimé.')
  })

  register('PATCH', '/users/:id/role', ({ params, body }) => {
    const u = users.find((x) => x.id === params[0])
    if (!u) throw new HttpError({ message: 'Utilisateur introuvable.', status: 404, url: `/users/${params[0]}/role` })
    const payload = (body ?? {}) as AssignRolePayload
    if (!payload.role) {
      throw new HttpError({ message: 'Rôle requis.', status: 400, url: `/users/${params[0]}/role` })
    }
    u.role = payload.role
    u.updatedAt = nowIso()
    return ok(u, 'Rôle attribué.')
  })
}
