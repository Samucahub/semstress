import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RefreshTokenService {
  private readonly refreshTokenSecret: string;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    const secret = this.configService.get<string>('REFRESH_TOKEN_SECRET');
    if (!secret) {
      throw new Error(
        'FATAL: REFRESH_TOKEN_SECRET não está definido nas variáveis de ambiente. ' +
        'A aplicação não pode iniciar sem esta variável.',
      );
    }
    this.refreshTokenSecret = secret;
  }

  async generateRefreshToken(userId: string) {
    const expiresInDays = this.configService.get('REFRESH_TOKEN_EXPIRY_DAYS', 30);
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const payload = {
      sub: userId,
      type: 'refresh',
    };

    const token = this.jwtService.sign(payload, {
      secret: this.refreshTokenSecret,
      expiresIn: `${expiresInDays}d`,
    });

    const refreshToken = await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return {
      token: refreshToken.token,
      expiresAt: refreshToken.expiresAt,
    };
  }

  async validateRefreshToken(token: string) {
    try {
      const refreshToken = await this.prisma.refreshToken.findUnique({
        where: { token },
        include: { user: true },
      });

      if (
        !refreshToken ||
        refreshToken.revoked ||
        refreshToken.expiresAt < new Date()
      ) {
        return null;
      }

      try {
        this.jwtService.verify(token, {
          secret: this.refreshTokenSecret,
        });
      } catch {
        return null;
      }

      return refreshToken;
    } catch {
      return null;
    }
  }

  async revokeRefreshToken(token: string) {
    return await this.prisma.refreshToken.update({
      where: { token },
      data: {
        revoked: true,
        revokedAt: new Date(),
      },
    });
  }

  async revokeAllUserTokens(userId: string) {
    return await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: {
        revoked: true,
        revokedAt: new Date(),
      },
    });
  }

  async cleanupExpiredTokens() {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return {
      deleted: result.count,
    };
  }

  async rotateRefreshToken(oldToken: string, userId: string) {
    const refreshToken = await this.validateRefreshToken(oldToken);
    if (!refreshToken || refreshToken.userId !== userId) {
      return null;
    }
    await this.revokeRefreshToken(oldToken);

    return this.generateRefreshToken(userId);
  }
}
