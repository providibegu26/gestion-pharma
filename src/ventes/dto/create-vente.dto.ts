/**
 * @file create-vente.dto.ts
 * @description DTO de validation pour la création d'une vente.
 *              Inclut les lignes de vente (médicaments + quantités + devise).
 * @module VentesModule
 *
 * RÔLE : Valider une vente complète avec ses lignes de médicaments.
 * UTILISÉ PAR : VentesController.create()
 * DÉPENDANCES : class-validator, class-transformer, @prisma/client
 * SUPPRESSION : Aucune validation sur la création de ventes
 */

import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsUUID,
  ValidateNested,
  ArrayMinSize,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Devise } from '@prisma/client';

/** DTO pour une ligne individuelle de la vente */
export class LigneVenteDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'UUID du médicament',
  })
  @IsUUID('4', { message: 'medicamentId doit être un UUID valide' })
  medicamentId: string;

  @ApiProperty({ example: 3, description: 'Quantité commandée (entier positif)' })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  quantite: number;

  @ApiProperty({ enum: Devise, default: Devise.CDF, description: 'Devise de cette ligne' })
  @IsEnum(Devise)
  devise: Devise;
}

/** DTO principal de création d'une vente */
export class CreateVenteDto {
  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'UUID du patient (optionnel pour vente anonyme)',
  })
  @IsOptional()
  @IsUUID('4')
  patientId?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440002',
    description: 'UUID de l\'ordonnance associée (optionnel)',
  })
  @IsOptional()
  @IsUUID('4')
  ordonnanceId?: string;

  @ApiProperty({ enum: Devise, default: Devise.CDF, description: 'Devise globale de la vente' })
  @IsEnum(Devise)
  devise: Devise;

  @ApiProperty({
    type: [LigneVenteDto],
    description: 'Liste des médicaments vendus (minimum 1 ligne)',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Une vente doit contenir au moins un médicament' })
  @ValidateNested({ each: true }) // Valide chaque élément du tableau
  @Type(() => LigneVenteDto)      // Instancie LigneVenteDto pour chaque élément
  lignes: LigneVenteDto[];
}
