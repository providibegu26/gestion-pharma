/**
 * @file patients.module.ts
 * @description Module de gestion des patients.
 * @module PatientsModule
 *
 * RÔLE : Encapsuler la gestion CRUD des patients.
 * UTILISÉ PAR : AppModule
 * DÉPENDANCES : PrismaModule (global)
 * SUPPRESSION : Routes /patients/* inaccessibles
 */

import { Module } from '@nestjs/common';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';

@Module({
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
