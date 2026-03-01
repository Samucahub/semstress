import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { RefreshTokenService } from './refresh-token.service';
import { PrismaService } from '../common/prisma/prisma.service';

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUserId = 'test-user-id';
  const mockToken = 'test-refresh-token';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        {
          provide: PrismaService,
          useValue: {
            refreshToken: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
              deleteMany: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              if (key === 'REFRESH_TOKEN_SECRET') return 'test-refresh-secret';
              if (key === 'REFRESH_TOKEN_EXPIRY_DAYS') return 30;
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RefreshTokenService>(RefreshTokenService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token for a user', async () => {
      const mockRefreshToken = {
        token: mockToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      jest.spyOn(configService, 'get').mockReturnValue('30');
      jest.spyOn(jwtService, 'sign').mockReturnValue(mockToken as any);
      jest.spyOn(prismaService.refreshToken, 'create').mockResolvedValue({
        token: mockToken,
        expiresAt: mockRefreshToken.expiresAt,
      } as any);

      const result = await service.generateRefreshToken(mockUserId);

      expect(result.token).toBe(mockToken);
      expect(result.expiresAt).toBeDefined();
      expect(prismaService.refreshToken.create).toHaveBeenCalled();
    });
  });

  describe('validateRefreshToken', () => {
    it('should validate an active refresh token', async () => {
      const mockRefreshToken = {
        id: 'token-id',
        token: mockToken,
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Future date
        revoked: false,
        revokedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: mockUserId,
          email: 'test@example.com',
          role: 'USER',
        },
      };

      jest.spyOn(prismaService.refreshToken, 'findUnique').mockResolvedValue(mockRefreshToken as any);
      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: mockUserId } as any);

      const result = await service.validateRefreshToken(mockToken);

      expect(result).toBeDefined();
      expect(result?.userId).toBe(mockUserId);
      expect(result?.revoked).toBe(false);
    });

    it('should return null for revoked token', async () => {
      const revokedToken = {
        id: 'token-id',
        token: mockToken,
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        revoked: true,
        revokedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prismaService.refreshToken, 'findUnique').mockResolvedValue(revokedToken as any);

      const result = await service.validateRefreshToken(mockToken);

      expect(result).toBeNull();
    });

    it('should return null for expired token', async () => {
      const expiredToken = {
        id: 'token-id',
        token: mockToken,
        userId: mockUserId,
        expiresAt: new Date(Date.now() - 1000), // Past date
        revoked: false,
        revokedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prismaService.refreshToken, 'findUnique').mockResolvedValue(expiredToken as any);

      const result = await service.validateRefreshToken(mockToken);

      expect(result).toBeNull();
    });

    it('should return null for non-existent token', async () => {
      jest.spyOn(prismaService.refreshToken, 'findUnique').mockResolvedValue(null as any);

      const result = await service.validateRefreshToken(mockToken);

      expect(result).toBeNull();
    });
  });

  describe('revokeRefreshToken', () => {
    it('should revoke a refresh token', async () => {
      const mockRefreshToken = {
        id: 'token-id',
        token: mockToken,
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        revoked: true,
        revokedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prismaService.refreshToken, 'update').mockResolvedValue(mockRefreshToken as any);

      const result = await service.revokeRefreshToken(mockToken);

      expect(result.revoked).toBe(true);
      expect(result.revokedAt).toBeDefined();
      expect(prismaService.refreshToken.update).toHaveBeenCalled();
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should revoke all user tokens', async () => {
      const updateResult = { count: 3 };

      jest.spyOn(prismaService.refreshToken, 'updateMany').mockResolvedValue(updateResult as any);

      const result = await service.revokeAllUserTokens(mockUserId);

      expect(result.count).toBe(3);
      expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUserId, revoked: false },
        }),
      );
    });
  });

  describe('rotateRefreshToken', () => {
    it('should rotate a refresh token', async () => {
      const oldToken = 'old-token';
      const newToken = 'new-token';

      const mockOldRefreshToken = {
        id: 'old-token-id',
        token: oldToken,
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        revoked: false,
        revokedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: mockUserId,
          email: 'test@example.com',
          role: 'USER',
        },
      };

      const mockNewRefreshToken = {
        token: newToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      jest.spyOn(prismaService.refreshToken, 'findUnique').mockResolvedValue(mockOldRefreshToken as any);
      jest.spyOn(prismaService.refreshToken, 'update').mockResolvedValue(mockOldRefreshToken as any);
      jest.spyOn(configService, 'get').mockReturnValue('30');
      jest.spyOn(jwtService, 'sign').mockReturnValue(newToken as any);
      jest.spyOn(prismaService.refreshToken, 'create').mockResolvedValue(mockNewRefreshToken as any);

      const result = await service.rotateRefreshToken(oldToken, mockUserId);

      expect(result).toBeDefined();
      expect(result?.token).toBe(newToken);
      expect(prismaService.refreshToken.update).toHaveBeenCalled();
      expect(prismaService.refreshToken.create).toHaveBeenCalled();
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should delete expired tokens', async () => {
      const deleteResult = { count: 5 };

      jest.spyOn(prismaService.refreshToken, 'deleteMany').mockResolvedValue(deleteResult as any);

      const result = await service.cleanupExpiredTokens();

      expect(result.deleted).toBe(5);
      expect(prismaService.refreshToken.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.any(Object),
        }),
      );
    });
  });
});
