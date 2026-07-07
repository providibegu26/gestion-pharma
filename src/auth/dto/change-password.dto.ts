import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'AncienMotDePasse123!', description: 'Mot de passe actuel' })
  @IsString()
  ancienMotDePasse: string;

  @ApiProperty({ example: 'NouveauMotDePasse456!', description: 'Nouveau mot de passe (minimum 8 caractères)' })
  @IsString()
  @MinLength(8, { message: 'Le nouveau mot de passe doit contenir au minimum 8 caractères' })
  nouveauMotDePasse: string;
}
