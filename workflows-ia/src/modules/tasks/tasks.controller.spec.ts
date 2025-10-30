import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AuthenticatedUserInterface } from '../auth/interfaces/authenticated-user-interface';
import { NotFoundException } from '@nestjs/common';

describe('TasksController', () => {
  let controller: TasksController;
  let service: TasksService;
  let mockAuthenticatedUser: AuthenticatedUserInterface;

  const mockTasksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    service = module.get<TasksService>(TasksService);

    mockAuthenticatedUser = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        fullName: 'Test User Full',
        createdAt: '2025-01-01',
        lastLogin: '2025-01-15',
        token: 'test-token',
      },
    } as AuthenticatedUserInterface;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const createDto: CreateTaskDto = {
        name: 'New Task',
        description: 'Task description',
        assignedTo: 'Developer',
        sprint: 1,
        projectId: 'project-123',
      };

      const expectedResult = {
        id: 'task-123',
        ...createDto,
      };

      mockTasksService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto, mockAuthenticatedUser);

      expect(service.create).toHaveBeenCalledWith(createDto, mockAuthenticatedUser);
      expect(result).toEqual(expectedResult);
    });

    it('should create task with minimal fields', async () => {
      const createDto: CreateTaskDto = {
        name: 'Minimal Task',
        projectId: 'project-123',
      };

      const expectedResult = {
        id: 'task-min',
        ...createDto,
      };

      mockTasksService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto, mockAuthenticatedUser);

      expect(service.create).toHaveBeenCalledWith(createDto, mockAuthenticatedUser);
      expect(result).toEqual(expectedResult);
    });

    it('should pass authenticated user to service', async () => {
      const createDto: CreateTaskDto = {
        name: 'Task',
        projectId: 'proj-1',
      };

      mockTasksService.create.mockResolvedValue({ id: 'task-1', ...createDto });

      await controller.create(createDto, mockAuthenticatedUser);

      expect(service.create).toHaveBeenCalledWith(
        createDto,
        expect.objectContaining({
          user: expect.objectContaining({
            id: 'user-123',
            email: 'test@example.com',
          }),
        })
      );
    });

    it('should handle service errors', async () => {
      const createDto: CreateTaskDto = {
        name: 'Task',
        projectId: 'proj-1',
      };

      mockTasksService.create.mockRejectedValue(new Error('Database error'));

      await expect(
        controller.create(createDto, mockAuthenticatedUser)
      ).rejects.toThrow('Database error');
    });
  });

  describe('findAll', () => {
    it('should return all tasks for a project', async () => {
      const projectId = 'project-123';
      const expectedTasks = [
        { id: '1', name: 'Task 1', projectId },
        { id: '2', name: 'Task 2', projectId },
        { id: '3', name: 'Task 3', projectId },
      ];

      mockTasksService.findAll.mockResolvedValue(expectedTasks);

      const result = await controller.findAll(projectId, mockAuthenticatedUser);

      expect(service.findAll).toHaveBeenCalledWith(projectId, mockAuthenticatedUser);
      expect(result).toEqual(expectedTasks);
      expect(result).toHaveLength(3);
    });

    it('should return empty array when no tasks found', async () => {
      const projectId = 'empty-project';

      mockTasksService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(projectId, mockAuthenticatedUser);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should pass project id and user to service', async () => {
      const projectId = 'proj-456';

      mockTasksService.findAll.mockResolvedValue([]);

      await controller.findAll(projectId, mockAuthenticatedUser);

      expect(service.findAll).toHaveBeenCalledWith(projectId, mockAuthenticatedUser);
    });

    it('should handle service errors', async () => {
      mockTasksService.findAll.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(
        controller.findAll('any-id', mockAuthenticatedUser)
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('findOne', () => {
    it('should return a single task by id', async () => {
      const taskId = 'task-456';
      const expectedTask = {
        id: taskId,
        name: 'Found Task',
        description: 'Task description',
      };

      mockTasksService.findOne.mockResolvedValue(expectedTask);

      const result = await controller.findOne(taskId, mockAuthenticatedUser);

      expect(service.findOne).toHaveBeenCalledWith(taskId, mockAuthenticatedUser);
      expect(result).toEqual(expectedTask);
    });

    it('should return null when task not found', async () => {
      const taskId = 'non-existent';

      mockTasksService.findOne.mockResolvedValue(null);

      const result = await controller.findOne(taskId, mockAuthenticatedUser);

      expect(result).toBeNull();
    });

    it('should pass task id and user to service', async () => {
      const taskId = 'task-specific';

      mockTasksService.findOne.mockResolvedValue({ id: taskId, name: 'Task' });

      await controller.findOne(taskId, mockAuthenticatedUser);

      expect(service.findOne).toHaveBeenCalledWith(taskId, mockAuthenticatedUser);
    });

    it('should handle service errors', async () => {
      mockTasksService.findOne.mockRejectedValue(new Error('Query failed'));

      await expect(
        controller.findOne('any-id', mockAuthenticatedUser)
      ).rejects.toThrow('Query failed');
    });

    it('should handle UUID format task ids', async () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';

      mockTasksService.findOne.mockResolvedValue({
        id: uuid,
        name: 'UUID Task',
      });

      const result = await controller.findOne(uuid, mockAuthenticatedUser);

      expect(result.id).toBe(uuid);
    });
  });

  describe('update', () => {
    it('should update a task successfully', async () => {
      const taskId = 'task-789';
      const updateDto: UpdateTaskDto = {
        name: 'Updated Task',
        description: 'Updated description',
      };

      const expectedResult = {
        id: taskId,
        name: 'Updated Task',
        description: 'Updated description',
      };

      mockTasksService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(
        taskId,
        updateDto,
        mockAuthenticatedUser
      );

      expect(service.update).toHaveBeenCalledWith(
        taskId,
        updateDto,
        mockAuthenticatedUser
      );
      expect(result).toEqual(expectedResult);
    });

    it('should update single field', async () => {
      const taskId = 'task-single';
      const updateDto: UpdateTaskDto = {
        sprint: 2,
      };

      mockTasksService.update.mockResolvedValue({
        id: taskId,
        name: 'Task',
        sprint: 2,
      });

      await controller.update(taskId, updateDto, mockAuthenticatedUser);

      expect(service.update).toHaveBeenCalledWith(
        taskId,
        updateDto,
        mockAuthenticatedUser
      );
    });

    it('should update multiple fields', async () => {
      const taskId = 'task-multi';
      const updateDto: UpdateTaskDto = {
        name: 'New Name',
        description: 'New Description',
        assignedTo: 'New Developer',
        sprint: 5,
      };

      mockTasksService.update.mockResolvedValue({
        id: taskId,
        ...updateDto,
      });

      await controller.update(taskId, updateDto, mockAuthenticatedUser);

      expect(service.update).toHaveBeenCalledWith(
        taskId,
        updateDto,
        mockAuthenticatedUser
      );
    });

    it('should throw NotFoundException when task not found', async () => {
      const taskId = 'non-existent';
      const updateDto: UpdateTaskDto = {
        name: 'Updated',
      };

      mockTasksService.update.mockRejectedValue(
        new NotFoundException('Task not found')
      );

      await expect(
        controller.update(taskId, updateDto, mockAuthenticatedUser)
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle updating to null values', async () => {
      const taskId = 'task-null';
      const updateDto: UpdateTaskDto = {
        description: null,
        assignedTo: null,
        sprint: null,
      };

      mockTasksService.update.mockResolvedValue({
        id: taskId,
        name: 'Task',
        ...updateDto,
      });

      await controller.update(taskId, updateDto, mockAuthenticatedUser);

      expect(service.update).toHaveBeenCalledWith(
        taskId,
        expect.objectContaining({
          description: null,
          assignedTo: null,
          sprint: null,
        }),
        mockAuthenticatedUser
      );
    });

    it('should handle service errors', async () => {
      const taskId = 'task-error';
      const updateDto: UpdateTaskDto = { name: 'Test' };

      mockTasksService.update.mockRejectedValue(new Error('Update failed'));

      await expect(
        controller.update(taskId, updateDto, mockAuthenticatedUser)
      ).rejects.toThrow('Update failed');
    });
  });

  describe('remove', () => {
    it('should remove a task successfully', async () => {
      const taskId = 'task-remove';
      const removedTask = {
        id: taskId,
        name: 'Task to Remove',
      };

      mockTasksService.remove.mockResolvedValue(removedTask);

      const result = await controller.remove(taskId, mockAuthenticatedUser);

      expect(service.remove).toHaveBeenCalledWith(taskId, mockAuthenticatedUser);
      expect(result).toBeUndefined();
    });

    it('should not return anything (204 status)', async () => {
      const taskId = 'task-delete';

      mockTasksService.remove.mockResolvedValue({
        id: taskId,
        name: 'Deleted',
      });

      const result = await controller.remove(taskId, mockAuthenticatedUser);

      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException when task not found', async () => {
      const taskId = 'non-existent';

      mockTasksService.remove.mockRejectedValue(
        new NotFoundException('Task not found')
      );

      await expect(
        controller.remove(taskId, mockAuthenticatedUser)
      ).rejects.toThrow(NotFoundException);
    });

    it('should pass task id and user to service', async () => {
      const taskId = 'task-specific';

      mockTasksService.remove.mockResolvedValue({
        id: taskId,
        name: 'Task',
      });

      await controller.remove(taskId, mockAuthenticatedUser);

      expect(service.remove).toHaveBeenCalledWith(taskId, mockAuthenticatedUser);
    });

    it('should handle service errors', async () => {
      const taskId = 'task-error';

      mockTasksService.remove.mockRejectedValue(new Error('Delete failed'));

      await expect(
        controller.remove(taskId, mockAuthenticatedUser)
      ).rejects.toThrow('Delete failed');
    });

    it('should handle UUID format task ids', async () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';

      mockTasksService.remove.mockResolvedValue({
        id: uuid,
        name: 'UUID Task',
      });

      await controller.remove(uuid, mockAuthenticatedUser);

      expect(service.remove).toHaveBeenCalledWith(uuid, mockAuthenticatedUser);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete CRUD workflow through controller', async () => {
      const projectId = 'proj-workflow';

      // Create
      const createDto: CreateTaskDto = {
        name: 'Workflow Task',
        description: 'Test',
        projectId,
      };
      mockTasksService.create.mockResolvedValue({ id: 'task-1', ...createDto });
      await controller.create(createDto, mockAuthenticatedUser);

      // FindAll
      mockTasksService.findAll.mockResolvedValue([{ id: 'task-1', ...createDto }]);
      await controller.findAll(projectId, mockAuthenticatedUser);

      // FindOne
      mockTasksService.findOne.mockResolvedValue({ id: 'task-1', ...createDto });
      await controller.findOne('task-1', mockAuthenticatedUser);

      // Update
      const updateDto: UpdateTaskDto = { description: 'Updated' };
      mockTasksService.update.mockResolvedValue({
        id: 'task-1',
        ...createDto,
        description: 'Updated',
      });
      await controller.update('task-1', updateDto, mockAuthenticatedUser);

      // Remove
      mockTasksService.remove.mockResolvedValue({ id: 'task-1', ...createDto });
      await controller.remove('task-1', mockAuthenticatedUser);

      // Verify all service methods were called
      expect(service.create).toHaveBeenCalled();
      expect(service.findAll).toHaveBeenCalled();
      expect(service.findOne).toHaveBeenCalled();
      expect(service.update).toHaveBeenCalled();
      expect(service.remove).toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string task name', async () => {
      const createDto: CreateTaskDto = {
        name: '',
        projectId: 'proj-1',
      };

      mockTasksService.create.mockResolvedValue({ id: '1', ...createDto });

      const result = await controller.create(createDto, mockAuthenticatedUser);

      expect(result.name).toBe('');
    });

    it('should handle very long task names', async () => {
      const longName = 'A'.repeat(1000);
      const createDto: CreateTaskDto = {
        name: longName,
        projectId: 'proj-1',
      };

      mockTasksService.create.mockResolvedValue({ id: '1', ...createDto });

      const result = await controller.create(createDto, mockAuthenticatedUser);

      expect(result.name).toBe(longName);
    });

    it('should handle special characters in task data', async () => {
      const createDto: CreateTaskDto = {
        name: 'Task @#$% with "quotes" and \'apostrophes\'',
        description: '<script>alert("xss")</script>',
        assignedTo: 'Developer & Tester',
        projectId: 'proj-1',
      };

      mockTasksService.create.mockResolvedValue({ id: '1', ...createDto });

      const result = await controller.create(createDto, mockAuthenticatedUser);

      expect(result.name).toContain('@#$%');
      expect(result.description).toContain('<script>');
    });

    it('should handle zero sprint number', async () => {
      const createDto: CreateTaskDto = {
        name: 'Sprint Zero',
        sprint: 0,
        projectId: 'proj-1',
      };

      mockTasksService.create.mockResolvedValue({ id: '1', ...createDto });

      const result = await controller.create(createDto, mockAuthenticatedUser);

      expect(result.sprint).toBe(0);
    });

    it('should handle negative sprint number', async () => {
      const updateDto: UpdateTaskDto = {
        sprint: -1,
      };

      mockTasksService.update.mockResolvedValue({
        id: 'task-1',
        name: 'Task',
        sprint: -1,
      });

      const result = await controller.update(
        'task-1',
        updateDto,
        mockAuthenticatedUser
      );

      expect(result.sprint).toBe(-1);
    });

    it('should handle different user contexts', async () => {
      const differentUser: AuthenticatedUserInterface = {
        user: {
          id: 'user-different',
          email: 'different@example.com',
          name: 'Different User',
          fullName: 'Different User Full',
          createdAt: '2025-01-02',
          lastLogin: '2025-01-16',
          token: 'different-token',
        },
      } as AuthenticatedUserInterface;

      const createDto: CreateTaskDto = {
        name: 'Task',
        projectId: 'proj-1',
      };

      mockTasksService.create.mockResolvedValue({ id: '1', ...createDto });

      await controller.create(createDto, differentUser);

      expect(service.create).toHaveBeenCalledWith(
        createDto,
        expect.objectContaining({
          user: expect.objectContaining({
            id: 'user-different',
            email: 'different@example.com',
          }),
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should propagate service exceptions', async () => {
      const createDto: CreateTaskDto = {
        name: 'Task',
        projectId: 'proj-1',
      };

      const customError = new Error('Custom service error');
      mockTasksService.create.mockRejectedValue(customError);

      await expect(
        controller.create(createDto, mockAuthenticatedUser)
      ).rejects.toThrow('Custom service error');
    });

    it('should handle NotFoundException properly', async () => {
      const taskId = 'non-existent';

      mockTasksService.findOne.mockRejectedValue(
        new NotFoundException('Task not found')
      );

      await expect(
        controller.findOne(taskId, mockAuthenticatedUser)
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle network/timeout errors', async () => {
      mockTasksService.findAll.mockRejectedValue(
        new Error('Connection timeout')
      );

      await expect(
        controller.findAll('proj-1', mockAuthenticatedUser)
      ).rejects.toThrow('Connection timeout');
    });
  });
});