/**
 * @file stock.module.ts
 * @description Module de gestion des stocks.
 * @module StockModule
 *
 * RÔLE : Encapsuler la gestion des niveaux de stock.
 * UTILISÉ PAR : AppModule
 * DÉPENDANCES : PrismaModule (global)
 * SUPPRESSION : Routes /stock/* inaccessibles
 */

import { Module } from '@nestjs/common';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [NotificationsModule, MailModule],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService],
})
export class StockModule {}
