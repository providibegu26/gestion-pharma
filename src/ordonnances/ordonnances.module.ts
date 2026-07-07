/**
 * @file ordonnances.module.ts
 * @description Module de gestion des ordonnances médicales.
 * @module OrdonnancesModule
 *
 * RÔLE : Encapsuler la gestion du cycle de vie des ordonnances.
 * UTILISÉ PAR : AppModule
 * DÉPENDANCES : PrismaModule (global)
 * SUPPRESSION : Routes /ordonnances/* inaccessibles
 */

import { Module } from '@nestjs/common';
import { OrdonnancesController } from './ordonnances.controller';
import { OrdonnancesService } from './ordonnances.service';

@Module({
  controllers: [OrdonnancesController],
  providers: [OrdonnancesService],
  exports: [OrdonnancesService],
})
export class OrdonnancesModule {}
