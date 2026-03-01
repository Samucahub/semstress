import { Test, TestingModule } from '@nestjs/testing';
import { TimeEntriesService } from './time-entries.service';
import { PrismaService } from '../common/prisma/prisma.service';

describe('TimeEntriesService', () => {
  let service: TimeEntriesService;
  let prisma: PrismaService;

  const mockTimeEntry = {
    id: '123',
    userId: 'user-1',
    taskId: 'task-1',
    date: new Date('2026-02-15'),
    startTime: new Date('2026-02-15T09:00:00'),
    endTime: new Date('2026-02-15T10:00:00'),
    createdAt: new Date(),
    updatedAt: new Date(),
    task: {
      id: 'task-1',
      title: 'Test Task',
      userId: 'user-1',
      projectId: null,
      priority: 'MEDIUM',
      status: 'TO_DO',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const mockPrismaService = {
    timeEntry: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimeEntriesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TimeEntriesService>(TimeEntriesService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('findByRange', () => {
    it('deve buscar registos de tempo por intervalo de datas', async () => {
      const from = '2026-02-15';
      const to = '2026-02-20';

      mockPrismaService.timeEntry.findMany.mockResolvedValue([mockTimeEntry]);

      const result = await service.findByRange('user-1', from, to);

      expect(result).toEqual([mockTimeEntry]);
      expect(mockPrismaService.timeEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-1',
            date: {
              gte: new Date('2026-02-15T00:00:00'),
              lte: new Date('2026-02-20T23:59:59'),
            },
          },
          include: { task: true },
          orderBy: { startTime: 'asc' },
        }),
      );
    });

    it('deve formatar corretamente datas em formato ISO (YYYY-MM-DD)', async () => {
      const from = '2026-02-10';
      const to = '2026-02-15';

      mockPrismaService.timeEntry.findMany.mockResolvedValue([]);

      await service.findByRange('user-1', from, to);

      const callArgs = mockPrismaService.timeEntry.findMany.mock.calls[0][0];
      expect(callArgs.where.date.gte).toEqual(new Date('2026-02-10T00:00:00'));
      expect(callArgs.where.date.lte).toEqual(new Date('2026-02-15T23:59:59'));
    });

    it('deve retornar lista vazia quando não há registos', async () => {
      mockPrismaService.timeEntry.findMany.mockResolvedValue([]);

      const result = await service.findByRange('user-1', '2026-02-15', '2026-02-20');

      expect(result).toEqual([]);
    });

    it('deve ordenar registos por hora de início', async () => {
      const entries = [
        { ...mockTimeEntry, startTime: new Date('2026-02-15T14:00:00') },
        { ...mockTimeEntry, startTime: new Date('2026-02-15T09:00:00') },
      ];

      mockPrismaService.timeEntry.findMany.mockResolvedValue(entries);

      await service.findByRange('user-1', '2026-02-15', '2026-02-20');

      const callArgs = mockPrismaService.timeEntry.findMany.mock.calls[0][0];
      expect(callArgs.orderBy).toEqual({ startTime: 'asc' });
    });
  });

  describe('create', () => {
    it('deve criar um novo registo de tempo', async () => {
      const dto = {
        taskId: 'task-1',
        date: new Date('2026-02-15'),
        startTime: new Date('2026-02-15T09:00:00'),
        endTime: new Date('2026-02-15T10:00:00'),
      };

      mockPrismaService.timeEntry.create.mockResolvedValue(mockTimeEntry);

      const result = await service.create('user-1', dto);

      expect(result).toEqual(mockTimeEntry);
      expect(mockPrismaService.timeEntry.create).toHaveBeenCalledWith({
        data: { ...dto, userId: 'user-1' },
      });
    });

    it('deve lançar erro se hora de fim for antes ou igual à hora de início', async () => {
      const dto = {
        taskId: 'task-1',
        date: new Date('2026-02-15'),
        startTime: new Date('2026-02-15T10:00:00'),
        endTime: new Date('2026-02-15T09:00:00'),
      };

      await expect(service.create('user-1', dto)).rejects.toThrow(
        'Hora fim inválida',
      );
    });
  });

  describe('update', () => {
    it('deve atualizar um registo de tempo existente', async () => {
      const dto = {
        startTime: new Date('2026-02-15T10:00:00'),
        endTime: new Date('2026-02-15T11:00:00'),
      };

      mockPrismaService.timeEntry.findFirst.mockResolvedValue(mockTimeEntry);
      mockPrismaService.timeEntry.update.mockResolvedValue({
        ...mockTimeEntry,
        ...dto,
      });

      const result = await service.update('user-1', '123', dto);

      expect(result).toBeDefined();
      expect(mockPrismaService.timeEntry.update).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se registo não existir', async () => {
      const dto = {
        startTime: new Date('2026-02-15T10:00:00'),
        endTime: new Date('2026-02-15T11:00:00'),
      };

      mockPrismaService.timeEntry.findFirst.mockResolvedValue(null);

      await expect(service.update('user-1', 'nonexistent', dto)).rejects.toThrow(
        'Registo não encontrado',
      );
    });
  });

  describe('delete', () => {
    it('deve deletar um registo de tempo existente', async () => {
      mockPrismaService.timeEntry.findFirst.mockResolvedValue(mockTimeEntry);
      mockPrismaService.timeEntry.delete.mockResolvedValue(mockTimeEntry);

      const result = await service.delete('user-1', '123');

      expect(result).toBeDefined();
      expect(mockPrismaService.timeEntry.delete).toHaveBeenCalledWith({
        where: { id: '123' },
      });
    });

    it('deve lançar NotFoundException se registo não existir', async () => {
      mockPrismaService.timeEntry.findFirst.mockResolvedValue(null);

      await expect(service.delete('user-1', 'nonexistent')).rejects.toThrow(
        'Registo não encontrado',
      );
    });
  });
});
