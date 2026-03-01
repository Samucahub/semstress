import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { CustomLoggerService } from '../logger/logger.service';
import { EmailTemplateService } from './email-template.service';
@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private maxRetries = 3;
  private retryDelay = 5000;

  constructor(
    private configService: ConfigService,
    private logger: CustomLoggerService,
    private templateService: EmailTemplateService,
  ) {
    const mailSecure = `${this.configService.get('MAIL_SECURE', 'false')}`.toLowerCase() === 'true';

    this.transporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST', 'localhost'),
      port: this.configService.get('MAIL_PORT', 1025),
      secure: mailSecure,
      auth: this.configService.get('MAIL_USER')
        ? {
            user: this.configService.get('MAIL_USER'),
            pass: this.configService.get('MAIL_PASS'),
          }
        : undefined,
    });

    this.verifyTransporter();
  }

  private async verifyTransporter() {
    try {
      await this.transporter.verify();
      this.logger.log('[Email Service] SMTP connection verified', 'EmailService');
    } catch (error) {
      this.logger.warn(
        '[Email Service] SMTP connection failed, using fallback mode',
        'EmailService',
        { error: error.message },
      );
    }
  }

  private async sendEmailWithRetry(
    mailOptions: nodemailer.SendMailOptions,
    attempt: number = 1,
  ): Promise<void> {
    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Email sent successfully: ${mailOptions.to}`,
        'EmailService',
        {
          subject: mailOptions.subject,
          recipient: mailOptions.to,
          attempt,
        },
      );
    } catch (error) {
      if (attempt < this.maxRetries) {
        this.logger.warn(
          `Email send failed, retrying (attempt ${attempt}/${this.maxRetries}): ${mailOptions.to}`,
          'EmailService',
          { error: error.message, recipient: mailOptions.to },
        );
        await this.delay(this.retryDelay);
        return this.sendEmailWithRetry(mailOptions, attempt + 1);
      } else {
        this.logger.error(
          `Failed to send email after ${this.maxRetries} attempts: ${mailOptions.to}`,
          error.stack,
          'EmailService',
          { recipient: mailOptions.to, subject: mailOptions.subject },
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

      const mailOptions = {
        from: this.configService.get('MAIL_FROM', 'noreply@cromometro.com'),
        to: email,
        subject: 'Verifique o seu Email - Cromometro',
        html,
      };

      await this.sendEmailWithRetry(mailOptions);
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

      const mailOptions = {
        from: this.configService.get('MAIL_FROM', 'noreply@cromometro.com'),
        to: email,
        subject: 'Bem-vindo ao Cromometro!',
        html,
      };

      await this.sendEmailWithRetry(mailOptions);
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

      const mailOptions = {
        from: this.configService.get('MAIL_FROM', 'noreply@cromometro.com'),
        to: email,
        subject: 'Redefinir Senha - Cromometro',
        html,
      };

      await this.sendEmailWithRetry(mailOptions);
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

      const mailOptions = {
        from: this.configService.get('MAIL_FROM', 'noreply@cromometro.com'),
        to: email,
        subject: 'Código de Autenticação - Cromometro',
        html,
      };

      await this.sendEmailWithRetry(mailOptions);
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

      const mailOptions = {
        from: this.configService.get('MAIL_FROM', 'noreply@cromometro.com'),
        to: email,
        subject: 'Confirme a Mudança de Email - Cromometro',
        html,
      };

      await this.sendEmailWithRetry(mailOptions);
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
