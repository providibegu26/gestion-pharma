/**
 * @file auth.module.ts
 * @description Module d'authentification. Déclare les stratégies Passport, configure
 *              JwtModule et expose AuthService.
 * @module AuthModule
 *
 * RÔLE : Encapsuler toute la logique d'authentification JWT.
 * UTILISÉ PAR : AppModule
 * DÉPENDANCES : PassportModule, JwtModule, PrismaModule (global), ConfigModule (global)
 * SUPPRESSION : Aucune authentification dans l'application
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // JwtModule sans configuration globale : chaque signAsync spécifie son propre secret
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,         // Stratégie pour les access tokens
    JwtRefreshStrategy,  // Stratégie pour les refresh tokens
  ],
  exports: [AuthService],
})
export class AuthModule {}
