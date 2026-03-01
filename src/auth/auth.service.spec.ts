import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { StatusesService } from '../statuses/statuses.service';
import { EmailService } from '../common/email/email.service';
import { CustomLoggerService } from '../common/logger/logger.service';
import { RefreshTokenService } from './refresh-token.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationCodeDto } from './dto/resend-verification-code.dto';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let emailService: EmailService;
  let statusesService: StatusesService;
  let refreshTokenService: RefreshTokenService;
  let loggerService: CustomLoggerService;

  const mockUser = {
    id: '123',
    username: 'testuser',
    email: 'test@example.com',
    password: 'HashedPassword123!',
    emailVerified: true,
    role: 'USER',
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    pendingUser: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(() => 'mock-token'),
  };

  const mockEmailService = {
    sendVerificationEmail: jest.fn(),
    sendWelcomeEmail: jest.fn(),
  };

  const mockStatusesService = {
    initializeDefaultStatuses: jest.fn(),
  };

  const mockRefreshTokenService = {
    generateRefreshToken: jest.fn(() =>
      Promise.resolve({
        token: 'mock-refresh-token',
        expiresAt: new Date(),
      }),
    ),
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    logAuth: jest.fn(),
    logSecurity: jest.fn(),
    logOperation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: StatusesService, useValue: mockStatusesService },
        { provide: CustomLoggerService, useValue: mockLoggerService },
        { provide: RefreshTokenService, useValue: mockRefreshTokenService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    emailService = module.get<EmailService>(EmailService);
    statusesService = module.get<StatusesService>(StatusesService);
    loggerService = module.get<CustomLoggerService>(CustomLoggerService);
    refreshTokenService = module.get<RefreshTokenService>(RefreshTokenService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('deve registar um utilizador com sucesso', async () => {
      const dto: RegisterDto = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'StrongPassword123!',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.pendingUser.findUnique.mockResolvedValue(null);
      mockPrismaService.pendingUser.create.mockResolvedValue({
        ...dto,
        id: '456',
      });

      const result = await service.register(dto);

      expect(result.message).toContain('Conta criada com sucesso');
      expect(result.requiresVerification).toBe(true);
      expect(result.email).toBe(dto.email);
      expect(mockPrismaService.pendingUser.create).toHaveBeenCalled();
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(
        dto.email,
        expect.any(String),
        expect.any(String), // name parameter
      );
    });

    it('deve lançar erro se username já existe', async () => {
      const dto: RegisterDto = {
        username: 'existinguser',
        email: 'new@example.com',
        password: 'StrongPassword123!',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.register(dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('deve lançar erro se email já existe', async () => {
      const dto: RegisterDto = {
        username: 'newuser',
        email: 'test@example.com',
        password: 'StrongPassword123!',
      };

      // Mock sequence: username user check -> pending username check -> email user check
      mockPrismaService.user.findUnique.mockImplementation((query: any) => {
        if (query.where.username) {
          return Promise.resolve(null); // Username doesn't exist in User table
        }
        if (query.where.email) {
          return Promise.resolve(mockUser); // Email exists in User table
        }
        return Promise.resolve(null);
      });

      mockPrismaService.pendingUser.findUnique.mockResolvedValue(null);

      await expect(service.register(dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('deve lançar erro se nem username nem email são fornecidos', async () => {
      const dto: RegisterDto = {
        password: 'StrongPassword123!',
      } as RegisterDto;

      await expect(service.register(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('login', () => {
    it('deve fazer login com sucesso', async () => {
      const dto: LoginDto = {
        username: 'testuser',
        password: 'StrongPassword123!',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(dto);

      if (!('access_token' in result)) {
        throw new Error('Esperado login autenticado com token');
      }

      expect(result.access_token).toBeDefined();
      expect(result.role).toBe('USER');
    });

    it('deve exigir verificação de email se utilizador não verificado', async () => {
      const dto: LoginDto = {
        username: 'testuser',
        password: 'StrongPassword123!',
      };

      const unverifiedUser = { ...mockUser, emailVerified: false };
      mockPrismaService.user.findUnique.mockResolvedValue(unverifiedUser);
      mockPrismaService.user.update.mockResolvedValue(unverifiedUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(dto);

      if (!('requiresVerification' in result)) {
        throw new Error('Esperado fluxo de verificação de email');
      }

      expect(result.requiresVerification).toBe(true);
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('deve lançar erro com credenciais inválidas', async () => {
      const dto: LoginDto = {
        username: 'testuser',
        password: 'WrongPassword123!',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve lançar erro se utilizador não encontrado', async () => {
      const dto: LoginDto = {
        username: 'nonexistent',
        password: 'StrongPassword123!',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve lançar erro se nem username nem email são fornecidos', async () => {
      const dto: LoginDto = {
        password: 'StrongPassword123!',
      } as LoginDto;

      await expect(service.login(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('verifyEmail', () => {
    it('deve verificar email de pending user com sucesso', async () => {
      const dto: VerifyEmailDto = {
        email: 'test@example.com',
        code: '123456',
      };

      const pendingUser = {
        ...mockUser,
        id: '456',
        name: 'Test User',
        username: 'testuser',
        verificationCode: '123456',
        verificationCodeExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
      };

      mockPrismaService.pendingUser.findUnique.mockResolvedValue(pendingUser);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockPrismaService.pendingUser.delete.mockResolvedValue(pendingUser);

      const result = await service.verifyEmail(dto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('role');
      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(mockPrismaService.pendingUser.delete).toHaveBeenCalled();
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalled();
    });

    it('deve verificar email de user existente com sucesso', async () => {
      const dto: VerifyEmailDto = {
        email: 'test@example.com',
        code: '123456',
      };

      const unverifiedUser = {
        ...mockUser,
        emailVerified: false,
        verificationCode: '123456',
        verificationCodeExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
      };

      mockPrismaService.pendingUser.findUnique.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(unverifiedUser);
      mockPrismaService.user.update.mockResolvedValue({...unverifiedUser, emailVerified: true});

      const result = await service.verifyEmail(dto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('role');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: unverifiedUser.id },
          data: expect.objectContaining({
            emailVerified: true,
          }),
        }),
      );
    });

    it('deve lançar erro se código inválido', async () => {
      const dto: VerifyEmailDto = {
        email: 'test@example.com',
        code: 'invalid',
      };

      const pendingUser = {
        ...mockUser,
        verificationCode: '123456',
        verificationCodeExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
      };

      mockPrismaService.pendingUser.findUnique.mockResolvedValue(pendingUser);

      await expect(service.verifyEmail(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar erro se código expirado', async () => {
      const dto: VerifyEmailDto = {
        email: 'test@example.com',
        code: '123456',
      };

      const expiredUser = {
        ...mockUser,
        verificationCode: '123456',
        verificationCodeExpiresAt: new Date(Date.now() - 1 * 60 * 1000), // expirado há 1 minuto
      };

      mockPrismaService.pendingUser.findUnique.mockResolvedValue(expiredUser);

      await expect(service.verifyEmail(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar erro se utilizador não encontrado', async () => {
      const dto: VerifyEmailDto = {
        email: 'nonexistent@example.com',
        code: '123456',
      };

      mockPrismaService.pendingUser.findUnique.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.verifyEmail(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('resendVerificationCode', () => {
    it('deve reenviar código de verificação com sucesso', async () => {
      const dto: ResendVerificationCodeDto = {
        email: 'test@example.com',
      };

      mockPrismaService.pendingUser.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.pendingUser.update = jest.fn().mockResolvedValue(mockUser);

      const result = await service.resendVerificationCode(dto);

      expect(result.message).toContain('código de verificação');
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('deve retornar mensagem genérica se utilizador não encontrado (segurança)', async () => {
      const dto: ResendVerificationCodeDto = {
        email: 'nonexistent@example.com',
      };

      mockPrismaService.pendingUser.findUnique.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.resendVerificationCode(dto);

      expect(result.message).toContain('Se o utilizador existe');
      // Não deve lançar erro (segurança: não revelar se utilizador existe)
    });
  });

  describe('registerAdmin', () => {
    beforeEach(() => {
      process.env.ADMIN_SETUP_KEY = 'valid-setup-key';
    });

    it('deve registar admin com sucesso', async () => {
      const dto: RegisterDto = {
        username: 'adminuser',
        email: 'admin@example.com',
        password: 'AdminPassword123!',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        ...mockUser,
        role: 'ADMIN',
      });

      const result = await service.registerAdmin(dto, 'valid-setup-key');

      expect(result.access_token).toBeDefined();
      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: 'ADMIN',
            emailVerified: true,
          }),
        }),
      );
      expect(mockStatusesService.initializeDefaultStatuses).toHaveBeenCalled();
    });

    it('deve lançar erro se setup key inválido', async () => {
      const dto: RegisterDto = {
        username: 'adminuser',
        email: 'admin@example.com',
        password: 'AdminPassword123!',
      };

      await expect(service.registerAdmin(dto, 'invalid-key')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve lançar erro se username já existe', async () => {
      const dto: RegisterDto = {
        username: 'existinguser',
        email: 'admin@example.com',
        password: 'AdminPassword123!',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.registerAdmin(dto, 'valid-setup-key')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('generateVerificationCode', () => {
    it('deve gerar um código de 6 dígitos', () => {
      const code = service['generateVerificationCode']();

      expect(code).toMatch(/^\d{6}$/);
      expect(code.length).toBe(6);
    });
  });

  describe('signToken', () => {
    it('deve assinar um token JWT válido', async () => {
      const userId = '123';
      const email = 'test@example.com';
      const role = 'USER';

      const result = await service['signToken'](userId, email, role);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).toHaveProperty('role', role);
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: userId,
          email,
          role,
        }),
      );
    });
  });
});
