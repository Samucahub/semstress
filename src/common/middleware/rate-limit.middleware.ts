import rateLimit from 'express-rate-limit';
export class RateLimitMiddleware {
  public static globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 500,
    message: { error: 'Demasiadas requisições, tente novamente mais tarde' },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });

  public static loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: { error: 'Demasiadas tentativas de login, tente novamente em 15 minutos' },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: false,
  });

  public static registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 3,
    message: { error: 'Demasiadas tentativas de registo, tente novamente em 1 hora' },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });

  public static verifyEmailLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: { error: 'Demasiadas tentativas de verificação, tente novamente mais tarde' },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });

  public static resendCodeLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 3,
    message: { error: 'Demasiados reenvios de código, tente novamente em 1 hora' },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });

  public static oauthLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    message: { error: 'Demasiadas tentativas de OAuth, tente novamente em 1 hora' },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });
}
