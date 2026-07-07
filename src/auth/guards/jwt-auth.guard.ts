/**
 * @file jwt-auth.guard.ts
 * @description Guard global qui vérifie la présence et la validité du JWT dans le
 *              cookie access_token. Court-circuite si la route est marquée @Public().
 * @module AuthModule
 *
 * RÔLE : Protéger toutes les routes par défaut. Seules les routes @Public() passent.
 * UTILISÉ PAR : AppModule (APP_GUARD global)
 * DÉPENDANCES : JwtStrategy, IS_PUBLIC_KEY decorator, Reflector
 * SUPPRESSION : Toutes les routes deviennent accessibles sans authentification
 */

import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  /**
   * @method canActivate
   * @description Vérifie si la requête peut passer. Court-circuite pour les routes publiques.
   * @param {ExecutionContext} context - Contexte d'exécution (accès à la requête)
   * @returns {boolean | Promise<boolean> | Observable<boolean>}
   * @throws {UnauthorizedException} Si le token est absent ou invalide
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Vérifie si la route ou le controller est marqué @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), // Cherche sur la méthode du controller
      context.getClass(),   // Cherche sur la classe du controller
    ]);

    // Si route publique, on laisse passer sans vérifier le token
    if (isPublic) {
      return true;
    }

    // Sinon, délègue à la stratégie 'jwt' (JwtStrategy) pour valider le cookie
    return super.canActivate(context);
  }

  /**
   * @method handleRequest
   * @description Gère le résultat de la validation JWT. Lance une exception si échec.
   * @param {unknown} err - Erreur de validation
   * @param {unknown} user - Payload JWT extrait si valide
   * @returns {unknown} Le payload utilisateur ou lève une exception
   * @throws {UnauthorizedException} Si token invalide ou expiré
   */
  handleRequest<TUser = unknown>(err: unknown, user: TUser): TUser {
    if (err || !user) {
      throw new UnauthorizedException(
        'Token d\'accès invalide ou expiré. Veuillez vous reconnecter.',
      );
    }
    return user;
  }
}
