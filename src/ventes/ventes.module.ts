/**
 * @file ventes.module.ts
 * @description Module du processus de vente. Importe QrCodeModule pour générer
 *              les tickets PDF et QR codes.
 * @module VentesModule
 *
 * RÔLE : Encapsuler tout le processus de vente avec génération de tickets.
 * UTILISÉ PAR : AppModule
 * DÉPENDANCES : PrismaModule (global), QrCodeModule
 * SUPPRESSION : Routes /ventes/* inaccessibles
 */

import { Module } from '@nestjs/common';
import { VentesController } from './ventes.controller';
import { VentesService } from './ventes.service';
import { QrCodeModule } from '../qrcode/qrcode.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CodesQrModule } from '../codes-qr/codes-qr.module';

@Module({
  imports: [QrCodeModule, NotificationsModule, CodesQrModule],
  controllers: [VentesController],
  providers: [VentesService],
  exports: [VentesService],
})
export class VentesModule {}
