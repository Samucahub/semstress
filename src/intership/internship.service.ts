import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { UpsertInternshipDto } from './dto/upsert-internship.dto';

@Injectable()
export class InternshipService {
  constructor(private prisma: PrismaService) {}

  upsert(userId: string, dto: UpsertInternshipDto) {
    return this.prisma.internship.upsert({
      where: { userId },
      update: { ...dto },
      create: { ...dto, userId },
    });
  }

  find(userId: string) {
    return this.prisma.internship.findUnique({ where: { userId } });
  }
}
