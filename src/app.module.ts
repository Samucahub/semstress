import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { ReportsModule } from './reports/reports.module';
import { TasksModule } from './tasks/tasks.module';
import { TimeEntriesModule } from './time-entries/time-entries.module';
import { AdminModule } from './admin/admin.module';
import { InternshipModule } from './intership/internship.module';
import { ProjectsModule } from './projects/projects.module';
import { StatusesModule } from './statuses/statuses.module';
import { UsersModule } from './users/users.module';
import { DocumentsModule } from './documents/documents.module';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';
import { AuthRateLimitMiddleware } from './common/middleware/auth-rate-limit.middleware';
import { LoggerModule } from './common/logger/logger.module';
import { EmailModule } from './common/email/email.module';
import { MonitoringController } from './common/monitoring/monitoring.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? ['.env.production', '.env']
          : ['.env'],
    }),
    AuthModule,
    PrismaModule,
    ReportsModule,
    TasksModule,
    TimeEntriesModule,
    AdminModule,
    InternshipModule,
    ProjectsModule,
    StatusesModule,
    UsersModule,
    DocumentsModule,
    LoggerModule,
    EmailModule,
  ],
  controllers: [AppController, MonitoringController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Rate limit específico para auth (mais restritivo)
    consumer
      .apply(AuthRateLimitMiddleware)
      .forRoutes(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/register', method: RequestMethod.POST },
        { path: 'auth/verify-email', method: RequestMethod.POST },
        { path: 'auth/resend-code', method: RequestMethod.POST },
      );

    // Rate limit global (500 req / 15 min por IP)
    consumer
      .apply(RateLimitMiddleware.globalLimiter)
      .forRoutes('*');
  }
}
