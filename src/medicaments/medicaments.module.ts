/**
 * @file medicaments.module.ts
 * @description Module du catalogue des médicaments.
 * @module MedicamentsModule
 *
 * RÔLE : Encapsuler la gestion CRUD des médicaments.
 * UTILISÉ PAR : AppModule
 * DÉPENDANCES : PrismaModule (global)
 * SUPPRESSION : Routes /medicaments/* inaccessibles
 */

import { Module } from '@nestjs/common';
import { MedicamentsController } from './medicaments.controller';
import { MedicamentsService } from './medicaments.service';

@Module({
  controllers: [MedicamentsController],
  providers: [MedicamentsService],
  exports: [MedicamentsService],
})
export class MedicamentsModule {}
