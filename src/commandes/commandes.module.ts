import { Module } from '@nestjs/common';
import { CommandesService } from './commandes.service';
import { CommandesController } from './commandes.controller';
import { QrCodeModule } from '../qrcode/qrcode.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [QrCodeModule, NotificationsModule],
  controllers: [CommandesController],
  providers: [CommandesService],
})
export class CommandesModule {}
