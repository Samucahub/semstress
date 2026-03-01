import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailTemplateService } from './email-template.service';
import { CustomLoggerService } from '../logger/logger.service';

@Module({
  imports: [ConfigModule],
  providers: [EmailService, EmailTemplateService, CustomLoggerService],
  exports: [EmailService, EmailTemplateService],
})
export class EmailModule {}
