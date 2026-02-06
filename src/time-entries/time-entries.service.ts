import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';

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
    return this.prisma.timeEntry.findMany({
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
  }
}
