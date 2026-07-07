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
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { Request } from 'express';
import { CommandesService } from './commandes.service';
import { CreateCommandeDto } from './dto/create-commande.dto';
import { RefuserCommandeDto } from './dto/refuser-commande.dto';
import { ScannerCodeCommandeDto } from './dto/scanner-code-commande.dto';
import { Roles } from '../auth/decorators/roles.decorator';

interface JwtUser {
  sub: string;
  email: string;
  role: Role;
}

@ApiTags('commandes')
@ApiCookieAuth('access_token')
@Controller('commandes')
export class CommandesController {
  constructor(private readonly commandesService: CommandesService) {}

  @Post()
  @Roles(Role.CLIENT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Passer une commande (CLIENT)',
    description:
      'Crée la commande avec un code QR unique pour toute la commande (même pour 20 produits).',
  })
  create(
    @Req() req: Request & { user: JwtUser },
    @Body() dto: CreateCommandeDto,
  ) {
    return this.commandesService.create(req.user.sub, dto);
  }

  @Get()
  @Roles(Role.PHARMACIEN, Role.CAISSIER)
  @ApiOperation({ summary: 'Lister toutes les commandes (PHARMACIEN/CAISSIER)' })
  findAll() {
    return this.commandesService.findAll();
  }

  @Get('mes-commandes')
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Consulter mes commandes (CLIENT)' })
  findMesCommandes(@Req() req: Request & { user: JwtUser }) {
    return this.commandesService.findMesCommandes(req.user.sub);
  }

  @Post('code/consulter')
  @Roles(Role.PHARMACIEN, Role.CAISSIER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Consulter une commande via son code QR (sans retirer)',
    description:
      'Le pharmacien scanne le QR du client pour vérifier l\'authenticité de la commande.',
  })
  consulterParCode(@Body() dto: ScannerCodeCommandeDto) {
    return this.commandesService.findParCode(dto.code);
  }

  @Get('code/:code')
  @Roles(Role.PHARMACIEN, Role.CAISSIER)
  @ApiOperation({ summary: 'Consulter une commande par code (GET)' })
  @ApiParam({ name: 'code', example: 'CMD-A3F2-9B1C' })
  consulterParCodeGet(@Param('code') code: string) {
    return this.commandesService.findParCode(code);
  }

  @Post('code/retirer')
  @Roles(Role.PHARMACIEN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirmer le retrait en pharmacie via scan QR (PHARMACIEN)',
    description:
      'Valide le retrait de tous les produits de la commande en une seule opération.',
  })
  retirerParCode(
    @Body() dto: ScannerCodeCommandeDto,
    @Req() req: Request & { user: JwtUser },
  ) {
    return this.commandesService.retirerParCode(dto.code, req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une commande' })
  @ApiParam({ name: 'id', description: 'UUID de la commande' })
  findOne(@Req() req: Request & { user: JwtUser }, @Param('id') id: string) {
    return this.commandesService.findOne(id, req.user.sub, req.user.role);
  }

  @Patch(':id/valider')
  @Roles(Role.PHARMACIEN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Valider une commande (PHARMACIEN)',
    description:
      'Vérifie le stock automatiquement. Si insuffisant, refuse la commande avec un motif système.',
  })
  valider(
    @Param('id') id: string,
    @Req() req: Request & { user: JwtUser },
  ) {
    return this.commandesService.valider(id, req.user.sub);
  }

  @Patch(':id/refuser')
  @Roles(Role.PHARMACIEN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refuser une commande avec justification (PHARMACIEN)',
    description:
      'Le pharmacien saisit un motif. Le refus pour stock insuffisant est géré automatiquement à la validation.',
  })
  refuser(
    @Param('id') id: string,
    @Req() req: Request & { user: JwtUser },
    @Body() dto: RefuserCommandeDto,
  ) {
    return this.commandesService.refuser(id, req.user.sub, dto);
  }

  @Patch(':id/prete')
  @Roles(Role.PHARMACIEN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marquer une commande prête au retrait (PHARMACIEN)' })
  marquerPrete(@Param('id') id: string) {
    return this.commandesService.marquerPrete(id);
  }

  @Patch(':id/annuler')
  @Roles(Role.CLIENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Annuler sa commande (CLIENT)',
    description: 'Uniquement si la commande est encore EN_ATTENTE.',
  })
  annuler(
    @Param('id') id: string,
    @Req() req: Request & { user: JwtUser },
  ) {
    return this.commandesService.annuler(id, req.user.sub);
  }
}
