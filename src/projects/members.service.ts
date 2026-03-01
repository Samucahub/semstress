import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ProjectRole, InvitationStatus } from '@prisma/client';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  async inviteMember(projectId: string, invitedByUserId: string, email: string, role: ProjectRole) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== invitedByUserId) {
      throw new ForbiddenException('Only project owner can invite members');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User with that email not found');
    }

    const existingMember = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          projectId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      throw new BadRequestException('User is already a member of this project');
    }

    const existingInvitation = await this.prisma.projectInvitation.findFirst({
      where: {
        projectId,
        email,
        status: InvitationStatus.PENDING,
      },
    });

    if (existingInvitation) {
      throw new BadRequestException('Invitation already sent to this email');
    }

    return this.prisma.projectInvitation.create({
      data: {
        projectId,
        email,
        invitedById: invitedByUserId,
        role,
        status: InvitationStatus.PENDING,
      },
      include: {
        project: true,
        invitedBy: true,
      },
    });
  }

  async respondToInvitation(invitationId: string, userId: string, accept: boolean) {
    const invitation = await this.prisma.projectInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.email !== invitation.email) {
      throw new ForbiddenException('This invitation is not for you');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('This invitation has already been responded to');
    }

    if (accept) {
      await this.prisma.projectMember.create({
        data: {
          projectId: invitation.projectId,
          userId,
          role: invitation.role,
        },
      });

      return this.prisma.projectInvitation.update({
        where: { id: invitationId },
        data: { status: InvitationStatus.ACCEPTED },
      });
    } else {
      return this.prisma.projectInvitation.update({
        where: { id: invitationId },
        data: { status: InvitationStatus.DECLINED },
      });
    }
  }

  async getPendingInvitations(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.projectInvitation.findMany({
      where: {
        email: user.email,
        status: InvitationStatus.PENDING,
      },
      include: {
        project: true,
        invitedBy: true,
      },
    });
  }

  async removeMember(projectId: string, userId: string, memberId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== userId) {
      throw new ForbiddenException('Only project owner can remove members');
    }

    if (project.userId === memberId) {
      throw new BadRequestException('Cannot remove project owner');
    }

    return this.prisma.projectMember.delete({
      where: {
        userId_projectId: {
          projectId,
          userId: memberId,
        },
      },
    });
  }

  async updateMemberRole(projectId: string, userId: string, memberId: string, role: ProjectRole) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== userId) {
      throw new ForbiddenException('Only project owner can update member roles');
    }

    if (project.userId === memberId) {
      throw new BadRequestException('Cannot change owner role');
    }

    return this.prisma.projectMember.update({
      where: {
        userId_projectId: {
          projectId,
          userId: memberId,
        },
      },
      data: { role },
    });
  }

  async getProjectMembers(projectId: string) {
    return this.prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async requestLeadershipTransfer(projectId: string, userId: string, toUserId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== userId) {
      throw new ForbiddenException('Only project owner can transfer leadership');
    }

    if (toUserId === userId) {
      throw new BadRequestException('Cannot transfer leadership to yourself');
    }

    const targetMember = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          projectId,
          userId: toUserId,
        },
      },
    });

    if (!targetMember) {
      throw new BadRequestException('User must be a member of the project');
    }

    const existing = await this.prisma.projectLeadershipTransfer.findFirst({
      where: {
        projectId,
        toUserId,
        status: InvitationStatus.PENDING,
      },
    });

    if (existing) {
      throw new BadRequestException('There is already a pending leadership transfer');
    }

    return this.prisma.projectLeadershipTransfer.create({
      data: {
        projectId,
        fromUserId: userId,
        toUserId,
        status: InvitationStatus.PENDING,
      },
      include: {
        project: true,
        fromUser: true,
        toUser: true,
      },
    });
  }

  async respondToLeadershipTransfer(transferId: string, userId: string, accept: boolean) {
    const transfer = await this.prisma.projectLeadershipTransfer.findUnique({
      where: { id: transferId },
    });

    if (!transfer) {
      throw new NotFoundException('Leadership transfer not found');
    }

    if (transfer.toUserId !== userId) {
      throw new ForbiddenException('This leadership transfer is not for you');
    }

    if (transfer.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('This leadership transfer has already been responded to');
    }

    if (!accept) {
      return this.prisma.projectLeadershipTransfer.update({
        where: { id: transferId },
        data: {
          status: InvitationStatus.DECLINED,
          respondedAt: new Date(),
        },
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.findUnique({
        where: { id: transfer.projectId },
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      await tx.project.update({
        where: { id: transfer.projectId },
        data: { userId: userId },
      });

      await tx.projectMember.update({
        where: {
          userId_projectId: {
            projectId: transfer.projectId,
            userId: transfer.fromUserId,
          },
        },
        data: { role: ProjectRole.EDITOR },
      });

      await tx.projectMember.update({
        where: {
          userId_projectId: {
            projectId: transfer.projectId,
            userId: userId,
          },
        },
        data: { role: ProjectRole.OWNER },
      });

      return tx.projectLeadershipTransfer.update({
        where: { id: transferId },
        data: {
          status: InvitationStatus.ACCEPTED,
          respondedAt: new Date(),
        },
      });
    });
  }

  async getPendingLeadershipTransfers(userId: string) {
    return this.prisma.projectLeadershipTransfer.findMany({
      where: {
        toUserId: userId,
        status: InvitationStatus.PENDING,
      },
      include: {
        project: true,
        fromUser: true,
      },
    });
  }
}
