/**
 * @file stock.controller.ts
 * @description Controller de gestion des stocks et des bons de commande fournisseur.
 * @module StockModule
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
import {
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { StockService } from './stock.service';
import { UpdateStockDto } from './dto/update-stock.dto';
import { EnvoyerRapportCommandeDto } from './dto/envoyer-rapport-commande.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('stock')
@ApiCookieAuth('access_token')
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  @ApiOperation({ summary: 'Vue d\'ensemble de tous les stocks' })
  findAll() {
    return this.stockService.findAll();
  }

  @Get('alertes')
  @ApiOperation({ summary: 'Médicaments en rupture ou sous le seuil d\'alerte' })
  findAlertes() {
    return this.stockService.findAlertes();
  }

  /**
   * @method getRapportCommande
   * @description Prévisualisation du bon de commande : liste des produits sous seuil
   *              avec les quantités suggérées. À valider avant envoi au fournisseur.
   */
  @Get('rapport-commande')
  @Roles(Role.PHARMACIEN)
  @ApiOperation({
    summary: 'Prévisualiser le bon de commande (PHARMACIEN)',
    description:
      'Retourne la liste des médicaments sous seuil avec la quantité suggérée à commander ' +
      '(seuil × 2 − stock actuel). Utiliser POST /stock/rapport-commande/envoyer pour l\'envoyer.',
  })
  @ApiResponse({ status: 200, description: 'Rapport prévisualisé' })
  getRapportCommande() {
    return this.stockService.getRapportCommande();
  }

  /**
   * @method envoyerRapportCommande
   * @description Génère le bon de commande (PDF ou Excel) et l'envoie directement
   *              à l'email du fournisseur sélectionné. Les quantités peuvent être
   *              ajustées avant envoi.
   */
  @Post('rapport-commande/envoyer')
  @Roles(Role.PHARMACIEN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Générer et envoyer le bon de commande au fournisseur (PHARMACIEN)',
    description:
      'Génère un rapport PDF ou Excel des produits sous seuil et l\'envoie par email au fournisseur. ' +
      'Les quantités à commander peuvent être personnalisées via quantitesPersonnalisees. ' +
      'Sinon, la suggestion automatique est appliquée (seuil × 2 − stock actuel). ' +
      'Le fournisseur doit avoir un email enregistré.',
  })
  @ApiResponse({ status: 200, description: 'Rapport généré et envoyé par email' })
  @ApiResponse({ status: 400, description: 'Fournisseur sans email, ou aucun produit sous seuil' })
  @ApiResponse({ status: 404, description: 'Fournisseur introuvable' })
  envoyerRapportCommande(@Body() dto: EnvoyerRapportCommandeDto) {
    return this.stockService.envoyerRapportCommande(dto);
  }

  @Get(':medicamentId')
  @ApiOperation({ summary: 'Stock d\'un médicament spécifique' })
  @ApiParam({ name: 'medicamentId', description: 'UUID du médicament' })
  findByMedicament(@Param('medicamentId') medicamentId: string) {
    return this.stockService.findByMedicament(medicamentId);
  }

  @Patch(':medicamentId')
  @Roles(Role.PHARMACIEN)
  @ApiOperation({ summary: 'Ajuster le stock d\'un médicament (réapprovisionnement)' })
  @ApiParam({ name: 'medicamentId', description: 'UUID du médicament' })
  update(
    @Param('medicamentId') medicamentId: string,
    @Body() dto: UpdateStockDto,
  ) {
    return this.stockService.update(medicamentId, dto);
  }
}
