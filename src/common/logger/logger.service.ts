import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as path from 'path';

@Injectable()
export class CustomLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    const logsDir = path.join(process.cwd(), 'logs');

    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json(),
    );

    const transports = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ level, message, timestamp, context, ...meta }) => {
            const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
            const contextStr = context ? `[${context}]` : '';
            return `${timestamp} ${level} ${contextStr} ${message} ${metaStr}`;
          }),
        ),
      }),

      new winston.transports.File({
        filename: path.join(logsDir, 'app.log'),
        format: logFormat,
        maxsize: 5242880,
        maxFiles: 5,
      }),

      new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        format: logFormat,
        maxsize: 5242880,
        maxFiles: 5,
      }),

      new winston.transports.File({
        filename: path.join(logsDir, 'auth.log'),
        format: logFormat,
        maxsize: 5242880,
        maxFiles: 10,
      }),

      new winston.transports.File({
        filename: path.join(logsDir, 'security.log'),
        format: logFormat,
        maxsize: 5242880,
        maxFiles: 10,
      }),
    ];

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      transports,
      exceptionHandlers: [
        new winston.transports.File({
          filename: path.join(logsDir, 'exceptions.log'),
        }),
      ],
      rejectionHandlers: [
        new winston.transports.File({
          filename: path.join(logsDir, 'rejections.log'),
        }),
      ],
    });
  }

  log(message: string, context?: string, meta?: Record<string, any>) {
    this.logger.info(message, { context, ...meta });
  }

  error(message: string, trace?: string, context?: string, meta?: Record<string, any>) {
    this.logger.error(message, { trace, context, ...meta });
  }

  warn(message: string, context?: string, meta?: Record<string, any>) {
    this.logger.warn(message, { context, ...meta });
  }

  debug(message: string, context?: string, meta?: Record<string, any>) {
    this.logger.debug(message, { context, ...meta });
  }

  logAuth(event: string, identifier: string, meta?: Record<string, any>) {
    this.logger.info(`[AUTH] ${event}: ${identifier}`, {
      context: 'AuthService',
      event,
      identifier,
      timestamp: new Date().toISOString(),
      ...meta,
    });
  }

  logSecurity(event: string, type: string, meta?: Record<string, any>) {
    this.logger.warn(`[SECURITY] ${event}: ${type}`, {
      context: 'SecurityService',
      event,
      type,
      timestamp: new Date().toISOString(),
      ...meta,
    });
  }

  logOperation(operation: string, duration: number, meta?: Record<string, any>) {
    this.logger.info(`${operation} completed in ${duration}ms`, {
      context: 'PerformanceService',
      operation,
      duration,
      ...meta,
    });
  }

  getLogger(): winston.Logger {
    return this.logger;
  }
}
