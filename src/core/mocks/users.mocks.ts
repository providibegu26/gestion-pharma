/**
 * Handlers mock pour le module Users — voir API_DOC.md §6.
 */

import { HttpError } from '../http/HttpError'
import type {
  ApiResponse,
  CreateStaffUserPayload,
  UpdateUserPayload,
  User,
} from '../types'
import { nowIso, uid, users } from './data'
import type { RegisterMockFn } from './types'

const ok = <T>(data: T, message = 'OK'): ApiResponse<T> => ({ success: true, data, message })

const findUser = (id: string): User | undefined => users.find((u) => u.id === id)

const notFound = (id: string): HttpError =>
  new HttpError({
    message: `Utilisateur ${id} introuvable.`,
    status: 404,
    url: `/users/${id}`,
  })

export const registerUsersMocks = (register: RegisterMockFn): void => {
  // GET /users
  register('GET', '/users', () => ok([...users], `${users.length} utilisateur(s) trouvé(s).`))

  // GET /users/:id
  register('GET', '/users/:id', ({ params }) => {
    const u = findUser(params[0])
    if (!u) throw notFound(params[0])
    return ok(u, 'Utilisateur récupéré.')
  })

  // POST /users
  register('POST', '/users', ({ body }) => {
    const payload = (body ?? {}) as CreateStaffUserPayload
    if (!payload.nom || !payload.prenom || !payload.email || !payload.role) {
      throw new HttpError({
        message: 'Tous les champs sont requis.',
        status: 400,
        url: '/users',
      })
    }
    if (payload.role === ('CLIENT' as unknown as typeof payload.role)) {
      throw new HttpError({
        message: 'Le rôle CLIENT ne peut être attribué via /users.',
        status: 400,
        url: '/users',
      })
    }
    if (users.some((u) => u.email.toLowerCase() === payload.email.toLowerCase())) {
      throw new HttpError({
        message: 'Cet email est déjà utilisé.',
        status: 409,
        url: '/users',
      })
    }
    const created: User = {
      id: uid('u'),
      nom: payload.nom,
      prenom: payload.prenom,
      email: payload.email,
      role: payload.role,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    users.push(created)
    return ok(created, `Compte créé. Les identifiants ont été envoyés à ${created.email}.`)
  })

  // PATCH /users/:id
  register('PATCH', '/users/:id', ({ params, body }) => {
    const u = findUser(params[0])
    if (!u) throw notFound(params[0])
    const patch = (body ?? {}) as UpdateUserPayload
    if (patch.email && users.some((x) => x.id !== u.id && x.email.toLowerCase() === patch.email!.toLowerCase())) {
      throw new HttpError({
        message: 'Cet email est déjà utilisé.',
        status: 409,
        url: `/users/${u.id}`,
      })
    }
    Object.assign(u, {
      nom:    patch.nom    ?? u.nom,
      prenom: patch.prenom ?? u.prenom,
      email:  patch.email  ?? u.email,
      role:   patch.role   ?? u.role,
      updatedAt: nowIso(),
    })
    return ok(u, 'Utilisateur mis à jour.')
  })

  // DELETE /users/:id
  register('DELETE', '/users/:id', ({ params }) => {
    const idx = users.findIndex((u) => u.id === params[0])
    if (idx === -1) throw notFound(params[0])
    users.splice(idx, 1)
    return ok(null, 'Utilisateur supprimé.')
  })
}
