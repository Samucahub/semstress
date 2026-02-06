import { Controller, Post, Get, Query, Body, UseGuards } from '@nestjs/common';
import { TimeEntriesService } from './time-entries.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';

@UseGuards(JwtAuthGuard)
@Controller('time-entries')
export class TimeEntriesController {
  constructor(private service: TimeEntriesService) {}

  @Post()
  create(@CurrentUser() user, @Body() dto: CreateTimeEntryDto) {
    return this.service.create(user.id, dto);
  }

  @Get()
  find(@CurrentUser() user, @Query('from') from: string, @Query('to') to: string) {
    return this.service.findByRange(user.id, from, to);
  }
}
