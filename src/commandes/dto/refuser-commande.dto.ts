import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RefuserCommandeDto {
  @ApiProperty({
    example: 'Ordonnance requise pour ce médicament.',
    description: 'Justification du refus saisie par le pharmacien',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Le motif de refus doit contenir au moins 5 caractères.' })
  motifRefus: string;
}
