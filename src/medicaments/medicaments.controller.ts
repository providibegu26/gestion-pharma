/**
 * @file medicaments.controller.ts
 * @description Controller du catalogue médicaments. Création/modification réservées
 *              à PHARMACIEN. Lecture accessible à tous.
 * @module MedicamentsModule
 *
 * RÔLE : Routes CRUD pour le catalogue des médicaments.
 * UTILISÉ PAR : MedicamentsModule
 * DÉPENDANCES : MedicamentsService, Roles decorator
 * SUPPRESSION : Routes /medicaments/* inaccessibles
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
import { MedicamentsService } from './medicaments.service';
import { CreateMedicamentDto } from './dto/create-medicament.dto';
import { UpdateMedicamentDto } from './dto/update-medicament.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('medicaments')
@ApiCookieAuth('access_token')
@Controller('medicaments')
export class MedicamentsController {
  constructor(private readonly medicamentsService: MedicamentsService) {}

  /**
   * @method create
   * @description Ajoute un médicament au catalogue avec son stock initial.
   */
  @Post()
  @Roles(Role.PHARMACIEN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un médicament avec stock initial (PHARMACIEN)' })
  create(@Body() dto: CreateMedicamentDto) {
    return this.medicamentsService.create(dto);
  }

  /**
   * @method findAll
   * @description Liste tous les médicaments avec leurs niveaux de stock.
   */
  @Get()
  @Public()
  @ApiOperation({ summary: 'Lister tous les médicaments avec leurs stocks (public)' })
  findAll() {
    return this.medicamentsService.findAll();
  }

  /**
   * @method findOne
   * @description Détail d'un médicament spécifique.
   */
  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Détail d\'un médicament (public)' })
  @ApiParam({ name: 'id', description: 'UUID du médicament' })
  findOne(@Param('id') id: string) {
    return this.medicamentsService.findOne(id);
  }

  /**
   * @method update
   * @description Modifie les informations d'un médicament (prix, description, etc.).
   */
  @Patch(':id')
  @Roles(Role.PHARMACIEN)
  @ApiOperation({ summary: 'Modifier un médicament (PHARMACIEN)' })
  @ApiParam({ name: 'id', description: 'UUID du médicament' })
  update(@Param('id') id: string, @Body() dto: UpdateMedicamentDto) {
    return this.medicamentsService.update(id, dto);
  }

  /**
   * @method remove
   * @description Supprime un médicament du catalogue (PHARMACIEN uniquement).
   */
  @Delete(':id')
  @Roles(Role.PHARMACIEN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un médicament (PHARMACIEN)' })
  @ApiParam({ name: 'id', description: 'UUID du médicament' })
  remove(@Param('id') id: string) {
    return this.medicamentsService.remove(id);
  }
}
