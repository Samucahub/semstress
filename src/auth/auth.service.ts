import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { StatusesService } from '../statuses/statuses.service';
import { EmailService } from '../common/email/email.service';
import { CustomLoggerService } from '../common/logger/logger.service';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationCodeDto } from './dto/resend-verification-code.dto';
import { OAuthCallbackDto } from './dto/oauth-callback.dto';
import { RefreshTokenService } from './refresh-token.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private statusesService: StatusesService,
    private emailService: EmailService,
    private logger: CustomLoggerService,
    private refreshTokenService: RefreshTokenService,
  ) {}

  async register(dto: RegisterDto) {
    if (!dto.email && !dto.username) {
      throw new BadRequestException('Username ou email são obrigatórios');
    }

    if (!dto.username) {
      throw new BadRequestException('Username é obrigatório');
    }

    const existingUserByUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (existingUserByUsername) {
      this.logger.logSecurity('REGISTRATION_FAILED_USERNAME_EXISTS', 'duplicate_username', {
        username: dto.username,
      });
      throw new ConflictException('Username já está em uso');
    }

    const existingPendingByUsername = await this.prisma.pendingUser.findUnique({
      where: { username: dto.username },
    });

    if (existingPendingByUsername) {
      this.logger.logSecurity('REGISTRATION_FAILED_USERNAME_EXISTS', 'duplicate_username', {
        username: dto.username,
      });
      throw new ConflictException('Username já está em uso');
    }

    if (dto.email) {
      const existingUserByEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUserByEmail) {
        this.logger.logSecurity('REGISTRATION_FAILED_EMAIL_EXISTS', 'duplicate_email', {
          email: dto.email,
        });
        throw new ConflictException('Email já registado');
      }

      const existingPendingByEmail = await this.prisma.pendingUser.findUnique({
        where: { email: dto.email },
      });

      if (existingPendingByEmail) {
        await this.prisma.pendingUser.delete({
          where: { email: dto.email },
        });
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const verificationCode = this.generateVerificationCode();

    await this.prisma.pendingUser.create({
      data: {
        name: dto.name || dto.username,
        username: dto.username,
        email: dto.email || `${dto.username}@pending.local`,
        password: hashedPassword,
        verificationCode,
        verificationCodeExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
    
    const emailToSend = dto.email || `${dto.username}@pending.local`;
    if (dto.email) {
      // Envio de email não deve bloquear o registo
      this.emailService.sendVerificationEmail(dto.email, verificationCode, dto.name || dto.username)
        .catch(err => {
          this.logger.error(`Failed to send verification email to ${dto.email}: ${err.message}`, err.stack, 'AuthService');
        });
    }

    this.logger.logAuth('REGISTER_INITIATED', dto.email || dto.username, {
      username: dto.username,
      email: dto.email,
    });

    return {
      message: 'Conta criada com sucesso. Verifica o teu email para completar o registo.',
      requiresVerification: true,
      email: dto.email,
      username: dto.username,
    };
  }

  async login(dto: LoginDto) {
    if (!dto.email && !dto.username) {
      throw new BadRequestException('Username ou email são obrigatórios');
    }

    let user;
    
    if (dto.username) {
      user = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
    }

    if (!user && dto.email) {
      user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
    }

    if (!user || !user.password) {
      this.logger.logSecurity('LOGIN_FAILED_INVALID_CREDENTIALS', 'invalid_user', {
        identifier: dto.username || dto.email,
      });
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);

    if (!passwordMatch) {
      this.logger.logSecurity('LOGIN_FAILED_INVALID_PASSWORD', 'invalid_password', {
        userId: user.id,
        email: user.email,
      });
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!user.emailVerified) {
      const verificationCode = this.generateVerificationCode();
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          verificationCode,
          verificationCodeExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      await this.emailService.sendVerificationEmail(user.email, verificationCode, user.name);

      this.logger.logAuth('LOGIN_INITIATED_AWAITING_VERIFICATION', user.email, {
        userId: user.id,
      });

      return {
        message: 'Credenciais válidas. Verifica o teu email para completar o login.',
        requiresVerification: true,
        email: user.email,
      };
    }

    this.logger.logAuth('AUTH_LOGIN_SUCCESS', user.email, {
      userId: user.id,
      username: user.username,
    });

    return this.signToken(user.id, user.email, user.role);
  }

  async registerAdmin(dto: RegisterDto, setupKey: string | undefined) {
    if (!process.env.ADMIN_SETUP_KEY || setupKey !== process.env.ADMIN_SETUP_KEY) {
      throw new UnauthorizedException('Setup inválido');
    }

    if (!dto.username) {
      throw new BadRequestException('Username é obrigatório');
    }

    const existsByUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (existsByUsername) {
      throw new ConflictException('Username já está em uso');
    }

    if (dto.email) {
      const existsByEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existsByEmail) {
        throw new ConflictException('Email já registado');
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const verificationCode = this.generateVerificationCode();

    const user = await this.prisma.user.create({
      data: {
        name: dto.name || dto.username,
        username: dto.username,
        email: dto.email || `${dto.username}@admin.local`,
        password: hashedPassword,
        role: 'ADMIN',
        verificationCode,
        verificationCodeExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        emailVerified: true,
      },
    });

    await this.statusesService.initializeDefaultStatuses(user.id);

    return this.signToken(user.id, user.email, user.role);
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const pendingUser = await this.prisma.pendingUser.findUnique({
      where: { email: dto.email },
    });

    if (pendingUser) {
      if (pendingUser.verificationCodeExpiresAt < new Date()) {
        throw new BadRequestException('Código de verificação expirado');
      }

      if (pendingUser.verificationCode !== dto.code) {
        throw new BadRequestException('Código de verificação inválido');
      }

      const user = await this.prisma.user.create({
        data: {
          name: pendingUser.name,
          username: pendingUser.username,
          email: pendingUser.email,
          password: pendingUser.password,
          role: 'USER',
          emailVerified: true,
        },
      });

      await this.statusesService.initializeDefaultStatuses(user.id);

      await this.prisma.pendingUser.delete({
        where: { email: dto.email },
      });

      await this.emailService.sendWelcomeEmail(user.email, user.name);

      return this.signToken(user.id, user.email, user.role);
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Utilizador não encontrado');
    }

    if (!user.verificationCode || !user.verificationCodeExpiresAt) {
      throw new BadRequestException('Não existe código de verificação pendente');
    }

    if (user.verificationCodeExpiresAt < new Date()) {
      throw new BadRequestException('Código de verificação expirado');
    }

    if (user.verificationCode !== dto.code) {
      throw new BadRequestException('Código de verificação inválido');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
      },
    });

    await this.emailService.sendWelcomeEmail(updatedUser.email, updatedUser.name);

    return this.signToken(updatedUser.id, updatedUser.email, updatedUser.role);
  }

  async resendVerificationCode(dto: ResendVerificationCodeDto) {
    if (!dto.email && !dto.username) {
      throw new BadRequestException('Username ou email são obrigatórios');
    }

    let pendingUser;
    if (dto.username) {
      pendingUser = await this.prisma.pendingUser.findUnique({
        where: { username: dto.username },
      });
    }

    if (!pendingUser && dto.email) {
      pendingUser = await this.prisma.pendingUser.findUnique({
        where: { email: dto.email },
      });
    }

    if (pendingUser) {
      const verificationCode = this.generateVerificationCode();

      await this.prisma.pendingUser.update({
        where: { id: pendingUser.id },
        data: {
          verificationCode,
          verificationCodeExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      const emailToSend = dto.email || pendingUser.email;
      if (emailToSend && !emailToSend.endsWith('@pending.local')) {
        this.emailService.sendVerificationEmail(emailToSend, verificationCode)
          .catch(err => {
            this.logger.error(
              `Failed to resend verification email to ${emailToSend}: ${err.message}`,
              err.stack,
              'AuthService',
            );
          });
      }

      return {
        message: 'Novo código de verificação enviado para o teu email.',
      };
    }

    let user;
    if (dto.username) {
      user = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
    }

    if (!user && dto.email) {
      user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
    }

    if (!user) {
      return {
        message: 'Se o utilizador existe na nossa base de dados, receberá um novo código em breve.',
      };
    }

    const verificationCode = this.generateVerificationCode();

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode,
        verificationCodeExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    this.emailService.sendVerificationEmail(user.email, verificationCode)
      .catch(err => {
        this.logger.error(
          `Failed to resend verification email to ${user.email}: ${err.message}`,
          err.stack,
          'AuthService',
        );
      });

    return {
      message: 'Novo código de verificação enviado para o teu email.',
    };
  }

  async handleOAuthCallback(dto: OAuthCallbackDto) {
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email },
          dto.provider === 'google' ? { googleId: dto.id } : { githubId: dto.id },
        ],
      },
    });

    if (!user) {
      let username = dto.email.split('@')[0];
      let counter = 1;
      
      while (await this.prisma.user.findUnique({ where: { username } })) {
        username = `${dto.email.split('@')[0]}${counter}`;
        counter++;
      }

      user = await this.prisma.user.create({
        data: {
          name: dto.name,
          username,
          email: dto.email,
          ...(dto.provider === 'google' ? { googleId: dto.id } : { githubId: dto.id }),
          emailVerified: true,
          role: 'USER',
        },
      });

      await this.statusesService.initializeDefaultStatuses(user.id);
      await this.emailService.sendWelcomeEmail(user.email, user.name);
    } else {
      if (dto.provider === 'google' && !user.googleId) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId: dto.id },
        });
      } else if (dto.provider === 'github' && !user.githubId) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { githubId: dto.id },
        });
      }
    }

    return this.signToken(user.id, user.email, user.role);
  }

  private async signToken(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const access_token = this.jwtService.sign(payload);
    
    const refreshToken = await this.refreshTokenService.generateRefreshToken(userId);

    return {
      access_token,
      refresh_token: refreshToken.token,
      token_type: 'Bearer',
      expires_in: 24 * 60 * 60,
      role,
    };
  }

  async refreshAccessToken(dto: RefreshTokenDto) {
    // Rotação do refresh token: revoga o antigo e gera um novo
    const refreshToken = await this.refreshTokenService.validateRefreshToken(
      dto.refresh_token,
    );

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    const user = refreshToken.user;

    // Revogar o token antigo e gerar um novo (rotação)
    const newRefreshToken = await this.refreshTokenService.rotateRefreshToken(
      dto.refresh_token,
      user.id,
    );

    if (!newRefreshToken) {
      throw new UnauthorizedException('Falha ao renovar sessão. Faz login novamente.');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      refresh_token: newRefreshToken.token,
      token_type: 'Bearer',
      expires_in: 24 * 60 * 60,
      role: user.role,
    };
  }

  async logout(refreshToken: string) {
    if (refreshToken) {
      try {
        await this.refreshTokenService.revokeRefreshToken(refreshToken);
      } catch {
      }
    }

    return {
      message: 'Logout realizado com sucesso',
    };
  }

  async logoutAll(userId: string) {
    await this.refreshTokenService.revokeAllUserTokens(userId);

    return {
      message: 'Logout realizado em todos os dispositivos',
    };
  }

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
