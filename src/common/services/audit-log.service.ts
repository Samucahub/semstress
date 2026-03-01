import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomLoggerService } from '../logger/logger.service';

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
export class AuditLogService {
  constructor(
    private prisma: PrismaService,
    private logger: CustomLoggerService,
  ) {}

  async log(dto: CreateAuditLogDto) {
    try {
      return await this.prisma.auditLog.create({
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
    } catch (error) {
      this.logger.error('Erro ao registar log de auditoria', undefined, 'AuditLogService', {
        error,
        action: dto.action,
        entityType: dto.entityType,
        userId: dto.userId,
      });
      // Não lançar erro para não afetar a operação principal
      return null;
    }
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

  async searchLogs(
    filters: {
      userId?: string;
      action?: string;
      entityType?: string;
      startDate?: Date;
      endDate?: Date;
    },
    limit: number = 100,
  ) {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.entityType) where.entityType = filters.entityType;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    return this.prisma.auditLog.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, username: true },
        },
      },
    });
  }
}
