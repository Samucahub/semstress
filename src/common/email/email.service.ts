import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';
import { CustomLoggerService } from '../logger/logger.service';
import { EmailTemplateService } from './email-template.service';

@Injectable()
export class EmailService {
  private maxRetries = 3;
  private retryDelay = 2000;

  constructor(
    private configService: ConfigService,
    private logger: CustomLoggerService,
    private templateService: EmailTemplateService,
  ) {
    const apiKey = this.configService.get('SENDGRID_API_KEY');
    if (apiKey) {
      sgMail.setApiKey(apiKey);
      this.logger.log('[Email Service] SendGrid API configured', 'EmailService');
    } else {
      this.logger.warn(
        '[Email Service] SENDGRID_API_KEY not configured',
        'EmailService',
      );
    }
  }

  private async sendEmailWithRetry(
    msg: sgMail.MailDataRequired,
    attempt: number = 1,
  ): Promise<void> {
    try {
      await sgMail.send(msg);
      this.logger.log(
        `Email sent successfully: ${msg.to}`,
        'EmailService',
        {
          subject: msg.subject,
          recipient: msg.to,
          attempt,
        },
      );
    } catch (error) {
      if (attempt < this.maxRetries) {
        this.logger.warn(
          `Email send failed, retrying (attempt ${attempt}/${this.maxRetries}): ${msg.to}`,
          'EmailService',
          { error: error.message, recipient: msg.to },
        );
        await this.delay(this.retryDelay);
        return this.sendEmailWithRetry(msg, attempt + 1);
      } else {
        this.logger.error(
          `Failed to send email after ${this.maxRetries} attempts: ${msg.to}`,
          error.stack,
          'EmailService',
          { recipient: msg.to, subject: msg.subject },
        );
        throw error;
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async sendVerificationEmail(
    email: string,
    code: string,
    name: string = 'Utilizador',
  ): Promise<void> {
    try {
      const verificationUrl = `${this.configService.get('APP_URL', 'http://localhost:3000')}/verify-email?code=${code}&email=${email}`;
      const html = this.templateService.renderVerification(
        name,
        email,
        code,
        verificationUrl,
      );

      const msg: sgMail.MailDataRequired = {
        to: email,
        from: this.configService.get('SENDGRID_FROM_EMAIL', 'noreply@cromometro.local'),
        subject: 'Verifique o seu Email - Cromometro',
        html,
      };

      await this.sendEmailWithRetry(msg);
    } catch (error) {
      this.logger.logSecurity('EMAIL_VERIFICATION_FAILED', 'verification_email', {
        recipient: email,
      });
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    try {
      const actionUrl = `${this.configService.get('APP_URL', 'http://localhost:3000')}/dashboard`;
      const html = this.templateService.renderWelcome(name, email, actionUrl);

      const msg: sgMail.MailDataRequired = {
        to: email,
        from: this.configService.get('SENDGRID_FROM_EMAIL', 'noreply@cromometro.local'),
        subject: 'Bem-vindo ao Cromometro!',
        html,
      };

      await this.sendEmailWithRetry(msg);
      this.logger.logAuth('WELCOME_EMAIL_SENT', email, { name });
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email to ${email}`,
        error.stack,
        'EmailService',
      );
      throw error;
    }
  }

  async sendPasswordResetEmail(
    email: string,
    name: string,
    resetToken: string,
  ): Promise<void> {
    try {
      const resetUrl = `${this.configService.get('APP_URL', 'http://localhost:3000')}/reset-password?token=${resetToken}&email=${email}`;
      const html = this.templateService.renderPasswordReset(
        name,
        email,
        resetUrl,
      );

      const msg: sgMail.MailDataRequired = {
        to: email,
        from: this.configService.get('SENDGRID_FROM_EMAIL', 'noreply@cromometro.local'),
        subject: 'Redefinir Senha - Cromometro',
        html,
      };

      await this.sendEmailWithRetry(msg);
      this.logger.logSecurity('PASSWORD_RESET_EMAIL_SENT', 'password_reset', {
        recipient: email,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}`,
        error.stack,
        'EmailService',
      );
      throw error;
    }
  }

  async sendTwoFAEmail(
    email: string,
    name: string,
    code: string,
  ): Promise<void> {
    try {
      const html = this.templateService.renderTwoFA(name, email, code);

      const msg: sgMail.MailDataRequired = {
        to: email,
        from: this.configService.get('SENDGRID_FROM_EMAIL', 'noreply@cromometro.local'),
        subject: 'Código de Autenticação - Cromometro',
        html,
      };

      await this.sendEmailWithRetry(msg);
      this.logger.logSecurity('TWO_FA_EMAIL_SENT', '2fa', { recipient: email });
    } catch (error) {
      this.logger.error(
        `Failed to send 2FA email to ${email}`,
        error.stack,
        'EmailService',
      );
      throw error;
    }
  }

  async sendEmailChangeConfirmation(
    email: string,
    name: string,
    newEmail: string,
    confirmationToken: string,
  ): Promise<void> {
    try {
      const confirmationUrl = `${this.configService.get('APP_URL', 'http://localhost:3000')}/confirm-email-change?token=${confirmationToken}&newEmail=${newEmail}`;
      const html = this.templateService.renderEmailChange(
        name,
        email,
        newEmail,
        confirmationUrl,
      );

      const msg: sgMail.MailDataRequired = {
        to: email,
        from: this.configService.get('SENDGRID_FROM_EMAIL', 'noreply@cromometro.local'),
        subject: 'Confirme a Mudança de Email - Cromometro',
        html,
      };

      await this.sendEmailWithRetry(msg);
      this.logger.logSecurity('EMAIL_CHANGE_CONFIRMATION_SENT', 'email_change', {
        oldEmail: email,
        newEmail,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send email change confirmation to ${email}`,
        error.stack,
        'EmailService',
      );
      throw error;
    }
  }
}
