import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import * as Joi from 'joi';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PatientsModule } from './patients/patients.module';
import { MedicamentsModule } from './medicaments/medicaments.module';
import { StockModule } from './stock/stock.module';
import { OrdonnancesModule } from './ordonnances/ordonnances.module';
import { VentesModule } from './ventes/ventes.module';
import { QrCodeModule } from './qrcode/qrcode.module';
import { MailModule } from './mail/mail.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FournisseursModule } from './fournisseurs/fournisseurs.module';
import { CommandesModule } from './commandes/commandes.module';
import { CodesQrModule } from './codes-qr/codes-qr.module';
import { FileAttenteModule } from './file-attente/file-attente.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { AdminScopeGuard } from './auth/guards/admin-scope.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().min(32).required(),
        JWT_EXPIRES_IN: Joi.string().default('15m'),
        JWT_REFRESH_SECRET: Joi.string().min(32).required(),
        JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
        PORT: Joi.number().default(3000),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PHARMACIE_NOM: Joi.string().default('Pharmacie Centrale'),
        GMAIL_USER: Joi.string().email().required(),
        GMAIL_APP_PASSWORD: Joi.string().required(),
        TUNNEL_HOSTNAME: Joi.string().default('pharmacie'),
      }),
      validationOptions: {
        abortEarly: false,
      },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PatientsModule,
    MedicamentsModule,
    StockModule,
    OrdonnancesModule,
    VentesModule,
    QrCodeModule,
    MailModule,
    NotificationsModule,
    FournisseursModule,
    CommandesModule,
    CodesQrModule,
    FileAttenteModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AdminScopeGuard,
    },
  ],
})
export class AppModule {}
