import { Injectable } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { CustomLoggerService } from '../logger/logger.service';

export interface EmailTemplateData {
  name: string;
  email?: string;
  appName?: string;
  year?: number;
  supportEmail?: string;
  privacyUrl?: string;
  termsUrl?: string;
  supportUrl?: string;
  [key: string]: any;
}

export enum EmailTemplateType {
  WELCOME = 'welcome',
  VERIFICATION = 'verification',
  PASSWORD_RESET = 'password-reset',
  TWO_FA = 'two-fa',
  EMAIL_CHANGE = 'email-change',
}

@Injectable()
export class EmailTemplateService {
  private templates: Map<EmailTemplateType, Handlebars.TemplateDelegate> = new Map();
  private defaultData: Partial<EmailTemplateData>;

  constructor(private logger: CustomLoggerService) {
    this.loadAllTemplates();
    this.setupDefaultData();
  }

  private loadAllTemplates() {
    const templatesDir = path.join(process.cwd(), 'src', 'common', 'email', 'templates');

    try {
      for (const templateType of Object.values(EmailTemplateType)) {
        const templatePath = path.join(templatesDir, `${templateType}.hbs`);
        if (fs.existsSync(templatePath)) {
          const templateContent = fs.readFileSync(templatePath, 'utf-8');
          this.templates.set(
            templateType,
            Handlebars.compile(templateContent),
          );
          this.logger.debug(`Email template loaded: ${templateType}`);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to load email templates: ${error.message}`);
    }
  }

  private setupDefaultData() {
    this.defaultData = {
      appName: process.env.APP_NAME || 'Cromometro',
      year: new Date().getFullYear(),
      supportEmail: process.env.SUPPORT_EMAIL || 'support@cromometro.com',
      privacyUrl: process.env.PRIVACY_URL || 'https://cromometro.com/privacy',
      termsUrl: process.env.TERMS_URL || 'https://cromometro.com/terms',
      supportUrl: process.env.SUPPORT_URL || 'https://cromometro.com/support',
    };
  }

  render(
    templateType: EmailTemplateType,
    data: EmailTemplateData,
  ): string {
    try {
      const template = this.templates.get(templateType);

      if (!template) {
        throw new Error(`Template not found: ${templateType}`);
      }

      const mergedData = {
        ...this.defaultData,
        ...data,
      };

      const html = template(mergedData);

      this.logger.debug(`Email template rendered: ${templateType}`, undefined, {
        recipient: data.email,
      });

      return html;
    } catch (error) {
      this.logger.error(
        `Failed to render email template: ${error.message}`,
        error.stack,
        'EmailTemplateService',
        { templateType },
      );
      throw error;
    }
  }

  renderWelcome(name: string, email: string, actionUrl: string): string {
    return this.render(EmailTemplateType.WELCOME, {
      name,
      email,
      actionUrl,
    });
  }

  renderVerification(
    name: string,
    email: string,
    verificationCode: string,
    verificationUrl: string,
    expiryTime: string = '24 horas',
  ): string {
    return this.render(EmailTemplateType.VERIFICATION, {
      name,
      email,
      verificationCode,
      verificationUrl,
      expiryTime,
    });
  }

  renderPasswordReset(
    name: string,
    email: string,
    resetUrl: string,
    expiryTime: string = '1 hora',
  ): string {
    return this.render(EmailTemplateType.PASSWORD_RESET, {
      name,
      email,
      resetUrl,
      expiryTime,
    });
  }


  renderTwoFA(
    name: string,
    email: string,
    code: string,
    expiryTime: string = '10 minutos',
  ): string {
    return this.render(EmailTemplateType.TWO_FA, {
      name,
      email,
      code,
      expiryTime,
    });
  }

  renderEmailChange(
    name: string,
    email: string,
    newEmail: string,
    confirmationUrl: string,
    expiryTime: string = '24 horas',
  ): string {
    return this.render(EmailTemplateType.EMAIL_CHANGE, {
      name,
      email,
      newEmail,
      confirmationUrl,
      expiryTime,
    });
  }

  getAvailableTemplates(): EmailTemplateType[] {
    return Array.from(this.templates.keys());
  }

  hasTemplate(templateType: EmailTemplateType): boolean {
    return this.templates.has(templateType);
  }

  registerHelper(name: string, fn: Handlebars.HelperDelegate) {
    Handlebars.registerHelper(name, fn);
    this.logger.debug(`Handlebars helper registered: ${name}`);
  }
}
