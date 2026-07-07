import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Role, TypeServiceFile } from '@prisma/client';
import type { Request } from 'express';
import { FileAttenteService } from './file-attente.service';
import { RejoindreFileDto } from './dto/rejoindre-file.dto';
import { AppelerSuivantDto } from './dto/appeler-suivant.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

interface JwtUser {
  sub: string;
  email: string;
  role: Role;
  nom?: string;
  prenom?: string;
}

@ApiTags('file-attente')
@ApiCookieAuth('access_token')
@Controller('file-attente')
export class FileAttenteController {
  constructor(private readonly fileAttenteService: FileAttenteService) {}

  @Post('rejoindre')
  @Roles(Role.CLIENT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Rejoindre la file (CLIENT connecté)',
    description:
      'Attribue automatiquement un numéro de ticket, une position et un temps d\'attente estimé.',
  })
  rejoindreClient(
    @Req() req: Request & { user: JwtUser },
    @Body() dto: RejoindreFileDto,
  ) {
    const nom = `${req.user.prenom ?? ''} ${req.user.nom ?? ''}`.trim();
    return this.fileAttenteService.rejoindre(dto, req.user.sub, nom || undefined);
  }

  @Post('rejoindre-public')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Rejoindre la file sans compte (borne d\'accueil)',
    description: 'Nécessite nomAffiche et typeService.',
  })
  rejoindrePublic(@Body() dto: RejoindreFileDto) {
    return this.fileAttenteService.rejoindre(dto);
  }

  @Get('ma-position')
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Voir sa position dans la file (CLIENT)' })
  maPosition(@Req() req: Request & { user: JwtUser }) {
    return this.fileAttenteService.maPosition(req.user.sub);
  }

  @Get('stats')
  @Roles(Role.PHARMACIEN, Role.CAISSIER)
  @ApiOperation({ summary: 'Statistiques temps réel des files (staff)' })
  stats() {
    return this.fileAttenteService.stats();
  }

  @Get()
  @Roles(Role.PHARMACIEN, Role.CAISSIER)
  @ApiOperation({ summary: 'Liste la file du jour (staff)' })
  @ApiQuery({ name: 'typeService', enum: TypeServiceFile, required: false })
  lister(@Query('typeService') typeService?: TypeServiceFile) {
    return this.fileAttenteService.lister(typeService);
  }

  @Post('appeler-suivant')
  @Roles(Role.PHARMACIEN, Role.CAISSIER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Appeler automatiquement la prochaine personne en attente',
    description:
      'Le pharmacien gère la file PHARMACIE, le caissier la file CAISSE. ' +
      'À la fin d\'un service, le suivant est appelé automatiquement si la file est chargée.',
  })
  appelerSuivant(
    @Body() dto: AppelerSuivantDto,
    @Req() req: Request & { user: JwtUser },
  ) {
    return this.fileAttenteService.appelerSuivant(
      dto.typeService,
      req.user.sub,
      req.user.role,
    );
  }

  @Patch(':id/demarrer')
  @Roles(Role.PHARMACIEN, Role.CAISSIER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Démarrer le service pour un ticket appelé' })
  @ApiParam({ name: 'id', description: 'UUID du ticket' })
  demarrer(
    @Param('id') id: string,
    @Req() req: Request & { user: JwtUser },
  ) {
    return this.fileAttenteService.demarrerService(id, req.user.sub);
  }

  @Patch(':id/terminer')
  @Roles(Role.PHARMACIEN, Role.CAISSIER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Terminer le service — appelle automatiquement le suivant si file chargée',
  })
  @ApiParam({ name: 'id', description: 'UUID du ticket' })
  terminer(
    @Param('id') id: string,
    @Req() req: Request & { user: JwtUser },
  ) {
    return this.fileAttenteService.terminer(id, req.user.sub);
  }

  @Patch(':id/annuler')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Annuler un ticket (client ou staff)' })
  @ApiParam({ name: 'id', description: 'UUID du ticket' })
  annuler(
    @Param('id') id: string,
    @Req() req: Request & { user: JwtUser },
  ) {
    return this.fileAttenteService.annuler(id, req.user.sub, req.user.role);
  }
}
