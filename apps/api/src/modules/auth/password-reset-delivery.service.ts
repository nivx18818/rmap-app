import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

import {
  ExternalServiceErrorException,
  InternalServerErrorException,
} from '@/common/exceptions/app.exceptions';

const DEFAULT_RESET_PASSWORD_PATH = '/reset-password';
const DEFAULT_RESET_TOKEN_TTL_MINUTES = '15';
const DEFAULT_RESET_EMAIL_SUBJECT = 'Reset your RMap password';

@Injectable()
export class PasswordResetDeliveryService {
  private readonly logger = new Logger(PasswordResetDeliveryService.name);

  constructor(private readonly configService: ConfigService) {
    if (this.isProduction()) {
      this.assertProductionSmtpConfig();
    }
  }

  async sendResetInstructions(email: string, resetToken: string): Promise<void> {
    const smtpConfig = this.getSmtpConfig();
    if (!smtpConfig) {
      this.logger.warn('Password reset SMTP is not configured; skipping delivery');
      return;
    }

    const resetUrl = this.buildResetUrl(resetToken);
    const tokenTtlMinutes =
      this.configService.get<string>('PASSWORD_RESET_TOKEN_TTL_MINUTES') ??
      DEFAULT_RESET_TOKEN_TTL_MINUTES;

    try {
      const transporter = nodemailer.createTransport({
        auth:
          smtpConfig.user && smtpConfig.pass
            ? {
                pass: smtpConfig.pass,
                user: smtpConfig.user,
              }
            : undefined,
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
      });

      await transporter.sendMail({
        from: smtpConfig.from,
        html: this.buildHtmlEmail(resetUrl, tokenTtlMinutes),
        subject: DEFAULT_RESET_EMAIL_SUBJECT,
        text: this.buildTextEmail(resetUrl, tokenTtlMinutes),
        to: email,
      });
    } catch {
      this.logger.warn('Password reset delivery failed');
      throw new ExternalServiceErrorException('Password reset delivery');
    }
  }

  private getSmtpConfig() {
    const host = this.configService.get<string>('SMTP_HOST');
    const from = this.configService.get<string>('SMTP_FROM');

    if (!host || !from) {
      return null;
    }

    const configuredPort = this.configService.get<string>('SMTP_PORT');
    const secure = this.configService.get<string>('SMTP_SECURE') === 'true';

    return {
      from,
      host,
      pass: this.configService.get<string>('SMTP_PASS'),
      port: this.parseSmtpPort(configuredPort, secure),
      secure,
      user: this.configService.get<string>('SMTP_USER'),
    };
  }

  private assertProductionSmtpConfig() {
    const host = this.configService.get<string>('SMTP_HOST');
    const from = this.configService.get<string>('SMTP_FROM');

    if (!host || !from) {
      throw new InternalServerErrorException('Password reset SMTP configuration is incomplete');
    }

    this.parseSmtpPort(this.configService.get<string>('SMTP_PORT'), this.isSmtpSecure());
  }

  private parseSmtpPort(configuredPort: string | undefined, secure: boolean) {
    const fallbackPort = secure ? 465 : 587;

    if (!configuredPort) {
      return fallbackPort;
    }

    const parsedPort = Number(configuredPort);
    const isValidPort = Number.isInteger(parsedPort) && parsedPort >= 1 && parsedPort <= 65_535;

    if (isValidPort) {
      return parsedPort;
    }

    if (this.isProduction()) {
      throw new InternalServerErrorException('Password reset SMTP port is invalid');
    }

    this.logger.warn('Password reset SMTP port is invalid; using default port');
    return fallbackPort;
  }

  private isProduction() {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }

  private isSmtpSecure() {
    return this.configService.get<string>('SMTP_SECURE') === 'true';
  }

  private buildResetUrl(resetToken: string) {
    const configuredResetUrl = this.configService.get<string>('PASSWORD_RESET_FRONTEND_URL');
    const fallbackClientUrl =
      this.configService.get<string>('CLIENT_URL') ?? 'http://localhost:3000';
    const resetUrl = configuredResetUrl ?? new URL(DEFAULT_RESET_PASSWORD_PATH, fallbackClientUrl);
    const url = new URL(resetUrl);

    url.searchParams.set('token', resetToken);

    return url.toString();
  }

  private buildTextEmail(resetUrl: string, tokenTtlMinutes: string) {
    return [
      'Reset your RMap password',
      '',
      `Use this link to reset your password: ${resetUrl}`,
      `This link expires in ${tokenTtlMinutes} minutes.`,
      '',
      'If you did not request a password reset, you can ignore this email.',
    ].join('\n');
  }

  private buildHtmlEmail(resetUrl: string, tokenTtlMinutes: string) {
    return [
      '<p>Reset your RMap password</p>',
      `<p><a href="${resetUrl}">Reset your password</a></p>`,
      `<p>This link expires in ${tokenTtlMinutes} minutes.</p>`,
      '<p>If you did not request a password reset, you can ignore this email.</p>',
    ].join('');
  }
}
