import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';
import { AUDIT_METADATA } from '../decorators/audit.decorator';
import { CustomLoggerService } from '../logger/logger.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private prisma: PrismaService,
    private logger: CustomLoggerService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const metadata = Reflect.getMetadata(
      AUDIT_METADATA,
      context.getHandler(),
    );

    if (!metadata) {
      return next.handle();
    }

    const user = request.user;
    const startTime = Date.now();
    const ipAddress = request.ip || request.connection?.remoteAddress;
    const userAgent = request.get('user-agent');

    return next.handle().pipe(
      tap(async (response) => {
        if (user) {
          try {
            await this.prisma.auditLog.create({
              data: {
                userId: user.id,
                action: metadata.action,
                entityType: metadata.entityType,
                entityId: metadata.getEntityId?.(request, response),
                changes: metadata.getChanges?.(request, response),
                details: metadata.getDetails?.(request, response),
                ipAddress,
                userAgent,
              },
            });
          } catch (error) {
            this.logger.error('Erro ao registar atividade', undefined, 'AuditInterceptor', {
              error,
              action: metadata.action,
              entityType: metadata.entityType,
              userId: user.id,
            });
          }
        }
      }),
      catchError(async (error) => {
        if (user && metadata.logErrors) {
          try {
            await this.prisma.auditLog.create({
              data: {
                userId: user.id,
                action: `${metadata.action}_FAILED`,
                entityType: metadata.entityType,
                details: error.message,
                ipAddress,
                userAgent,
              },
            });
          } catch (auditError) {
            this.logger.error('Erro ao registar erro de atividade', undefined, 'AuditInterceptor', {
              auditError,
              action: `${metadata.action}_FAILED`,
              entityType: metadata.entityType,
              userId: user.id,
            });
          }
        }
        throw error;
      }),
    );
  }
}
