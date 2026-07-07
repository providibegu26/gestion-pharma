import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Limite le rôle ADMIN à la gestion des comptes (/api/users) et à l'auth.
 * Toutes les autres routes métier (ventes, stock, patients…) lui sont interdites.
 */
@Injectable()
export class AdminScopeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{
      user?: { role: Role };
      path: string;
    }>();

    const user = request.user;
    if (!user || user.role !== Role.ADMIN) return true;

    const path = request.path;
    const allowed =
      path.startsWith('/api/users') || path.startsWith('/api/auth');

    if (!allowed) {
      throw new ForbiddenException(
        'Le rôle ADMIN est limité à la création et la gestion des comptes utilisateurs.',
      );
    }

    return true;
  }
}
