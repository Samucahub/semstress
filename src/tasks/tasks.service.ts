import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ProjectRole } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  private async getOrCreateDefaultStatusId(userId: string, projectId: string | null) {
    const existing = await this.prisma.status.findFirst({
      where: { userId, projectId },
      orderBy: { order: 'asc' },
      select: { id: true },
    });

    if (existing) {
      return existing.id;
    }

    const defaults = [
      { name: 'TODO', order: 0 },
      { name: 'IN PROGRESS', order: 1 },
      { name: 'DONE', order: 2 },
    ];

    await this.prisma.status.createMany({
      data: defaults.map((status) => ({
        ...status,
        userId,
        projectId,
      })),
      skipDuplicates: true,
    });

    const createdDefault = await this.prisma.status.findFirst({
      where: { userId, projectId, name: 'TODO' },
      select: { id: true },
    });

    if (createdDefault) {
      return createdDefault.id;
    }

    const fallback = await this.prisma.status.findFirst({
      where: { userId, projectId },
      orderBy: { order: 'asc' },
      select: { id: true },
    });

    if (!fallback) {
      throw new BadRequestException('Não foi possível determinar um status padrão');
    }

    return fallback.id;
  }

  async create(userId: string, dto: CreateTaskDto) {
    const normalizedAssignees = dto.assignedToIds ?? (dto.assignedToId ? [dto.assignedToId] : undefined);
    const { assignedToId, assignedToIds, ...rest } = dto;
    const normalizedStatusId = rest.statusId?.trim();
    const effectiveStatusId =
      normalizedStatusId && normalizedStatusId.length > 0
        ? normalizedStatusId
        : await this.getOrCreateDefaultStatusId(userId, rest.projectId || null);

    const maxOrder = await this.prisma.task.aggregate({
      where: { userId, statusId: effectiveStatusId, projectId: rest.projectId || null },
      _max: { order: true },
    });

    return this.prisma.task.create({
      data: {
        ...rest,
        statusId: effectiveStatusId,
        userId,
        order: (maxOrder._max.order ?? -1) + 1,
        assignees: normalizedAssignees?.length
          ? {
              createMany: {
                data: normalizedAssignees.map((assigneeId) => ({ userId: assigneeId })),
                skipDuplicates: true,
              },
            }
          : undefined,
      },
      include: {
        status: true,
        project: true,
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll(userId: string, includeCollaborative = false) {
    const filters: any[] = [
      {
        userId,
        projectId: null,
      },
      {
        project: {
          isCollaborative: false,
          userId,
        },
      },
    ];

    if (includeCollaborative) {
      filters.push({
        project: {
          isCollaborative: true,
          OR: [
            { userId },
            { members: { some: { userId } } },
          ],
        },
      });
    }

    return this.prisma.task.findMany({
      where: { OR: filters },
      include: {
        status: true,
        project: true,
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        documents: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id,
        OR: [
          { userId },
          { assignees: { some: { userId } } },
        ],
      },
      include: {
        status: true,
        project: true,
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        documents: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(userId: string, id: string, dto: UpdateTaskDto) {
    const normalizedAssignees = dto.assignedToIds ?? (dto.assignedToId ? [dto.assignedToId] : undefined);
    const { assignedToId, assignedToIds, ...rest } = dto;
    if (rest.statusId) {
      const maxOrder = await this.prisma.task.aggregate({
        where: { userId, statusId: rest.statusId },
        _max: { order: true },
      });
      rest.order = (maxOrder._max.order ?? -1) + 1;
    }

    if (normalizedAssignees) {
      const updated = await this.prisma.$transaction(async (tx) => {
        await tx.task.updateMany({
          where: { id, userId },
          data: rest,
        });

        await tx.taskAssignee.deleteMany({ where: { taskId: id } });

        if (normalizedAssignees.length > 0) {
          await tx.taskAssignee.createMany({
            data: normalizedAssignees.map((assigneeId) => ({ taskId: id, userId: assigneeId })),
            skipDuplicates: true,
          });
        }

        return tx.task.findUnique({
          where: { id },
          include: {
            status: true,
            project: true,
            assignees: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        });
      });

      return updated;
    }

    return this.prisma.task.updateMany({
      where: { id, userId },
      data: rest,
    });
  }

  async delete(userId: string, id: string) {
    return this.prisma.task.deleteMany({
      where: { id, userId },
    });
  }

  async createProjectTask(userId: string, projectId: string, dto: CreateTaskDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isOwner = project.userId === userId;
    const isMember = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          projectId,
          userId,
        },
      },
    });

    if (!isOwner && !isMember) {
      throw new ForbiddenException('You do not have access to this project');
    }

    if (!isOwner && isMember) {
      if (isMember.role === ProjectRole.VIEWER) {
        throw new ForbiddenException('You do not have permission to create tasks in this project');
      }
    }

    const normalizedStatusId = dto.statusId?.trim();
    const effectiveStatusId =
      normalizedStatusId && normalizedStatusId.length > 0
        ? normalizedStatusId
        : await this.getOrCreateDefaultStatusId(project.userId, projectId);

    const maxOrder = await this.prisma.task.aggregate({
      where: { projectId, statusId: effectiveStatusId },
      _max: { order: true },
    });

    const normalizedAssignees = dto.assignedToIds ?? (dto.assignedToId ? [dto.assignedToId] : undefined);
    if (normalizedAssignees?.length) {
      const allowedMembers = await this.prisma.projectMember.findMany({
        where: {
          projectId,
          userId: { in: normalizedAssignees },
        },
        select: { userId: true },
      });
      const allowedIds = new Set([project.userId, ...allowedMembers.map((m) => m.userId)]);
      const invalid = normalizedAssignees.filter((id) => !allowedIds.has(id));
      if (invalid.length > 0) {
        throw new BadRequestException('Assigned users must be members of the project');
      }
    }

    const { assignedToId, assignedToIds, ...rest } = dto;
    const data = {
      ...rest,
      statusId: effectiveStatusId,
      projectId,
      userId,
      order: (maxOrder._max.order ?? -1) + 1,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      assignees: normalizedAssignees?.length
        ? {
            createMany: {
              data: normalizedAssignees.map((assigneeId) => ({ userId: assigneeId })),
              skipDuplicates: true,
            },
          }
        : undefined,
    };

    return this.prisma.task.create({
      data,
      include: {
        status: true,
        project: true,
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async getProjectTasks(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isOwner = project.userId === userId;
    const isMember = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          projectId,
          userId,
        },
      },
    });

    if (!isOwner && !isMember) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return this.prisma.task.findMany({
      where: { projectId },
      include: {
        status: true,
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        documents: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  async updateProjectTask(userId: string, projectId: string, taskId: string, dto: UpdateTaskDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isOwner = project.userId === userId;
    const isMember = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          projectId,
          userId,
        },
      },
    });

    if (!isOwner && !isMember) {
      throw new ForbiddenException('You do not have access to this project');
    }

    if (!isOwner && isMember && isMember.role === ProjectRole.VIEWER) {
      throw new ForbiddenException('You do not have permission to edit tasks in this project');
    }

    if (dto.statusId) {
      const maxOrder = await this.prisma.task.aggregate({
        where: { projectId, statusId: dto.statusId },
        _max: { order: true },
      });
      dto.order = (maxOrder._max.order ?? -1) + 1;
    }

    const normalizedAssignees = dto.assignedToIds ?? (dto.assignedToId ? [dto.assignedToId] : undefined);
    if (normalizedAssignees?.length) {
      const allowedMembers = await this.prisma.projectMember.findMany({
        where: {
          projectId,
          userId: { in: normalizedAssignees },
        },
        select: { userId: true },
      });
      const allowedIds = new Set([project.userId, ...allowedMembers.map((m) => m.userId)]);
      const invalid = normalizedAssignees.filter((id) => !allowedIds.has(id));
      if (invalid.length > 0) {
        throw new BadRequestException('Assigned users must be members of the project');
      }
    }

    const { assignedToId, assignedToIds, ...rest } = dto;

    const updateData = {
      ...rest,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    };

    if (normalizedAssignees) {
      return this.prisma.$transaction(async (tx) => {
        await tx.task.update({
          where: { id: taskId },
          data: updateData,
        });

        await tx.taskAssignee.deleteMany({ where: { taskId } });

        if (normalizedAssignees.length > 0) {
          await tx.taskAssignee.createMany({
            data: normalizedAssignees.map((assigneeId) => ({ taskId, userId: assigneeId })),
            skipDuplicates: true,
          });
        }

        return tx.task.findUnique({
          where: { id: taskId },
          include: {
            status: true,
            assignees: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        });
      });
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        status: true,
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async deleteProjectTask(userId: string, projectId: string, taskId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isOwner = project.userId === userId;
    const isMember = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          projectId,
          userId,
        },
      },
    });

    if (!isOwner && !isMember) {
      throw new ForbiddenException('You do not have access to this project');
    }

    if (!isOwner && isMember && isMember.role === ProjectRole.VIEWER) {
      throw new ForbiddenException('You do not have permission to delete tasks in this project');
    }

    return this.prisma.task.delete({
      where: { id: taskId },
    });
  }
}
