import { Controller, Get, Patch, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { DeleteUserDto } from './dto/delete-user.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
    @Get('backup')
    async getDatabaseBackup() {
      return this.service.getDatabaseBackup();
    }
  constructor(private service: AdminService) {}

  @Get('dashboard/stats')
  getDashboardStats() {
    return this.service.getDashboardStats();
  }

  @Get('activities')
  getActivities(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    return this.service.getRecentActivities(parsedLimit);
  }

  @Get('analytics')
  getAnalytics(@Query('days') days?: string) {
    const parsedDays = days ? parseInt(days, 10) : 7;
    return this.service.getActivityStats(parsedDays);
  }

  @Get('logs/search')
  searchLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 100;
    const filters: any = {};
    if (userId) filters.userId = userId;
    if (action) filters.action = action;
    if (entityType) filters.entityType = entityType;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    return this.service.searchLogs(filters, parsedLimit);
  }

  @Get('users/:id/details')
  getUserDetails(@Param('id') id: string) {
    return this.service.getUserDetails(id);
  }

  @Get('users/:id/activity')
  getUserActivity(@Param('id') id: string, @Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 100;
    return this.service.getUserActivityTimeline(id, parsedLimit);
  }

  @Get('users')
  listUsers() {
    return this.service.listUsers();
  }

  @Patch('users/:id')
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.service.updateUserRole(id, dto.role, currentUser.id);
  }

  @Delete('users/:id')
  delete(
    @Param('id') id: string,
    @Body() dto: DeleteUserDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.service.deleteUser(id, currentUser.id, dto.confirmed);
  }
}
