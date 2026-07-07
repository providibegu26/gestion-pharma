/**
 * @file update-patient.dto.ts
 * @description DTO pour la mise à jour partielle d'un patient.
 * @module PatientsModule
 *
 * RÔLE : Valider les données de mise à jour d'un patient (PATCH).
 * UTILISÉ PAR : PatientsController.update()
 * DÉPENDANCES : CreatePatientDto
 * SUPPRESSION : Aucune validation sur les mises à jour de patients
 */

import { PartialType } from '@nestjs/swagger';
import { CreatePatientDto } from './create-patient.dto';

export class UpdatePatientDto extends PartialType(CreatePatientDto) {}
