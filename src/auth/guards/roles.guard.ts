/**
 * @file roles.guard.ts
 * @description Guard global qui vérifie que le rôle de l'utilisateur connecté
 *              correspond aux rôles requis déclarés via @Roles() sur la route.
 * @module AuthModule
 *
 * RÔLE : Implémenter le contrôle d'accès basé sur les rôles (RBAC).
 * UTILISÉ PAR : AppModule (APP_GUARD global, exécuté après JwtAuthGuard)
 * DÉPENDANCES : ROLES_KEY decorator, Reflector, req.user (posé par JwtAuthGuard)
 * SUPPRESSION : N'importe quel utilisateur authentifié accède à toutes les routes
 */

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

/** Structure du payload JWT posé dans req.user par JwtStrategy */
interface JwtUser {
  sub: string;
  email: string;
  role: Role;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * @method canActivate
   * @description Vérifie que req.user.role est inclus dans les rôles @Roles() de la route.
   * @param {ExecutionContext} context - Contexte d'exécution
   * @returns {boolean} true si autorisé
   * @throws {ForbiddenException} Si le rôle ne correspond pas
   */
  canActivate(context: ExecutionContext): boolean {
    // Récupère les rôles requis depuis les métadonnées @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si aucun @Roles() sur la route, elle est accessible à tous les authentifiés
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Récupère l'utilisateur connecté posé par JwtAuthGuard
    const request = context.switchToHttp().getRequest<{ user: JwtUser }>();
    const user = request.user;

    // Vérifie que le rôle de l'utilisateur est dans la liste des rôles autorisés
    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Accès refusé. Rôle requis : ${requiredRoles.join(' ou ')}. Votre rôle : ${user.role}`,
      );
    }

    return true;
  }
}
