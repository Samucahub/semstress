import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { MembersService } from './members.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateCollaborativeProjectDto } from './dto/create-collaborative-project.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { RespondInvitationDto } from './dto/respond-invitation.dto';
import { RequestLeadershipTransferDto } from './dto/request-leadership-transfer.dto';
import { RespondLeadershipTransferDto } from './dto/respond-leadership-transfer.dto';
import { ProjectRole } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(
    private service: ProjectsService,
    private membersService: MembersService,
  ) {}

  @Post()
  create(@CurrentUser() user, @Body() dto: CreateProjectDto) {
    return this.service.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user) {
    return this.service.findAll(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user, @Param('id') id: string) {
    return this.service.findOne(user.id, id);
  }

  @Patch(':id')
  update(@CurrentUser() user, @Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.service.update(user.id, id, dto);
  }

  @Delete(':id')
  delete(@CurrentUser() user, @Param('id') id: string) {
    return this.service.delete(user.id, id);
  }

  @Post('collaborative/create')
  createCollaborative(@CurrentUser() user, @Body() dto: CreateCollaborativeProjectDto) {
    return this.service.createCollaborativeProject(user.id, dto);
  }

  @Get('collaborative/accessible')
  findAllAccessible(@CurrentUser() user) {
    return this.service.findAllAccessible(user.id);
  }

  @Get('collaborative/:id')
  getCollaborativeDetail(@CurrentUser() user, @Param('id') id: string) {
    return this.service.getCollaborativeProjectDetail(user.id, id);
  }

  @Patch('collaborative/:id')
  updateCollaborative(@CurrentUser() user, @Param('id') id: string, @Body() dto: any) {
    return this.service.updateCollaborativeProject(user.id, id, dto);
  }

  @Delete('collaborative/:id')
  deleteCollaborative(@CurrentUser() user, @Param('id') id: string) {
    return this.service.deleteCollaborativeProject(user.id, id);
  }

  @Get(':projectId/members')
  getMembers(@CurrentUser() user, @Param('projectId') projectId: string) {
    return this.membersService.getProjectMembers(projectId);
  }

  @Get(':projectId/statuses')
  getProjectStatuses(@CurrentUser() user, @Param('projectId') projectId: string) {
    return this.service.getProjectStatuses(user.id, projectId);
  }

  @Post(':projectId/statuses')
  createProjectStatus(
    @CurrentUser() user,
    @Param('projectId') projectId: string,
    @Body() body: { name: string },
  ) {
    return this.service.createProjectStatus(user.id, projectId, body.name);
  }

  @Patch(':projectId/statuses/reorder')
  reorderProjectStatuses(
    @CurrentUser() user,
    @Param('projectId') projectId: string,
    @Body() body: { statusIds: string[] },
  ) {
    return this.service.reorderProjectStatuses(user.id, projectId, body.statusIds);
  }

  @Delete(':projectId/statuses/:statusId')
  deleteProjectStatus(
    @CurrentUser() user,
    @Param('projectId') projectId: string,
    @Param('statusId') statusId: string,
  ) {
    return this.service.deleteProjectStatus(user.id, projectId, statusId);
  }

  @Post(':projectId/invite')
  inviteMember(@CurrentUser() user, @Param('projectId') projectId: string, @Body() dto: InviteMemberDto) {
    return this.membersService.inviteMember(projectId, user.id, dto.email, dto.role);
  }

  @Post(':projectId/leadership-transfer')
  requestLeadershipTransfer(
    @CurrentUser() user,
    @Param('projectId') projectId: string,
    @Body() dto: RequestLeadershipTransferDto,
  ) {
    return this.membersService.requestLeadershipTransfer(projectId, user.id, dto.toUserId);
  }

  @Post('invitations/respond')
  respondInvitation(@CurrentUser() user, @Body() dto: RespondInvitationDto) {
    const accept = dto.status === 'ACCEPTED';
    return this.membersService.respondToInvitation(dto.invitationId, user.id, accept);
  }

  @Post('leadership-transfers/respond')
  respondLeadershipTransfer(@CurrentUser() user, @Body() dto: RespondLeadershipTransferDto) {
    const accept = dto.status === 'ACCEPTED';
    return this.membersService.respondToLeadershipTransfer(dto.transferId, user.id, accept);
  }

  @Get('invitations/pending')
  getPendingInvitations(@CurrentUser() user) {
    return this.membersService.getPendingInvitations(user.id);
  }

  @Get('leadership-transfers/pending')
  getPendingLeadershipTransfers(@CurrentUser() user) {
    return this.membersService.getPendingLeadershipTransfers(user.id);
  }

  @Delete(':projectId/members/:memberId')
  removeMember(@CurrentUser() user, @Param('projectId') projectId: string, @Param('memberId') memberId: string) {
    return this.membersService.removeMember(projectId, user.id, memberId);
  }

  @Patch(':projectId/members/:memberId/role')
  updateMemberRole(
    @CurrentUser() user,
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
    @Body() dto: { role: ProjectRole },
  ) {
    return this.membersService.updateMemberRole(projectId, user.id, memberId, dto.role);
  }
}
