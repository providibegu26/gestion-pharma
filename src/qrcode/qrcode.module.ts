/**
 * @file qrcode.module.ts
 * @description Module de génération de QR codes et tickets PDF.
 * @module QrCodeModule
 *
 * RÔLE : Fournir QrCodeService à VentesModule pour la génération des reçus.
 * UTILISÉ PAR : AppModule et VentesModule (via import)
 * DÉPENDANCES : ConfigModule (global), QrCodeService
 * SUPPRESSION : Impossible de générer les tickets de vente
 */

import { Module } from '@nestjs/common';
import { QrCodeService } from './qrcode.service';

@Module({
  providers: [QrCodeService],
  exports: [QrCodeService], // Exporté pour être injecté dans VentesModule
})
export class QrCodeModule {}
