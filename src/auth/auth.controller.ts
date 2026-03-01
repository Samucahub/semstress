import { Controller, Post, Body, Headers, UseGuards, Get, Req, Res, Query, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { randomBytes } from 'crypto';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationCodeDto } from './dto/resend-verification-code.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

// Armazena códigos de autorização temporários (expiram em 60s)
const authCodes = new Map<string, { token: string; role: string; expiresAt: number }>();

// Limpar códigos expirados a cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [code, data] of authCodes.entries()) {
    if (data.expiresAt < now) authCodes.delete(code);
  }
}, 5 * 60 * 1000);

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('resend-code')
  resendCode(@Body() dto: ResendVerificationCodeDto) {
    return this.authService.resendVerificationCode(dto);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req, @Res() res) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    try {
      const result = await this.authService.handleOAuthCallback({
        provider: 'google',
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        picture: req.user.picture,
      });

      // Gerar código de autorização temporário em vez de passar o token na URL
      const code = randomBytes(32).toString('hex');
      authCodes.set(code, {
        token: result.access_token,
        role: result.role,
        expiresAt: Date.now() + 60 * 1000, // expira em 60 segundos
      });

      res.redirect(`${frontendUrl}/auth/callback?code=${code}`);
    } catch (error) {
      res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error.message)}`);
    }
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthCallback(@Req() req, @Res() res) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    try {
      const result = await this.authService.handleOAuthCallback({
        provider: 'github',
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        picture: req.user.picture,
      });

      // Gerar código de autorização temporário em vez de passar o token na URL
      const code = randomBytes(32).toString('hex');
      authCodes.set(code, {
        token: result.access_token,
        role: result.role,
        expiresAt: Date.now() + 60 * 1000, // expira em 60 segundos
      });

      res.redirect(`${frontendUrl}/auth/callback?code=${code}`);
    } catch (error) {
      res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error.message)}`);
    }
  }

  // Endpoint para trocar o código de autorização pelo token real
  @Post('exchange-code')
  async exchangeCode(@Body() body: { code: string }) {
    const data = authCodes.get(body.code);
    if (!data || data.expiresAt < Date.now()) {
      authCodes.delete(body.code);
      throw new UnauthorizedException('Código de autorização inválido ou expirado.');
    }
    // Código é de uso único — eliminar imediatamente
    authCodes.delete(body.code);
    return { access_token: data.token, role: data.role };
  }

  @Post('register-admin')
  registerAdmin(
    @Body() dto: RegisterDto,
    @Headers('x-setup-key') setupKey?: string,
  ) {
    return this.authService.registerAdmin(dto, setupKey);
  }

  @Post('refresh-token')
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshAccessToken(dto);
  }

  @Post('logout')
  async logout(@Body() body: { refresh_token?: string }) {
    return this.authService.logout(body.refresh_token || '');
  }

  @Post('logout-all')
  @UseGuards(AuthGuard('jwt'))
  async logoutAll(@Req() req) {
    const userId = req.user.sub || req.user.id;
    return this.authService.logoutAll(userId);
  }
}
