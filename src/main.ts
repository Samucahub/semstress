import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',').map(o => o.trim());
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 3600,
  });
  
  // CSP connect-src dinâmico baseado nas variáveis de ambiente
  const connectSources = ["'self'", frontendUrl, `http://localhost:${process.env.PORT || 3001}`];
  corsOrigins.forEach(origin => {
    if (!connectSources.includes(origin)) connectSources.push(origin);
  });
  
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: connectSources,
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: {
      action: 'deny',
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: {
      policy: 'no-referrer',
    },
    permittedCrossDomainPolicies: false,
  }));
  
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`✓ Backend listening on http://localhost:${port}`);
  console.log(`✓ CORS habilitado para: ${corsOrigins.join(', ')}`);
  console.log(`✓ Security headers ativados (Helmet)`);
}
bootstrap();
