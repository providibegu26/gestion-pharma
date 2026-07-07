import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from './decorators/public.decorator';

interface JwtUser {
  sub: string;
  email: string;
  role: Role;
  refreshToken?: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un nouveau compte client (auto-inscription publique)' })
  @ApiResponse({ status: 201, description: 'Compte créé avec succès' })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Se connecter et recevoir les cookies JWT' })
  @ApiResponse({ status: 200, description: 'Connexion réussie, cookies posés' })
  @ApiResponse({ status: 401, description: 'Email ou mot de passe incorrect' })
  login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: unknown,
  ) {
    return this.authService.login(dto, res as Response);
  }

  @Public()
  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renouveler les tokens JWT via le refresh token' })
  @ApiCookieAuth('refresh_token')
  @ApiResponse({ status: 200, description: 'Tokens renouvelés' })
  @ApiResponse({ status: 401, description: 'Refresh token invalide ou expiré' })
  refresh(
    @Req() req: Request & { user: JwtUser },
    @Res({ passthrough: true }) res: unknown,
  ) {
    const { sub, email, role } = req.user;
    return this.authService.refresh(sub, email, role, res as Response);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Se déconnecter et effacer les cookies' })
  @ApiResponse({ status: 200, description: 'Déconnexion réussie' })
  logout(
    @Req() req: Request & { user: JwtUser },
    @Res({ passthrough: true }) res: unknown,
  ) {
    return this.authService.logout(req.user.sub, res as Response);
  }

  @Get('me')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Récupérer le profil de l\'utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Profil utilisateur' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  getMe(@Req() req: Request & { user: JwtUser }) {
    return this.authService.getMe(req.user.sub);
  }

  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('access_token')
  @ApiOperation({
    summary: 'Changer son mot de passe',
    description: 'Permet à tout utilisateur connecté de changer son mot de passe.',
  })
  @ApiResponse({ status: 200, description: 'Mot de passe mis à jour' })
  @ApiResponse({ status: 400, description: 'Ancien mot de passe incorrect' })
  changePassword(
    @Req() req: Request & { user: JwtUser },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      req.user.sub,
      dto.ancienMotDePasse,
      dto.nouveauMotDePasse,
    );
  }
}
