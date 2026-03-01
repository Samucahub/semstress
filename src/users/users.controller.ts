import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private service: UsersService) {}

  @Get('search')
  search(@CurrentUser() user, @Query('q') query: string, @Query('limit') limit?: string) {
    return this.service.searchUsers(query, user.id, limit ? parseInt(limit) : 10);
  }

  @Get('me/data-export')
  exportMyData(@CurrentUser() user) {
    return this.service.exportUserData(user.id);
  }

  @Delete('me')
  deleteMyAccount(@CurrentUser() user) {
    return this.service.deleteMyAccount(user.id);
  }
}
