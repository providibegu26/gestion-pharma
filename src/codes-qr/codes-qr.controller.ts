import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { Roles } from '../auth/decorators/roles.decorator';
import { CodesQrService } from './codes-qr.service';
import { VerifierCodeQrDto } from './dto/verifier-code-qr.dto';

interface JwtUser {
  sub: string;
  email: string;
  role: Role;
}

@ApiTags('codes-qr')
@ApiCookieAuth('access_token')
@Controller('codes-qr')
export class CodesQrController {
  constructor(private readonly codesQrService: CodesQrService) {}

  @Post('consulter')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.PHARMACIEN, Role.CAISSIER)
  @ApiOperation({
    summary: 'Consulter un code QR scanné (sans le consommer)',
    description:
      'Permet au frontend d\'afficher les infos produit/patient/vente avant validation. ' +
      'Ne marque pas le code comme utilisé.',
  })
  consulter(@Body() dto: VerifierCodeQrDto) {
    return this.codesQrService.consulter(dto.code);
  }

  @Post('utiliser')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.PHARMACIEN, Role.CAISSIER)
  @ApiOperation({
    summary: 'Valider et consommer un code QR (usage unique)',
    description:
      'Marque le code comme UTILISE. Un code déjà utilisé ou annulé est rejeté (400). ' +
      'Chaque code est lié à une seule unité d\'un seul produit et d\'un seul patient.',
  })
  @ApiResponse({ status: 200, description: 'Code validé avec succès' })
  @ApiResponse({ status: 400, description: 'Code déjà utilisé ou annulé' })
  @ApiResponse({ status: 404, description: 'Code introuvable' })
  utiliser(
    @Body() dto: VerifierCodeQrDto,
    @Req() req: Request & { user: JwtUser },
  ) {
    return this.codesQrService.utiliser(dto.code, req.user.sub);
  }

  @Get('consulter/:code')
  @Roles(Role.PHARMACIEN, Role.CAISSIER)
  @ApiOperation({ summary: 'Consulter un code par son identifiant (GET)' })
  @ApiParam({ name: 'code', example: 'PHARM-A3F2-9B1C' })
  consulterParCode(@Param('code') code: string) {
    return this.codesQrService.consulter(code);
  }
}
