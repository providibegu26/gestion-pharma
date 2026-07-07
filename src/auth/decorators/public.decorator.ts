/**
 * @file public.decorator.ts
 * @description Décorateur @Public() qui marque une route comme accessible sans JWT.
 *              Utilisé par JwtAuthGuard pour court-circuiter la vérification du token.
 * @module AuthModule
 *
 * RÔLE : Permettre l'accès public à certaines routes (login, refresh).
 * UTILISÉ PAR : JwtAuthGuard (lit les métadonnées), AuthController (décore les routes)
 * DÉPENDANCES : @nestjs/common
 * SUPPRESSION : Impossible de marquer des routes comme publiques ; login/register bloqués
 */

import { SetMetadata } from '@nestjs/common';

/** Clé de métadonnée utilisée pour identifier les routes publiques */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * @decorator Public
 * @description Marque une route comme publique (pas de vérification JWT).
 * @example
 * @Public()
 * @Post('login')
 * login(@Body() dto: LoginDto) { ... }
 */
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_KEY, true);
