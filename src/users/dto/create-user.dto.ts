import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

const STAFF_ROLES = [Role.PHARMACIEN, Role.CAISSIER] as const;
type StaffRole = typeof STAFF_ROLES[number];

export class CreateUserDto {
  @ApiProperty({ example: 'Mukeba' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({ example: 'Marie' })
  @IsString()
  @IsNotEmpty()
  prenom: string;

  @ApiProperty({ example: 'marie.mukeba@pharmacie.cd' })
  @IsEmail({}, { message: 'Adresse email invalide' })
  email: string;

  @ApiProperty({
    enum: STAFF_ROLES,
    description: 'Rôle du membre du personnel (PHARMACIEN ou CAISSIER). Le rôle ADMIN ne peut pas être créé via cette route.',
    example: Role.PHARMACIEN,
  })
  @IsEnum(STAFF_ROLES, {
    message: `Rôle invalide. Valeurs acceptées pour le personnel : ${STAFF_ROLES.join(', ')}`,
  })
  role: StaffRole;
}
