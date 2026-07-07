import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ScannerCodeCommandeDto {
  @ApiProperty({
    example: 'CMD-A3F2-9B1C',
    description: 'Code QR scanné ou payload PHARMACIE-COMMANDE:...',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}
