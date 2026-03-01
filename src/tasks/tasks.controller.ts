import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private service: TasksService) {}

  @Post()
  create(@CurrentUser() user, @Body() dto: CreateTaskDto) {
    return this.service.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user, @Query('includeCollaborative') includeCollaborative?: string) {
    return this.service.findAll(user.id, includeCollaborative === 'true');
  }

  @Get(':id')
  findOne(@CurrentUser() user, @Param('id') id: string) {
    return this.service.findOne(user.id, id);
  }

  @Patch(':id')
  update(@CurrentUser() user, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.service.update(user.id, id, dto);
  }


  @Post('projects/:projectId')
  createProjectTask(@CurrentUser() user, @Param('projectId') projectId: string, @Body() dto: CreateTaskDto) {
    return this.service.createProjectTask(user.id, projectId, dto);
  }

  @Get('projects/:projectId')
  getProjectTasks(@CurrentUser() user, @Param('projectId') projectId: string) {
    return this.service.getProjectTasks(user.id, projectId);
  }

  @Patch('projects/:projectId/:taskId')
  updateProjectTask(
    @CurrentUser() user,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.service.updateProjectTask(user.id, projectId, taskId, dto);
  }

  @Delete('projects/:projectId/:taskId')
  deleteProjectTask(
    @CurrentUser() user,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.service.deleteProjectTask(user.id, projectId, taskId);
  }
}
