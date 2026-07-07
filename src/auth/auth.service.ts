import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const ACCESS_TOKEN_COOKIE_MAX_AGE = 15 * 60 * 1000;
const REFRESH_TOKEN_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

type SafeUser = Omit<User, 'motDePasse' | 'refreshToken'>;

interface TokenPayload {
  sub: string;
  email: string;
  role: Role;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{ data: SafeUser; message: string }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Un compte avec cet email existe déjà.');
    }

    const hashedPassword = await bcrypt.hash(dto.motDePasse, 12);

    const user = await this.prisma.user.create({
      data: {
        nom: dto.nom,
        prenom: dto.prenom,
        email: dto.email,
        motDePasse: hashedPassword,
        role: Role.CLIENT,
      },
    });

    return {
      data: this.sanitizeUser(user),
      message: 'Compte client créé avec succès.',
    };
  }

  async login(
    dto: LoginDto,
    res: Response,
  ): Promise<{ data: SafeUser; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    const isPasswordValid = await bcrypt.compare(dto.motDePasse, user.motDePasse);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    await this.storeRefreshToken(user.id, tokens.refreshToken);
    this.setCookies(res, tokens.accessToken, tokens.refreshToken);

    return {
      data: this.sanitizeUser(user),
      message: 'Connexion réussie.',
    };
  }

  async refresh(
    userId: string,
    email: string,
    role: Role,
    res: Response,
  ): Promise<{ data: SafeUser; message: string }> {
    const tokens = await this.generateTokens({ sub: userId, email, role });

    await this.storeRefreshToken(userId, tokens.refreshToken);
    this.setCookies(res, tokens.accessToken, tokens.refreshToken);

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    return {
      data: this.sanitizeUser(user),
      message: 'Tokens renouvelés avec succès.',
    };
  }

  async logout(userId: string, res: Response): Promise<{ data: null; message: string }> {
    // Invalide le refresh token en base
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    const isProduction = this.config.get('NODE_ENV') === 'production';

    // Efface les deux cookies
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
    });
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
    });

    return { data: null, message: 'Déconnexion réussie.' };
  }

  async getMe(userId: string): Promise<{ data: SafeUser; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    return { data: this.sanitizeUser(user), message: 'Profil récupéré.' };
  }

  async changePassword(
    userId: string,
    ancienMotDePasse: string,
    nouveauMotDePasse: string,
  ): Promise<{ data: null; message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    const isValid = await bcrypt.compare(ancienMotDePasse, user.motDePasse);

    if (!isValid) {
      throw new BadRequestException('Ancien mot de passe incorrect.');
    }

    const hashedNew = await bcrypt.hash(nouveauMotDePasse, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { motDePasse: hashedNew },
    });

    return { data: null, message: 'Mot de passe mis à jour avec succès.' };
  }

  private async generateTokens(
    payload: TokenPayload,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.config.getOrThrow<string>('JWT_EXPIRES_IN') as '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN') as '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });
  }

  private setCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    const isProduction = this.config.get('NODE_ENV') === 'production';

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
    });
  }

  private sanitizeUser(user: User): SafeUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { motDePasse, refreshToken, ...safeUser } = user;
    return safeUser;
  }
}
