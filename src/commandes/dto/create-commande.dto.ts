import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class LigneCommandeDto {
  @ApiProperty({ description: 'UUID du médicament', example: 'uuid-medicament' })
  @IsUUID()
  medicamentId: string;

  @ApiProperty({ description: 'Quantité demandée', example: 2 })
  @IsInt()
  @Min(1)
  quantite: number;
}

export class CreateCommandeDto {
  @ApiProperty({
    description: 'Liste des médicaments commandés (au moins 1)',
    type: [LigneCommandeDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LigneCommandeDto)
  @ArrayMinSize(1)
  lignes: LigneCommandeDto[];

  @ApiPropertyOptional({ description: 'Note ou remarque libre du client' })
  @IsString()
  @IsOptional()
  note?: string;
}
