/**
 * @file register.dto.ts
 * @description DTO de validation pour l'inscription d'un nouvel utilisateur.
 *              Vérifie que tous les champs requis sont présents et valides.
 * @module AuthModule
 *
 * RÔLE : Valider et typer les données de la requête POST /auth/register.
 * UTILISÉ PAR : AuthController.register()
 * DÉPENDANCES : class-validator, @prisma/client (Role enum)
 * SUPPRESSION : Aucune validation sur les données d'inscription
 */

import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Lumumba', description: 'Nom de famille' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({ example: 'Patrice', description: 'Prénom' })
  @IsString()
  @IsNotEmpty()
  prenom: string;

  @ApiProperty({ example: 'p.lumumba@email.com', description: 'Adresse email unique' })
  @IsEmail({}, { message: 'Adresse email invalide' })
  email: string;

  @ApiProperty({ example: 'MotDePasse123!', description: 'Mot de passe (minimum 8 caractères)' })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au minimum 8 caractères' })
  motDePasse: string;
}
