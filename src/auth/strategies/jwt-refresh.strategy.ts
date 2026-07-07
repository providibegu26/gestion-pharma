/**
 * @file jwt-refresh.strategy.ts
 * @description Stratégie Passport dédiée aux refresh tokens. Extrait le JWT du
 *              cookie 'refresh_token', vérifie avec JWT_REFRESH_SECRET, et valide
 *              que le token haché correspond à celui en base de données.
 * @module AuthModule
 *
 * RÔLE : Valider les refresh tokens et permettre le renouvellement des access tokens.
 * UTILISÉ PAR : AuthController (route /auth/refresh via @UseGuards(JwtRefreshGuard))
 * DÉPENDANCES : ConfigService (JWT_REFRESH_SECRET), PrismaService, bcrypt
 * SUPPRESSION : Le renouvellement silencieux des tokens ne fonctionne plus
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { Request } from 'express';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      // Extrait depuis le cookie HTTP-only 'refresh_token' (différent de 'access_token')
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request): string | null => {
          return (request?.cookies as Record<string, string>)?.refresh_token ?? null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    } as StrategyOptionsWithRequest);
  }

  /**
   * @method validate
   * @description Vérifie que le refresh token brut correspond au hash stocké en BDD.
   *              Protection contre le vol de refresh token après compromission de la DB.
   * @param {Request} request - Requête Express (pour extraire le token brut du cookie)
   * @param {JwtPayload} payload - Payload décodé du JWT
   * @returns {Promise<{ sub: string; email: string; role: string; refreshToken: string }>}
   * @throws {UnauthorizedException} Si token invalide ou ne correspond pas au hash en BDD
   */
  async validate(
    request: Request,
    payload: JwtPayload,
  ): Promise<{ sub: string; email: string; role: string; refreshToken: string }> {
    // Extrait le token brut du cookie pour comparaison avec le hash en BDD
    const refreshTokenRaw =
      (request?.cookies as Record<string, string>)?.refresh_token ?? null;

    if (!refreshTokenRaw) {
      throw new UnauthorizedException('Refresh token absent.');
    }

    // Récupère l'utilisateur et son refresh token haché
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, refreshToken: true },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException(
        'Session expirée. Veuillez vous reconnecter.',
      );
    }

    // Compare le token brut au hash stocké (protection contre compromission DB)
    const tokenMatches = await bcrypt.compare(refreshTokenRaw, user.refreshToken);

    if (!tokenMatches) {
      throw new UnauthorizedException(
        'Refresh token invalide. Veuillez vous reconnecter.',
      );
    }

    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      refreshToken: refreshTokenRaw,
    };
  }
}
