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
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      from = new Date(now);
      from.setDate(now.getDate() + diff);
      from.setHours(0, 0, 0, 0);
      
      to = new Date(from);
      to.setDate(from.getDate() + 6);
      to.setHours(23, 59, 59, 999);
    } else {
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

    const [weekEntries, todayEntries, totalTasks, doneStatus, recentEntries] = await Promise.all([
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
      this.prisma.status.findFirst({
        where: { userId, name: 'Done' },
        select: { id: true }
      }),
      this.prisma.timeEntry.findMany({
        where: { userId },
        include: { task: true },
        orderBy: { date: 'desc' },
        take: 5,
      }),
    ]);

    const completedTasks = doneStatus 
      ? await this.prisma.task.count({ where: { userId, statusId: doneStatus.id } })
      : 0;

    const calculateHours = (entries: any[]) => {
      const totalMs = entries.reduce((sum, entry) => {
        const start = new Date(entry.startTime).getTime();
        const end = new Date(entry.endTime).getTime();
        return sum + (end - start);
      }, 0);
      return Math.round((totalMs / (1000 * 60 * 60)) * 10) / 10;
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

  private getBusinessDaysBetween(startDate: Date, endDate: Date): number {
    const portugueseHolidays = [
      '2026-01-01', // Ano Novo
      '2026-02-10', // Carnaval
      '2026-04-03', // Sexta-feira Santa
      '2026-04-05', // Páscoa
      '2026-04-25', // Revolução dos Cravos
      '2026-05-01', // Dia do Trabalho
      '2026-05-14', // Ascensão
      '2026-05-24', // Corpo de Deus
      '2026-06-10', // Dia de Portugal
      '2026-09-29', // São Miguel
      '2026-08-15', // Assunção de Nossa Senhora
      '2026-10-05', // Implantação da República
      '2026-11-02', // Dia de Todos os Santos
      '2026-11-01', // Dia de Finados
      '2026-12-01', // Restauração da Independência
      '2026-12-25', // Natal
    ];

    let businessDays = 0;
    const currentDate = new Date(startDate);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      const dateStr = currentDate.toISOString().split('T')[0];

      if (dayOfWeek >= 1 && dayOfWeek <= 5 && !portugueseHolidays.includes(dateStr)) {
        businessDays++;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return businessDays;
  }

  async internshipSummary(userId: string) {
    const internship = await this.prisma.internship.findUnique({
      where: { userId },
      select: {
        id: true,
        totalHours: true,
        startDate: true,
        endDate: true,
      }
    });

    if (!internship) {
      return {
        hasInternship: false,
        totalPlanned: null,
        hoursLogged: 0,
        hoursRemaining: null,
        progress: 0,
        daysRemaining: null,
        hoursPerDay: null,
      };
    }

    const allTimeEntries = await this.prisma.timeEntry.findMany({
      where: { userId },
      select: {
        startTime: true,
        endTime: true,
      }
    });

    const calculateHours = (entries: any[]) => {
      const totalMs = entries.reduce((sum, entry) => {
        const start = new Date(entry.startTime).getTime();
        const end = new Date(entry.endTime).getTime();
        return sum + (end - start);
      }, 0);
      return Math.round((totalMs / (1000 * 60 * 60)) * 10) / 10;
    };

    const hoursLogged = calculateHours(allTimeEntries);
    const totalPlanned = internship.totalHours || 0;
    const hoursRemaining = Math.max(0, totalPlanned - hoursLogged);
    const progress = totalPlanned > 0 ? Math.round((hoursLogged / totalPlanned) * 100) : 0;

    const now = new Date();
    const startDate = new Date(internship.startDate);
    const endDate = new Date(internship.endDate);

    const totalBusinessDays = this.getBusinessDaysBetween(startDate, endDate);
    
    const daysRemaining = this.getBusinessDaysBetween(now, endDate);
    
    const hoursPerDay = daysRemaining > 0 ? Math.round((hoursRemaining / daysRemaining) * 10) / 10 : 0;

    return {
      hasInternship: true,
      totalPlanned,
      hoursLogged,
      hoursRemaining,
      progress,
      daysRemaining: Math.max(0, daysRemaining),
      hoursPerDay,
    };
  }
}
