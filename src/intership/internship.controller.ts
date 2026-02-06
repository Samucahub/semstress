import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { InternshipService } from './internship.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpsertInternshipDto } from './dto/upsert-internship.dto';

@UseGuards(JwtAuthGuard)
@Controller('internship')
export class InternshipController {
  constructor(private service: InternshipService) {}

  @Post()
  upsert(@CurrentUser() user, @Body() dto: UpsertInternshipDto) {
    return this.service.upsert(user.id, dto);
  }

  @Get()
  get(@CurrentUser() user) {
    return this.service.find(user.id);
  }
}
