/**
 * @file update-medicament.dto.ts
 * @description DTO pour la mise à jour partielle d'un médicament.
 * @module MedicamentsModule
 *
 * RÔLE : Valider les données de modification d'un médicament (PATCH).
 * UTILISÉ PAR : MedicamentsController.update()
 * DÉPENDANCES : CreateMedicamentDto
 * SUPPRESSION : Aucune validation sur les mises à jour de médicaments
 */

import { PartialType } from '@nestjs/swagger';
import { CreateMedicamentDto } from './create-medicament.dto';

export class UpdateMedicamentDto extends PartialType(CreateMedicamentDto) {}
