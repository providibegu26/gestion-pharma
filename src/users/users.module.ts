/**
 * @file users.module.ts
 * @description Module de gestion du personnel de la pharmacie.
 * @module UsersModule
 *
 * RÔLE : Encapsuler la gestion CRUD des utilisateurs.
 * UTILISÉ PAR : AppModule
 * DÉPENDANCES : PrismaModule (global)
 * SUPPRESSION : Routes /users/* inaccessibles
 */

import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
