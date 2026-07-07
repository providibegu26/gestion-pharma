/**
 * @file update-stock.dto.ts
 * @description DTO pour la mise à jour manuelle du stock d'un médicament.
 *              Utilisé pour les réapprovisionnements ou corrections.
 * @module StockModule
 *
 * RÔLE : Valider les données de mise à jour de stock.
 * UTILISÉ PAR : StockController.update()
 * DÉPENDANCES : class-validator
 * SUPPRESSION : Aucune validation sur les mises à jour de stock
 */

import { IsInt, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateStockDto {
  @ApiProperty({
    example: 150,
    description: 'Nouvelle quantité en stock (remplace la valeur actuelle)',
  })
  @IsInt()
  @Min(0, { message: 'La quantité ne peut pas être négative' })
  @Type(() => Number)
  quantite: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'Nouveau seuil d\'alerte minimum (optionnel)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  seuilMinimum?: number;
}
