/**
 * @file ventes.controller.ts
 * @description Controller du processus de vente. La création est réservée aux
 *              CAISSIER. Le ticket PDF est accessible à tous les rôles.
 * @module VentesModule
 *
 * RÔLE : Routes pour créer, consulter, télécharger les tickets et annuler les ventes.
 * UTILISÉ PAR : VentesModule
 * DÉPENDANCES : VentesService, Roles decorator
 * SUPPRESSION : Routes /ventes/* inaccessibles
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
  Req,
  Res,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { Request, Response } from 'express';
import { VentesService } from './ventes.service';
import { CreateVenteDto } from './dto/create-vente.dto';
import { Roles } from '../auth/decorators/roles.decorator';

/** Structure du req.user posé par JwtStrategy */
interface JwtUser {
  sub: string;
  email: string;
  role: Role;
}

@ApiTags('ventes')
@ApiCookieAuth('access_token')
@Controller('ventes')
export class VentesController {
  constructor(private readonly ventesService: VentesService) {}

  /**
   * @method create
   * @description Crée une vente avec vérification des stocks et génération du ticket.
   * @param {CreateVenteDto} dto - Données de la vente
   * @param {Request} req - Requête avec req.user.sub (ID caissier)
   */
  @Post()
  @Roles(Role.CAISSIER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une vente (CAISSIER)' })
  create(
    @Body() dto: CreateVenteDto,
    @Req() req: Request & { user: JwtUser },
  ) {
    // Extrait l'ID du caissier connecté depuis le token JWT
    return this.ventesService.create(dto, req.user.sub);
  }

  /**
   * @method findAll
   * @description Liste toutes les ventes avec leurs détails.
   */
  @Get()
  @ApiOperation({ summary: 'Lister toutes les ventes' })
  findAll() {
    return this.ventesService.findAll();
  }

  /**
   * @method findOne
   * @description Détail complet d'une vente.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une vente' })
  @ApiParam({ name: 'id', description: 'UUID de la vente' })
  findOne(@Param('id') id: string) {
    return this.ventesService.findOne(id);
  }

  /**
   * @method getTicket
   * @description Télécharge le ticket PDF d'une vente.
   *              Note : @Res() bypass l'interceptor ; le PDF est envoyé directement.
   * @param {string} id - UUID de la vente
   * @param {Response} res - Réponse Express pour envoyer le fichier PDF
   */
  @Get(':id/codes-qr')
  @ApiOperation({
    summary: 'Lister les codes QR unitaires d\'une vente',
    description:
      'Chaque unité vendue possède un code unique lié au produit et au patient. ' +
      'Un code UTILISE ou ANNULE ne peut plus être validé.',
  })
  @ApiParam({ name: 'id', description: 'UUID de la vente' })
  findCodesQr(@Param('id') id: string) {
    return this.ventesService.findCodesQr(id);
  }

  @Get(':id/ticket')
  @ApiOperation({ summary: 'Télécharger le ticket PDF d\'une vente' })
  @ApiParam({ name: 'id', description: 'UUID de la vente' })
  getTicket(
    @Param('id') id: string,
    @Res() res: unknown,
  ) {
    // Pas de passthrough : la réponse PDF est envoyée directement (bypass interceptor)
    return this.ventesService.getTicketPdf(id, res as Response);
  }

  /**
   * @method annuler
   * @description Annule une vente et restitue les stocks (PHARMACIEN uniquement).
   */
  @Patch(':id/annuler')
  @Roles(Role.PHARMACIEN)
  @ApiOperation({ summary: 'Annuler une vente et restituer les stocks (PHARMACIEN)' })
  @ApiParam({ name: 'id', description: 'UUID de la vente' })
  annuler(@Param('id') id: string) {
    return this.ventesService.annuler(id);
  }
}
