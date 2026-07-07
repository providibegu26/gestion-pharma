/**
 * @file roles.decorator.ts
 * @description Décorateur @Roles(...roles) qui attache les rôles autorisés aux
 *              métadonnées d'une route. Utilisé par RolesGuard pour le contrôle d'accès.
 * @module AuthModule
 *
 * RÔLE : Déclarer quels rôles peuvent accéder à une route donnée.
 * UTILISÉ PAR : RolesGuard (lit les métadonnées), tous les controllers
 * DÉPENDANCES : @nestjs/common, @prisma/client (enum Role)
 * SUPPRESSION : Le contrôle d'accès par rôle ne fonctionne plus
 */

import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

/** Clé de métadonnée utilisée pour stocker les rôles requis */
export const ROLES_KEY = 'roles';

/**
 * @decorator Roles
 * @description Déclare les rôles autorisés pour une route.
 * @param {...Role} roles - Un ou plusieurs rôles de l'enum Role Prisma
 * @example
 * @Roles(Role.PHARMACIEN, Role.CAISSIER)
 * @Post('medicaments')
 * create(@Body() dto: CreateMedicamentDto) { ... }
 */
export const Roles = (...roles: Role[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
