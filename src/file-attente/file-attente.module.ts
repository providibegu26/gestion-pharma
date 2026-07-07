import { Module } from '@nestjs/common';
import { FileAttenteService } from './file-attente.service';
import { FileAttenteController } from './file-attente.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [FileAttenteController],
  providers: [FileAttenteService],
  exports: [FileAttenteService],
})
export class FileAttenteModule {}
