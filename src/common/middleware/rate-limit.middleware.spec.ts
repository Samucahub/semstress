import { RateLimitMiddleware } from './rate-limit.middleware';

describe('RateLimitMiddleware', () => {
  describe('Limiters Configuration', () => {
    it('deve ter loginLimiter definido', () => {
      expect(RateLimitMiddleware.loginLimiter).toBeDefined();
      expect(typeof RateLimitMiddleware.loginLimiter).toBe('function');
    });

    it('deve ter registerLimiter definido', () => {
      expect(RateLimitMiddleware.registerLimiter).toBeDefined();
      expect(typeof RateLimitMiddleware.registerLimiter).toBe('function');
    });

    it('deve ter verifyEmailLimiter definido', () => {
      expect(RateLimitMiddleware.verifyEmailLimiter).toBeDefined();
      expect(typeof RateLimitMiddleware.verifyEmailLimiter).toBe('function');
    });

    it('deve ter resendCodeLimiter definido', () => {
      expect(RateLimitMiddleware.resendCodeLimiter).toBeDefined();
      expect(typeof RateLimitMiddleware.resendCodeLimiter).toBe('function');
    });

    it('deve ter oauthLimiter definido', () => {
      expect(RateLimitMiddleware.oauthLimiter).toBeDefined();
      expect(typeof RateLimitMiddleware.oauthLimiter).toBe('function');
    });

    it('deve ter globalLimiter definido', () => {
      expect(RateLimitMiddleware.globalLimiter).toBeDefined();
      expect(typeof RateLimitMiddleware.globalLimiter).toBe('function');
    });
  });

  describe('Rate Limiter Functional Tests', () => {
    it('loginLimiter deve ser um middleware funcional', () => {
      // Testa se o middleware é uma função que pode ser chamada
      const middleware = RateLimitMiddleware.loginLimiter;
      expect(typeof middleware).toBe('function');
      expect(middleware.length).toBeGreaterThanOrEqual(3); // Middleware Express (req, res, next)
    });

    it('registerLimiter deve ser um middleware funcional', () => {
      const middleware = RateLimitMiddleware.registerLimiter;
      expect(typeof middleware).toBe('function');
      expect(middleware.length).toBeGreaterThanOrEqual(3);
    });

    it('verifyEmailLimiter deve ser um middleware funcional', () => {
      const middleware = RateLimitMiddleware.verifyEmailLimiter;
      expect(typeof middleware).toBe('function');
      expect(middleware.length).toBeGreaterThanOrEqual(3);
    });

    it('resendCodeLimiter deve ser um middleware funcional', () => {
      const middleware = RateLimitMiddleware.resendCodeLimiter;
      expect(typeof middleware).toBe('function');
      expect(middleware.length).toBeGreaterThanOrEqual(3);
    });

    it('oauthLimiter deve ser um middleware funcional', () => {
      const middleware = RateLimitMiddleware.oauthLimiter;
      expect(typeof middleware).toBe('function');
      expect(middleware.length).toBeGreaterThanOrEqual(3);
    });

    it('globalLimiter deve ser um middleware funcional', () => {
      const middleware = RateLimitMiddleware.globalLimiter;
      expect(typeof middleware).toBe('function');
      expect(middleware.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Rate Limiter Instances', () => {
    it('todos os limiters devem ser instâncias de middleware', () => {
      const limiters = [
        RateLimitMiddleware.loginLimiter,
        RateLimitMiddleware.registerLimiter,
        RateLimitMiddleware.verifyEmailLimiter,
        RateLimitMiddleware.resendCodeLimiter,
        RateLimitMiddleware.oauthLimiter,
        RateLimitMiddleware.globalLimiter,
      ];

      limiters.forEach((limiter) => {
        expect(limiter).toBeDefined();
        expect(typeof limiter).toBe('function');
      });
    });
  });
});
