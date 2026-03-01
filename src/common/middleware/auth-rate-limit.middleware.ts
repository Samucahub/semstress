import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RateLimitMiddleware } from './rate-limit.middleware';

export class AuthRateLimitMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const path = req.path;

    if (path.includes('/register') && req.method === 'POST') {
      return RateLimitMiddleware.registerLimiter(req, res, next);
    }
    if (path.includes('/login') && req.method === 'POST') {
      return RateLimitMiddleware.loginLimiter(req, res, next);
    }
    if (path.includes('/verify-email')) {
      return RateLimitMiddleware.verifyEmailLimiter(req, res, next);
    }
    if (path.includes('/resend-code')) {
      return RateLimitMiddleware.resendCodeLimiter(req, res, next);
    }
    if (path.includes('/google') || path.includes('/github')) {
      return RateLimitMiddleware.oauthLimiter(req, res, next);
    }

    next();
  }
}
