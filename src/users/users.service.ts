import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async searchUsers(query: string, userId: string, limit: number = 10) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    return this.prisma.user.findMany({
      where: {
        id: { not: userId },
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: limit,
    });
  }

  async exportUserData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        internship: true,
        tasks: true,
        timeEntries: true,
        projects: true,
        statuses: true,
        documents: true,
        projectMemberships: true,
        taskAssignments: true,
        leadershipTransfersFrom: true,
        leadershipTransfersTo: true,
        projectInvites: true,
        auditLogs: true,
      },
    });

    if (!user) {
      return {
        status: 'not_found',
        message: 'Utilizador não encontrado',
      };
    }

    return {
      exportedAt: new Date().toISOString(),
      user,
    };
  }

  async deleteMyAccount(userId: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.internship.deleteMany({ where: { userId } });
      await tx.timeEntry.deleteMany({ where: { userId } });
      await tx.auditLog.deleteMany({ where: { userId } });
      await tx.refreshToken.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });

    return {
      message: 'Conta e dados pessoais removidos com sucesso',
      deletedAt: new Date().toISOString(),
    };
  }
}
