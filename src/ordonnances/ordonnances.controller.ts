/**
 * @file ordonnances.controller.ts
 * @description Controller des ordonnances médicales. Validation/refus réservés
 *              à PHARMACIEN.
 * @module OrdonnancesModule
 *
 * RÔLE : Routes pour la gestion du cycle de vie des ordonnances.
 * UTILISÉ PAR : OrdonnancesModule
 * DÉPENDANCES : OrdonnancesService, Roles decorator
 * SUPPRESSION : Routes /ordonnances/* inaccessibles
 */

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { OrdonnancesService } from './ordonnances.service';
import { CreateOrdonnanceDto } from './dto/create-ordonnance.dto';
import { UpdateOrdonnanceDto } from './dto/update-ordonnance.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('ordonnances')
@ApiCookieAuth('access_token')
@Controller('ordonnances')
export class OrdonnancesController {
  constructor(private readonly ordonnancesService: OrdonnancesService) {}

  /**
   * @method create
   * @description Enregistre une nouvelle ordonnance (statut EN_ATTENTE).
   */
  @Post()
  @Roles(Role.PHARMACIEN, Role.CAISSIER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enregistrer une ordonnance (statut EN_ATTENTE)' })
  create(@Body() dto: CreateOrdonnanceDto) {
    return this.ordonnancesService.create(dto);
  }

  /**
   * @method findAll
   * @description Liste toutes les ordonnances.
   */
  @Get()
  @ApiOperation({ summary: 'Lister toutes les ordonnances' })
  findAll() {
    return this.ordonnancesService.findAll();
  }

  /**
   * @method findOne
   * @description Détail d'une ordonnance spécifique.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une ordonnance' })
  @ApiParam({ name: 'id', description: 'UUID de l\'ordonnance' })
  findOne(@Param('id') id: string) {
    return this.ordonnancesService.findOne(id);
  }

  /**
   * @method valider
   * @description Valide une ordonnance EN_ATTENTE (PHARMACIEN).
   */
  @Patch(':id/valider')
  @Roles(Role.PHARMACIEN)
  @ApiOperation({ summary: 'Valider une ordonnance (PHARMACIEN)' })
  @ApiParam({ name: 'id', description: 'UUID de l\'ordonnance' })
  valider(@Param('id') id: string) {
    return this.ordonnancesService.valider(id);
  }

  /**
   * @method refuser
   * @description Refuse une ordonnance EN_ATTENTE (PHARMACIEN).
   */
  @Patch(':id/refuser')
  @Roles(Role.PHARMACIEN)
  @ApiOperation({ summary: 'Refuser une ordonnance (PHARMACIEN)' })
  @ApiParam({ name: 'id', description: 'UUID de l\'ordonnance' })
  refuser(@Param('id') id: string) {
    return this.ordonnancesService.refuser(id);
  }

  /**
   * @method update
   * @description Met à jour une ordonnance (ex: ajouter l'image scannée).
   */
  @Patch(':id')
  @Roles(Role.PHARMACIEN)
  @ApiOperation({ summary: 'Mettre à jour une ordonnance' })
  @ApiParam({ name: 'id', description: 'UUID de l\'ordonnance' })
  update(@Param('id') id: string, @Body() dto: UpdateOrdonnanceDto) {
    return this.ordonnancesService.update(id, dto);
  }
}
