/**
 * @file update-ordonnance.dto.ts
 * @description DTO pour la mise à jour d'une ordonnance (image URL).
 * @module OrdonnancesModule
 *
 * RÔLE : Valider les données de modification d'une ordonnance.
 * UTILISÉ PAR : OrdonnancesController.update()
 * DÉPENDANCES : CreateOrdonnanceDto
 * SUPPRESSION : Aucune validation sur les mises à jour d'ordonnances
 */

import { PartialType } from '@nestjs/swagger';
import { CreateOrdonnanceDto } from './create-ordonnance.dto';

export class UpdateOrdonnanceDto extends PartialType(CreateOrdonnanceDto) {}
