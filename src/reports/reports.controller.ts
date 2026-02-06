import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get()
  generate(@CurrentUser() user, @Query('period') period: string) {
    return this.service.generate(user.id, period);
  }

  @Get('summary')
  summary(@CurrentUser() user) {
    return this.service.summary(user.id);
  }

  @Get('weekly')
  weekly(@CurrentUser() user, @Query('from') from: string, @Query('to') to: string) {
    return this.service.weekly(user.id, from, to);
  }
}
