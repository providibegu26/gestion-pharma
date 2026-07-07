/**
 * @file update-user.dto.ts
 * @description DTO pour la mise à jour partielle d'un utilisateur.
 *              Tous les champs de CreateUserDto deviennent optionnels via PartialType.
 * @module UsersModule
 *
 * RÔLE : Valider les données de mise à jour d'un utilisateur (PATCH).
 * UTILISÉ PAR : UsersController.update()
 * DÉPENDANCES : CreateUserDto, @nestjs/swagger
 * SUPPRESSION : Aucune validation sur les mises à jour d'utilisateurs
 */

import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

// PartialType rend tous les champs optionnels et conserve les décorateurs de validation
export class UpdateUserDto extends PartialType(CreateUserDto) {}
