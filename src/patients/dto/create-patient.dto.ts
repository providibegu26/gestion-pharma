/**
 * @file create-patient.dto.ts
 * @description DTO de validation pour la création d'une fiche patient.
 * @module PatientsModule
 *
 * RÔLE : Valider les données de création d'un patient.
 * UTILISÉ PAR : PatientsController.create()
 * DÉPENDANCES : class-validator
 * SUPPRESSION : Aucune validation sur les données patient
 */

import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePatientDto {
  @ApiProperty({ example: 'Lumumba', description: 'Nom de famille du patient' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({ example: 'Patrice', description: 'Prénom du patient' })
  @IsString()
  @IsNotEmpty()
  prenom: string;

  @ApiProperty({
    example: '+243812345678',
    description: 'Numéro de téléphone congolais (unique)',
  })
  @IsString()
  @IsNotEmpty()
  // Validation format téléphone RDC : +243 suivi de 9 chiffres
  @Matches(/^(\+243|0)[0-9]{9}$/, {
    message: 'Format téléphone invalide. Exemples valides : +243812345678 ou 0812345678',
  })
  telephone: string;

  @ApiPropertyOptional({
    example: 'Avenue Kasavubu, Kinshasa-Gombe',
    description: 'Adresse du patient (optionnelle)',
  })
  @IsOptional()
  @IsString()
  adresse?: string;
}
