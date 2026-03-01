import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';

@Injectable()
export class TimeEntriesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateTimeEntryDto) {
    if (new Date(dto.endTime) <= new Date(dto.startTime)) {
      throw new BadRequestException('Hora fim inválida');
    }

    return this.prisma.timeEntry.create({
      data: { ...dto, userId },
    });
  }

  findByRange(userId: string, from: string, to: string) {
    const fromDate = new Date(`${from}T00:00:00`);
    const toDate = new Date(`${to}T23:59:59`);

    return this.prisma.timeEntry.findMany({
      where: {
        userId,
        date: {
          gte: fromDate,
          lte: toDate,
        },
      },
      include: { task: true },
      orderBy: { startTime: 'asc' },
    });
  }

  async update(userId: string, id: string, dto: UpdateTimeEntryDto) {
    const existing = await this.prisma.timeEntry.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Registo não encontrado');
    }

    const nextStart = dto.startTime ? new Date(dto.startTime) : new Date(existing.startTime);
    const nextEnd = dto.endTime ? new Date(dto.endTime) : new Date(existing.endTime);

    if (nextEnd <= nextStart) {
      throw new BadRequestException('Hora fim inválida');
    }

    const nextDate = dto.date ? new Date(dto.date) : existing.date;

    return this.prisma.timeEntry.update({
      where: { id },
      data: {
        taskId: dto.taskId ?? existing.taskId,
        date: nextDate,
        startTime: nextStart,
        endTime: nextEnd,
      },
      include: { task: true },
    });
  }

  async delete(userId: string, id: string) {
    const existing = await this.prisma.timeEntry.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Registo não encontrado');
    }

    return this.prisma.timeEntry.delete({ where: { id } });
  }
}
