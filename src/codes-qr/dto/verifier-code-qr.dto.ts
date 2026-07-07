import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifierCodeQrDto {
  @ApiProperty({
    example: 'PHARM-A3F2-9B1C',
    description: 'Code QR scanné ou payload complet PHARMACIE-CODE:...',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}
