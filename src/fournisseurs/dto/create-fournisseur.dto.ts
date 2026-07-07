import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFournisseurDto {
  @ApiProperty({ example: 'Pharma Distribution SARL' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({ example: '+243812345678', description: 'Numéro de téléphone unique' })
  @IsString()
  @IsNotEmpty()
  telephone: string;

  @ApiPropertyOptional({ example: 'contact@pharmadist.cd' })
  @IsOptional()
  @IsEmail({}, { message: 'Adresse email invalide' })
  email?: string;

  @ApiPropertyOptional({ example: 'Avenue du Commerce, Kinshasa-Gombe' })
  @IsOptional()
  @IsString()
  adresse?: string;
}
