import { Controller, Get, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('monitoring')
export class MonitoringController {
  constructor(private prisma: PrismaService) {}

  @Get('health')
  async health() {
    const startedAt = Date.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        statusCode: HttpStatus.OK,
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.round(process.uptime()),
        checks: {
          database: {
            status: 'up',
            responseTimeMs: Date.now() - startedAt,
          },
        },
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        status: 'degraded',
        timestamp: new Date().toISOString(),
        checks: {
          database: {
            status: 'down',
            responseTimeMs: Date.now() - startedAt,
          },
        },
      };
    }
  }

  @Get('metrics')
  metrics() {
    const memory = process.memoryUsage();

    return {
      timestamp: new Date().toISOString(),
      process: {
        uptimeSeconds: Math.round(process.uptime()),
        pid: process.pid,
        nodeVersion: process.version,
      },
      memory: {
        rss: memory.rss,
        heapTotal: memory.heapTotal,
        heapUsed: memory.heapUsed,
        external: memory.external,
        arrayBuffers: memory.arrayBuffers,
      },
      cpu: process.cpuUsage(),
    };
  }
}
