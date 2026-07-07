import { Module } from '@nestjs/common';
import { CodesQrController } from './codes-qr.controller';
import { CodesQrService } from './codes-qr.service';
import { QrCodeModule } from '../qrcode/qrcode.module';

@Module({
  imports: [QrCodeModule],
  controllers: [CodesQrController],
  providers: [CodesQrService],
  exports: [CodesQrService],
})
export class CodesQrModule {}
