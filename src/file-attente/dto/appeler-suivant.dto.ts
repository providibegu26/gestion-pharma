import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TypeServiceFile } from '@prisma/client';

export class AppelerSuivantDto {
  @ApiProperty({ enum: TypeServiceFile, example: TypeServiceFile.PHARMACIE })
  @IsEnum(TypeServiceFile)
  typeService: TypeServiceFile;
}
