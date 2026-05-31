import type { TestingModule } from '@nestjs/testing';

import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as nodemailer from 'nodemailer';

import {
  ExternalServiceErrorException,
  InternalServerErrorException,
} from '@/common/exceptions/app.exceptions';
import { PasswordResetDeliveryService } from '@/modules/auth/password-reset-delivery.service';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

describe('PasswordResetDeliveryService', () => {
  let configService: { get: jest.Mock<string | undefined, [string]> };
  let sendMail: jest.Mock<Promise<unknown>, [unknown]>;
  let createTransport: jest.MockedFunction<typeof nodemailer.createTransport>;
  let loggerWarn: jest.SpyInstance;

  const createService = async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordResetDeliveryService,
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    return module.get<PasswordResetDeliveryService>(PasswordResetDeliveryService);
  };

  const mockConfig = (overrides: Record<string, string | undefined> = {}) => {
    const values: Record<string, string | undefined> = {
      CLIENT_URL: 'http://localhost:3000/',
      NODE_ENV: 'test',
      PASSWORD_RESET_FRONTEND_URL: 'https://app.example.com/reset-password',
      PASSWORD_RESET_TOKEN_TTL_MINUTES: '15',
      SMTP_FROM: 'RMap <no-reply@example.com>',
      SMTP_HOST: 'smtp.example.com',
      SMTP_PASS: 'smtp-pass',
      SMTP_PORT: '587',
      SMTP_SECURE: 'false',
      SMTP_USER: 'smtp-user',
      ...overrides,
    };

    configService.get.mockImplementation((key) => values[key]);
  };
  const expectStringContaining = (value: string): string =>
    expect.stringContaining(value) as string;
  const expectObjectContaining = <T extends object>(value: T): T =>
    expect.objectContaining(value) as T;

  beforeEach(() => {
    sendMail = jest.fn<Promise<unknown>, [unknown]>().mockResolvedValue({});
    createTransport = jest.mocked(nodemailer.createTransport);
    configService = {
      get: jest.fn<string | undefined, [string]>(),
    };
    loggerWarn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    createTransport.mockReturnValue({
      sendMail,
    } as unknown as ReturnType<typeof nodemailer.createTransport>);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be a no-op when SMTP is not configured', async () => {
    mockConfig({ SMTP_FROM: undefined, SMTP_HOST: undefined });
    const service = await createService();

    await service.sendResetInstructions('jane@example.com', 'raw-reset-token');

    expect(nodemailer.createTransport).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
    expect(loggerWarn).toHaveBeenCalledWith(
      'Password reset SMTP is not configured; skipping delivery',
    );
  });

  it('should fail in production when SMTP host is missing', async () => {
    mockConfig({ NODE_ENV: 'production', SMTP_HOST: undefined });

    await expect(createService()).rejects.toThrow(InternalServerErrorException);
  });

  it('should fail in production when SMTP from address is missing', async () => {
    mockConfig({ NODE_ENV: 'production', SMTP_FROM: undefined });

    await expect(createService()).rejects.toThrow(InternalServerErrorException);
  });

  it('should send reset instructions with a frontend reset link', async () => {
    mockConfig();
    const service = await createService();

    await service.sendResetInstructions('jane@example.com', 'raw-reset-token');

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      auth: {
        pass: 'smtp-pass',
        user: 'smtp-user',
      },
      host: 'smtp.example.com',
      port: 587,
      secure: false,
    });
    expect(sendMail).toHaveBeenCalledWith({
      from: 'RMap <no-reply@example.com>',
      html: expectStringContaining('https://app.example.com/reset-password?token=raw-reset-token'),
      subject: 'Reset your RMap password',
      text: expectStringContaining('https://app.example.com/reset-password?token=raw-reset-token'),
      to: 'jane@example.com',
    });
  });

  it('should fall back to the default port when SMTP_PORT is invalid outside production', async () => {
    mockConfig({ SMTP_PORT: 'invalid' });
    const service = await createService();

    await service.sendResetInstructions('jane@example.com', 'raw-reset-token');

    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expectObjectContaining({
        port: 587,
      }),
    );
    expect(loggerWarn).toHaveBeenCalledWith(
      'Password reset SMTP port is invalid; using default port',
    );
  });

  it('should fail in production when SMTP_PORT is invalid', async () => {
    mockConfig({ NODE_ENV: 'production', SMTP_PORT: 'invalid' });

    await expect(createService()).rejects.toThrow(InternalServerErrorException);
  });

  it('should use port 465 when SMTP_SECURE is true and SMTP_PORT is not configured', async () => {
    mockConfig({ SMTP_PORT: undefined, SMTP_SECURE: 'true' });
    const service = await createService();

    await service.sendResetInstructions('jane@example.com', 'raw-reset-token');

    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expectObjectContaining({
        port: 465,
        secure: true,
      }),
    );
  });

  it('should omit SMTP auth when credentials are not configured', async () => {
    mockConfig({ SMTP_PASS: undefined, SMTP_USER: undefined });
    const service = await createService();

    await service.sendResetInstructions('jane@example.com', 'raw-reset-token');

    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expectObjectContaining({
        auth: undefined,
      }),
    );
  });

  it('should fall back to CLIENT_URL when PASSWORD_RESET_FRONTEND_URL is not configured', async () => {
    mockConfig({ PASSWORD_RESET_FRONTEND_URL: undefined });
    const service = await createService();

    await service.sendResetInstructions('jane@example.com', 'raw-reset-token');

    expect(sendMail).toHaveBeenCalledWith(
      expectObjectContaining({
        text: expectStringContaining('http://localhost:3000/reset-password?token=raw-reset-token'),
      }),
    );
  });

  it('should fail when SMTP rejects the message', async () => {
    mockConfig();
    sendMail.mockRejectedValue(new Error('smtp failed'));
    const service = await createService();

    await expect(
      service.sendResetInstructions('jane@example.com', 'raw-reset-token'),
    ).rejects.toThrow(ExternalServiceErrorException);
    expect(loggerWarn).toHaveBeenCalledWith('Password reset delivery failed');
  });
});
