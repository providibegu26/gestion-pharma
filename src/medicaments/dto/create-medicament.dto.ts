/**
 * @file create-medicament.dto.ts
 * @description DTO de validation pour la création d'un médicament.
 *              Les prix sont en CDF et USD pour s'adapter au contexte RDC.
 * @module MedicamentsModule
 *
 * RÔLE : Valider les données du catalogue médicament.
 * UTILISÉ PAR : MedicamentsController.create()
 * DÉPENDANCES : class-validator
 * SUPPRESSION : Aucune validation sur la création de médicaments
 */

import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateMedicamentDto {
  @ApiProperty({ example: 'Paracétamol 500mg', description: 'Nom commercial du médicament' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiPropertyOptional({
    example: 'Analgésique et antipyrétique',
    description: 'Description ou composition',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 500,
    description: 'Prix unitaire en Franc Congolais (CDF)',
  })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  prixCDF: number;

  @ApiProperty({
    example: 0.25,
    description: 'Prix unitaire en Dollars Américains (USD)',
  })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  prixUSD: number;

  @ApiProperty({ example: 'Analgésiques', description: 'Catégorie thérapeutique' })
  @IsString()
  @IsNotEmpty()
  categorie: string;

  @ApiProperty({ example: 'comprimé', description: 'Unité de vente (comprimé, flacon, boîte…)' })
  @IsString()
  @IsNotEmpty()
  unite: string;

  @ApiPropertyOptional({
    example: 100,
    description: 'Quantité initiale en stock (par défaut 0)',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  quantiteInitiale?: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'Seuil d\'alerte stock minimum (par défaut 10)',
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  seuilMinimum?: number;
}
