import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: config.getOrThrow<string>('GMAIL_USER'),
            pass: config.getOrThrow<string>('GMAIL_APP_PASSWORD'),
          },
        },
        defaults: {
          from: `"${config.get<string>('PHARMACIE_NOM', 'Pharmacie')} " <${config.getOrThrow<string>('GMAIL_USER')}>`,
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
