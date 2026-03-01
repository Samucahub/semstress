import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateAuditLogDto {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  changes?: any;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(dto: CreateAuditLogDto) {
    return this.prisma.auditLog.create({
      data: {
        userId: dto.userId,
        action: dto.action,
        entityType: dto.entityType,
        entityId: dto.entityId,
        changes: dto.changes,
        details: dto.details,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
      },
    });
  }

  async getRecentActivity(limit: number = 50) {
    return this.prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, username: true, email: true },
        },
      },
    });
  }

  async getUserActivity(userId: string, limit: number = 100) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, username: true },
        },
      },
    });
  }

  async getActivityByEntityType(entityType: string, limit: number = 100) {
    return this.prisma.auditLog.findMany({
      where: { entityType },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, username: true },
        },
      },
    });
  }

  async getActivityStats(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.prisma.auditLog.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        action: true,
        entityType: true,
        createdAt: true,
        userId: true,
      },
    });

    // Agrupar por dia
    const dailyStats: Record<string, number> = {};
    const actionStats: Record<string, number> = {};
    const entityTypeStats: Record<string, number> = {};
    const userActivity: Record<string, number> = {};

    logs.forEach((log) => {
      const date = new Date(log.createdAt).toISOString().split('T')[0];
      dailyStats[date] = (dailyStats[date] || 0) + 1;
      actionStats[log.action] = (actionStats[log.action] || 0) + 1;
      entityTypeStats[log.entityType] = (entityTypeStats[log.entityType] || 0) + 1;
      userActivity[log.userId] = (userActivity[log.userId] || 0) + 1;
    });

    return {
      dailyStats,
      actionStats,
      entityTypeStats,
      userActivity,
      totalLogs: logs.length,
    };
  }
}
