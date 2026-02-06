import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  create(userId: string, dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: { ...dto, userId },
    });
  }

  findAll(userId: string, status?: string) {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }
    return this.prisma.task.findMany({ where });
  }

  update(userId: string, id: string, dto: UpdateTaskDto) {
    return this.prisma.task.updateMany({
      where: { id, userId },
      data: dto,
    });
  }

  delete(userId: string, id: string) {
    return this.prisma.task.deleteMany({
      where: { id, userId },
    });
  }
}
