import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogService } from '../common/services/audit-log.service';

@Injectable()
export class AdminService {
  async getDatabaseBackup() {
    try {
      // Export seguro via Prisma — sem execSync/shell injection
      const [users, projects, tasks, timeEntries, statuses, documents] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.project.count(),
        this.prisma.task.count(),
        this.prisma.timeEntry.count(),
        this.prisma.status.count(),
        this.prisma.document.count(),
      ]);

      const projectsData = await this.prisma.project.findMany({
        select: { id: true, title: true, description: true, color: true, userId: true, createdAt: true },
      });
      const tasksData = await this.prisma.task.findMany({
        select: { id: true, title: true, description: true, priority: true, userId: true, statusId: true, projectId: true, createdAt: true },
      });
      const timeEntriesData = await this.prisma.timeEntry.findMany({
        select: { id: true, date: true, startTime: true, endTime: true, userId: true, taskId: true, createdAt: true },
      });
      const statusesData = await this.prisma.status.findMany({
        select: { id: true, name: true, order: true, userId: true, projectId: true, createdAt: true },
      });
      const documentsData = await this.prisma.document.findMany({
        select: { id: true, title: true, content: true, slug: true, projectId: true, taskId: true, authorId: true, isPublic: true, tags: true, createdAt: true },
      });

      const backup = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        counts: { users, projects, tasks, timeEntries, statuses, documents },
        data: {
          projects: projectsData,
          tasks: tasksData,
          timeEntries: timeEntriesData,
          statuses: statusesData,
          documents: documentsData,
        },
      };

      const now = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      return {
        file: Buffer.from(JSON.stringify(backup, null, 2)).toString('base64'),
        filename: `backup-cromometro-${now}.json`,
        mimetype: 'application/json',
      };
    } catch (error) {
      throw new BadRequestException('Erro ao gerar backup: ' + (error.message || 'Falha no export'));
    }
  }

  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  async listUsers() {
    const [verifiedUsers, pendingUsers] = await Promise.all([
      this.prisma.user.findMany({
        select: { 
          id: true, 
          name: true, 
          username: true, 
          email: true, 
          role: true, 
          createdAt: true,
          emailVerified: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.pendingUser.findMany({
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Combine and sort by creation date
    const allUsers = [
      ...verifiedUsers.map(u => ({
        ...u,
        status: 'verified',
        emailVerified: true,
      })),
      ...pendingUsers.map(u => ({
        ...u,
        id: u.id,
        role: 'USER',
        status: 'pending',
        emailVerified: false,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return allUsers;
  }

  async getUserDetails(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        internship: true,
        tasks: { select: { id: true, title: true, createdAt: true }, take: 10 },
        timeEntries: { 
          select: { 
            id: true, 
            startTime: true,
            endTime: true,
            createdAt: true 
          }, 
          take: 10 
        },
        projects: { select: { id: true, title: true, createdAt: true }, take: 10 },
      },
    });

    if (!user) return null;

    // Contar estatísticas
    const taskCount = await this.prisma.task.count({ where: { userId } });
    const timeEntriesCount = await this.prisma.timeEntry.count({ where: { userId } });
    const projectCount = await this.prisma.project.count({ where: { userId } });
    
    // Calcular tempo total gasto
    const timeEntries = await this.prisma.timeEntry.findMany({
      where: { userId },
      select: { startTime: true, endTime: true },
    });

    const totalTimeSpent = timeEntries.reduce((total, entry) => {
      const duration = new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime();
      return total + duration;
    }, 0);

    return {
      ...user,
      stats: {
        tasksCount: taskCount,
        timeEntriesCount,
        projectsCount: projectCount,
        totalTimeSpent,
      },
    };
  }

  async getDashboardStats() {
    const [
      totalUsers,
      totalTasks,
      totalTimeEntries,
      totalProjects,
      adminUsers,
      regularUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.task.count(),
      this.prisma.timeEntry.count(),
      this.prisma.project.count(),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.user.count({ where: { role: 'USER' } }),
    ]);

    // Usuários criados nos últimos 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsersThisWeek = await this.prisma.user.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });

    // Tarefas criadas nos últimos 7 dias
    const newTasksThisWeek = await this.prisma.task.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });

    // Time entries nos últimos 7 dias
    const timeEntriesThisWeek = await this.prisma.timeEntry.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });

    // Calcular tempo total gasto
    const allTimeEntries = await this.prisma.timeEntry.findMany({
      select: { startTime: true, endTime: true },
    });

    const totalTimeSpent = allTimeEntries.reduce((total, entry) => {
      const duration = new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime();
      return total + duration;
    }, 0);

    return {
      totalUsers,
      totalTasks,
      totalTimeEntries,
      totalProjects,
      adminUsers,
      regularUsers,
      newUsersThisWeek,
      newTasksThisWeek,
      timeEntriesThisWeek,
      totalTimeSpent,
    };
  }

  async getRecentActivities(limit: number = 50) {
    const activities = await this.auditLogService.getRecentActivity(limit);
    return activities;
  }

  async getActivityStats(days: number = 7) {
    return this.auditLogService.getActivityStats(days);
  }

  async getUserActivityTimeline(userId: string, limit: number = 100) {
    return this.auditLogService.getUserActivity(userId, limit);
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
    return this.auditLogService.searchLogs(filters, limit);
  }

  updateUserRole(userId: string, role: string, currentUserId: string) {
    if (userId === currentUserId) {
      throw new ForbiddenException('Não podes alterar o teu próprio role');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
      select: { id: true, name: true, username: true, email: true, role: true },
    });
  }

  async deleteUser(userId: string, currentUserId: string, confirmed: boolean) {
    if (userId === currentUserId) {
      throw new ForbiddenException('Não podes eliminar a tua própria conta');
    }

    if (!confirmed) {
      throw new BadRequestException(
        'Eliminação de utilizador requer confirmação explícita. Enviar { "confirmed": true }',
      );
    }

    await this.prisma.internship.deleteMany({ where: { userId } });
    await this.prisma.timeEntry.deleteMany({ where: { userId } });

    return this.prisma.user.delete({
      where: { id: userId },
      select: { id: true, name: true, username: true, email: true, role: true },
    });
  }
}
