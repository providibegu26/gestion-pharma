import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export enum FormatRapport {
  PDF = 'pdf',
  EXCEL = 'excel',
}

export class QuantitePersonnaliseeDto {
  @ApiProperty({ description: 'UUID du médicament', example: 'uuid-medicament' })
  @IsUUID()
  medicamentId: string;

  @ApiProperty({ description: 'Quantité à commander (remplace la suggestion automatique)', example: 50 })
  @IsInt()
  @Min(1)
  quantiteACommander: number;
}

export class EnvoyerRapportCommandeDto {
  @ApiProperty({ description: 'UUID du fournisseur destinataire', example: 'uuid-fournisseur' })
  @IsUUID()
  fournisseurId: string;

  @ApiPropertyOptional({
    description: 'Format du rapport joint',
    enum: FormatRapport,
    default: FormatRapport.PDF,
  })
  @IsEnum(FormatRapport)
  @IsOptional()
  format?: FormatRapport;

  @ApiPropertyOptional({
    description: 'Note incluse dans le corps de l\'email au fournisseur',
    example: 'Livraison souhaitée avant le 30 mai.',
  })
  @IsString()
  @IsOptional()
  commentaire?: string;

  @ApiPropertyOptional({
    description: 'Quantités personnalisées par médicament (si absent, suggestion automatique = seuil × 2 − stock actuel)',
    type: [QuantitePersonnaliseeDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuantitePersonnaliseeDto)
  @IsOptional()
  quantitesPersonnalisees?: QuantitePersonnaliseeDto[];
}
