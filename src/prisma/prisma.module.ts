/**
 * @file prisma.module.ts
 * @description Module Prisma déclaré comme global (@Global). Tous les autres modules
 *              peuvent injecter PrismaService sans importer PrismaModule explicitement.
 * @module PrismaModule
 *
 * RÔLE : Rendre PrismaService disponible globalement dans toute l'application.
 * UTILISÉ PAR : AppModule (importé une seule fois)
 * DÉPENDANCES : PrismaService
 * SUPPRESSION : Chaque module devrait importer PrismaModule manuellement
 */

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global() rend ce module accessible partout sans réimportation
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Exporte pour que les autres modules puissent l'injecter
})
export class PrismaModule {}
