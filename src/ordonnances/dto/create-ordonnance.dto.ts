/**
 * @file create-ordonnance.dto.ts
 * @description DTO de validation pour l'enregistrement d'une ordonnance médicale.
 * @module OrdonnancesModule
 *
 * RÔLE : Valider les données d'une nouvelle ordonnance.
 * UTILISÉ PAR : OrdonnancesController.create()
 * DÉPENDANCES : class-validator
 * SUPPRESSION : Aucune validation sur la création d'ordonnances
 */

import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrdonnanceDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'UUID du patient concerné par cette ordonnance',
  })
  @IsUUID('4', { message: 'patientId doit être un UUID valide' })
  patientId: string;

  @ApiProperty({
    example: 'Dr. Mobutu Sese Seko',
    description: 'Nom du médecin prescripteur',
  })
  @IsString()
  @IsNotEmpty()
  prescripteur: string;

  @ApiPropertyOptional({
    example: 'https://storage.example.com/ordonnances/ord-001.jpg',
    description: 'URL de l\'image scannée de l\'ordonnance physique',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
