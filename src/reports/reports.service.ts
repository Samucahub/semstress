import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async generate(userId: string, period: string) {
    const now = new Date();
    let from: Date;
    let to: Date;

    if (period === 'WEEK') {
      // Get current week (Monday to Sunday)
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Monday start
      from = new Date(now);
      from.setDate(now.getDate() + diff);
      from.setHours(0, 0, 0, 0);
      
      to = new Date(from);
      to.setDate(from.getDate() + 6);
      to.setHours(23, 59, 59, 999);
    } else {
      // Get current month
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const entries = await this.prisma.timeEntry.findMany({
      where: {
        userId,
        date: {
          gte: from,
          lte: to,
        },
      },
      include: { task: true },
      orderBy: { date: 'asc' },
    });

    if (entries.length === 0) {
      return { text: 'Nenhuma entrada de tempo registrada para este período.' };
    }

    const grouped: { [key: string]: any[] } = {};
    for (const e of entries) {
      const day = e.date.toISOString().split('T')[0];
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(e);
    }

    const lines = Object.entries(grouped).map(([day, items]) => {
      const tasks = items.map(i => i.task.title).join(', ');
      return `No dia ${day} foram realizadas as seguintes atividades: ${tasks}.`;
    });

    return { text: lines.join('\n\n') };
  }

  async summary(userId: string) {
    const now = new Date();
    
    // Calculate week range (Monday to Sunday)
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Calculate today range
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const [weekEntries, todayEntries, totalTasks, completedTasks, recentEntries] = await Promise.all([
      this.prisma.timeEntry.findMany({
        where: {
          userId,
          date: { gte: weekStart, lte: weekEnd },
        },
      }),
      this.prisma.timeEntry.findMany({
        where: {
          userId,
          date: { gte: todayStart, lte: todayEnd },
        },
      }),
      this.prisma.task.count({ where: { userId } }),
      this.prisma.task.count({ where: { userId, status: 'DONE' } }),
      this.prisma.timeEntry.findMany({
        where: { userId },
        include: { task: true },
        orderBy: { date: 'desc' },
        take: 5,
      }),
    ]);

    // Calculate hours
    const calculateHours = (entries: any[]) => {
      const totalMs = entries.reduce((sum, entry) => {
        const start = new Date(entry.startTime).getTime();
        const end = new Date(entry.endTime).getTime();
        return sum + (end - start);
      }, 0);
      return Math.round((totalMs / (1000 * 60 * 60)) * 10) / 10; // Round to 1 decimal
    };

    return {
      weekHours: calculateHours(weekEntries),
      todayHours: calculateHours(todayEntries),
      totalTasks,
      completedTasks,
      totalEntries: weekEntries.length,
      recentEntries,
    };
  }

  async weekly(userId: string, from: string, to: string) {
    const entries = await this.prisma.timeEntry.findMany({
      where: {
        userId,
        date: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
      include: { task: true },
      orderBy: { date: 'asc' },
    });

    const grouped = {};

    for (const e of entries) {
      const day = e.date.toISOString().split('T')[0];
      grouped[day] ??= [];
      grouped[day].push(e);
    }

    return Object.entries(grouped).map(([day, items]: any) => ({
      day,
      text: `No dia ${day} foram realizadas as seguintes atividades: ${items
        .map(i => i.task.title)
        .join(', ')}.`,
      totalEntries: items.length,
    }));
  }
}
