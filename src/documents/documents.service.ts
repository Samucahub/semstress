import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createDocumentDto: CreateDocumentDto) {
    const { projectId, taskId, ...data } = createDocumentDto;

    if (projectId) {
      const project = await this.prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { userId },
            { members: { some: { userId } } }
          ]
        }
      });

      if (!project) {
        throw new ForbiddenException('You do not have access to this project');
      }
    }

    if (taskId) {
      const task = await this.prisma.task.findFirst({
        where: {
          id: taskId,
          OR: [
            { userId },
            { assignees: { some: { userId } } },
            { project: { userId } },
            { project: { members: { some: { userId } } } },
          ]
        }
      });

      if (!task) {
        throw new ForbiddenException('You do not have access to this task');
      }
    }

    if (projectId && taskId) {
      throw new BadRequestException('Document can only be linked to either a project or a task, not both');
    }

    return this.prisma.document.create({
      data: {
        ...data,
        projectId,
        taskId,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
          }
        },
        project: {
          select: {
            id: true,
            title: true,
          }
        },
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
            project: {
              select: {
                isCollaborative: true,
              }
            }
          }
        }
      }
    });
  }

  async findAll(userId: string, filters?: { projectId?: string; taskId?: string }) {
    const where: any = {
      authorId: userId
    };

    if (filters?.projectId) {
      where.projectId = filters.projectId;
    }

    if (filters?.taskId) {
      where.taskId = filters.taskId;
    }

    return this.prisma.document.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
          }
        },
        project: {
          select: {
            id: true,
            title: true,
          }
        },
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
            project: {
              select: {
                isCollaborative: true,
              }
            }
          }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  }

  async findOne(id: string, userId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
          }
        },
        project: {
          select: {
            id: true,
            title: true,
          }
        },
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
            project: {
              select: {
                isCollaborative: true,
              }
            }
          }
        }
      }
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const hasAccess = await this.checkAccess(document, userId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this document');
    }

    return document;
  }

  async update(id: string, userId: string, updateDocumentDto: UpdateDocumentDto) {
    const document = await this.prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.authorId !== userId) {
      throw new ForbiddenException('Only the document author can update it');
    }

    const projectId = 'projectId' in updateDocumentDto ? updateDocumentDto.projectId : undefined;
    const taskId = 'taskId' in updateDocumentDto ? updateDocumentDto.taskId : undefined;

    if (projectId !== undefined) {
      if (projectId) {
        const project = await this.prisma.project.findFirst({
          where: {
            id: projectId,
            OR: [
              { userId },
              { members: { some: { userId } } }
            ]
          }
        });

        if (!project) {
          throw new ForbiddenException('You do not have access to this project');
        }
      }
    }

    if (taskId !== undefined) {
      if (taskId) {
        const task = await this.prisma.task.findFirst({
          where: {
            id: taskId,
            OR: [
              { userId },
              { assignees: { some: { userId } } },
              { project: { userId } },
              { project: { members: { some: { userId } } } },
            ]
          }
        });

        if (!task) {
          throw new ForbiddenException('You do not have access to this task');
        }
      }
    }

    const updateData: any = { ...updateDocumentDto };
    if (projectId !== undefined) {
      updateData.projectId = projectId;
    }
    if (taskId !== undefined) {
      updateData.taskId = taskId;
    }

    return this.prisma.document.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
          }
        },
        project: {
          select: {
            id: true,
            title: true,
          }
        },
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
            project: {
              select: {
                isCollaborative: true,
              }
            }
          }
        }
      }
    });
  }

  async remove(id: string, userId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.authorId !== userId) {
      throw new ForbiddenException('Only the document author can delete it');
    }

    await this.prisma.document.delete({
      where: { id }
    });

    return { message: 'Document deleted successfully' };
  }

  private async checkAccess(document: any, userId: string): Promise<boolean> {
    if (document.authorId === userId) {
      return true;
    }

    if (!document.isPublic) {
      return false;
    }

    if (document.projectId) {
      const project = await this.prisma.project.findFirst({
        where: {
          id: document.projectId,
          OR: [
            { userId },
            { members: { some: { userId } } }
          ]
        }
      });

      return !!project;
    }

    if (document.taskId) {
      const task = await this.prisma.task.findFirst({
        where: {
          id: document.taskId,
          OR: [
            { userId },
            { assignees: { some: { userId } } },
            { project: { userId } },
            { project: { members: { some: { userId } } } },
          ]
        }
      });

      return !!task;
    }

    return false;
  }
}
