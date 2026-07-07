/**
 * @file login.dto.ts
 * @description DTO de validation pour la connexion d'un utilisateur.
 * @module AuthModule
 *
 * RÔLE : Valider et typer les données de la requête POST /auth/login.
 * UTILISÉ PAR : AuthController.login()
 * DÉPENDANCES : class-validator
 * SUPPRESSION : Aucune validation sur les données de connexion
 */

import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'j.kabila@pharmacie.cd', description: 'Adresse email' })
  @IsEmail({}, { message: 'Adresse email invalide' })
  email: string;

  @ApiProperty({ example: 'MotDePasse123!', description: 'Mot de passe' })
  @IsString()
  @IsNotEmpty()
  motDePasse: string;
}
