/**
 * @file patients.controller.ts
 * @description Controller de gestion des patients. Accessible à tous les rôles
 *              authentifiés pour la consultation, restreint pour modification/suppression.
 * @module PatientsModule
 *
 * RÔLE : Routes CRUD pour la gestion des fiches patients.
 * UTILISÉ PAR : PatientsModule
 * DÉPENDANCES : PatientsService, Roles decorator
 * SUPPRESSION : Routes /patients/* inaccessibles
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('patients')
@ApiCookieAuth('access_token')
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  /**
   * @method create
   * @description Enregistre un nouveau patient.
   */
  @Post()
  @Roles(Role.PHARMACIEN, Role.CAISSIER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enregistrer un nouveau patient' })
  create(@Body() dto: CreatePatientDto) {
    return this.patientsService.create(dto);
  }

  /**
   * @method findAll
   * @description Liste tous les patients enregistrés.
   */
  @Get()
  @ApiOperation({ summary: 'Lister tous les patients' })
  findAll() {
    return this.patientsService.findAll();
  }

  /**
   * @method findOne
   * @description Détail d'un patient avec ses ordonnances et ventes récentes.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un patient avec historique' })
  @ApiParam({ name: 'id', description: 'UUID du patient' })
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  /**
   * @method update
   * @description Met à jour les informations d'un patient.
   */
  @Patch(':id')
  @Roles(Role.PHARMACIEN, Role.CAISSIER)
  @ApiOperation({ summary: 'Modifier un patient' })
  @ApiParam({ name: 'id', description: 'UUID du patient' })
  update(@Param('id') id: string, @Body() dto: UpdatePatientDto) {
    return this.patientsService.update(id, dto);
  }

  /**
   * @method remove
   * @description Supprime un patient (PHARMACIEN uniquement).
   */
  @Delete(':id')
  @Roles(Role.PHARMACIEN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un patient (PHARMACIEN)' })
  @ApiParam({ name: 'id', description: 'UUID du patient' })
  remove(@Param('id') id: string) {
    return this.patientsService.remove(id);
  }
}
