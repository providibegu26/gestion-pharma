/**
 * @file jwt.strategy.ts
 * @description Stratégie Passport JWT pour les access tokens. Extrait le JWT du
 *              cookie 'access_token', le vérifie avec JWT_SECRET, et place le
 *              payload dans req.user.
 * @module AuthModule
 *
 * RÔLE : Valider les access tokens JWT extraits des cookies HTTP-only.
 * UTILISÉ PAR : JwtAuthGuard (via AuthGuard('jwt'))
 * DÉPENDANCES : ConfigService (JWT_SECRET), cookie 'access_token'
 * SUPPRESSION : JwtAuthGuard ne sait plus comment valider un token
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

/** Structure du payload encodé dans le JWT */
export interface JwtPayload {
  sub: string;   // ID utilisateur (subject)
  email: string;
  role: string;
  iat?: number;  // Issued at (généré automatiquement)
  exp?: number;  // Expiration (généré automatiquement)
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      // Extrait le token depuis le cookie HTTP-only 'access_token'
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request): string | null => {
          // Lit le cookie access_token (posé lors du login)
          return (request?.cookies as Record<string, string>)?.access_token ?? null;
        },
      ]),
      ignoreExpiration: false, // Rejette les tokens expirés
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * @method validate
   * @description Appelé après vérification de la signature JWT. Vérifie que l'utilisateur
   *              existe toujours en base. Retourne l'objet posé dans req.user.
   * @param {JwtPayload} payload - Payload décodé du JWT
   * @returns {Promise<{ sub: string; email: string; role: string }>} Données utilisateur
   * @throws {UnauthorizedException} Si l'utilisateur n'existe plus en base
   */
  async validate(payload: JwtPayload): Promise<{ sub: string; email: string; role: string }> {
    // Vérifie que l'utilisateur existe encore (sécurité : compte supprimé ou désactivé)
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable. Veuillez vous reconnecter.');
    }

    // Ce retour est posé dans req.user pour toute la suite de la requête
    return { sub: user.id, email: user.email, role: user.role };
  }
}
