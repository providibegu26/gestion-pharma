import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { TypeServiceFile } from '@prisma/client';

export class RejoindreFileDto {
  @ApiProperty({ enum: TypeServiceFile, example: TypeServiceFile.PHARMACIE })
  @IsEnum(TypeServiceFile)
  typeService: TypeServiceFile;

  @ApiPropertyOptional({
    description: 'Nom affiché pour les visiteurs sans compte (borne d\'accueil)',
    example: 'Mme Kabongo',
  })
  @IsString()
  @MinLength(2)
  @IsOptional()
  nomAffiche?: string;
}
