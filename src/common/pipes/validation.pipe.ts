/**
 * @file validation.pipe.ts
 * @description Re-exporte la configuration du ValidationPipe global. Ce fichier
 *              centralise la configuration de la validation des DTO.
 * @module Common
 *
 * RÔLE : Configuration centralisée du ValidationPipe utilisé dans main.ts.
 * UTILISÉ PAR : main.ts (app.useGlobalPipes)
 * DÉPENDANCES : @nestjs/common, class-validator, class-transformer
 * SUPPRESSION : Pas de validation des DTO entrants, n'importe quel payload passe
 */

import { ValidationPipe } from '@nestjs/common';

/**
 * @description Instance de ValidationPipe préconfigurée pour toute l'application.
 * - whitelist: supprime les champs non déclarés dans le DTO (sécurité)
 * - forbidNonWhitelisted: erreur 400 si champs inconnus présents
 * - transform: convertit les types automatiquement (ex: string → number)
 */
export const globalValidationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
});
