/**
 * @file prisma.service.ts
 * @description Service Prisma qui étend PrismaClient. Gère la connexion/déconnexion
 *              à PostgreSQL et est injecté dans tous les services métier.
 * @module PrismaModule
 *
 * RÔLE : Singleton de connexion à la base de données. Point d'accès unique à Prisma.
 * UTILISÉ PAR : Tous les services (AuthService, UsersService, VentesService, etc.)
 * DÉPENDANCES : @prisma/client, @prisma/adapter-pg
 * SUPPRESSION : Plus aucun accès à la base de données dans toute l'application
 *
 * NOTE PRISMA 7 : Depuis Prisma 7, PrismaClient nécessite obligatoirement un driver
 * adapter. On utilise @prisma/adapter-pg qui accepte directement la connection string.
 */

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // PrismaPg accepte directement la connection string PostgreSQL (Prisma 7)
    const adapter = new PrismaPg(process.env.DATABASE_URL as string);

    // Passe l'adapter à PrismaClient (obligatoire depuis Prisma 7)
    super({ adapter });
  }

  /**
   * @method onModuleInit
   * @description Établit la connexion à PostgreSQL quand le module NestJS est initialisé
   * @returns {Promise<void>}
   */
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  /**
   * @method onModuleDestroy
   * @description Ferme proprement la connexion quand l'application s'arrête
   * @returns {Promise<void>}
   */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
