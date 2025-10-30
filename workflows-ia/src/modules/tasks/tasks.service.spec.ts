import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { AuthServiceProxy } from '../auth/proxies/auth-service.proxy';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Tasks } from '../gemini/entities/Tasks.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AuthenticatedUserInterface } from '../auth/interfaces/authenticated-user-interface';
import { NotFoundException } from '@nestjs/common';

describe('TasksService', () => {
  let service: TasksService;
  let mockAuthServiceProxy: any;
  let mockTasksRepository: any;
  let mockAuthenticatedUser: AuthenticatedUserInterface;

  beforeEach(async () => {
    // Mock AuthServiceProxy
    mockAuthServiceProxy = {
      logAction: jest.fn().mockResolvedValue(undefined),
    };

    // Mock Tasks Repository
    mockTasksRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    // Mock Authenticated User
    mockAuthenticatedUser = {
      user: {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
        fullName: 'Test User Full',
        createdAt: '2025-01-01',
        lastLogin: '2025-01-15',
        token: 'user-token',
      },
    } as AuthenticatedUserInterface;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: AuthServiceProxy,
          useValue: mockAuthServiceProxy,
        },
        {
          provide: getRepositoryToken(Tasks),
          useValue: mockTasksRepository,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a task successfully', async () => {
      const createDto: CreateTaskDto = {
        name: 'New Task',
        description: 'Task description',
        assignedTo: 'John Doe',
        sprint: 1,
        projectId: 'project-123',
      };

      const savedTask = {
        id: 'task-123',
        ...createDto,
      };

      mockTasksRepository.save.mockResolvedValue(savedTask);

      const result = await service.create(createDto, mockAuthenticatedUser);

      expect(mockTasksRepository.save).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(savedTask);
    });

    it('should create audit log for task creation', async () => {
      const createDto: CreateTaskDto = {
        name: 'Audit Task',
        projectId: 'proj-1',
      };

      const savedTask = { id: 'task-1', ...createDto };
      mockTasksRepository.save.mockResolvedValue(savedTask);

      await service.create(createDto, mockAuthenticatedUser);

      expect(mockAuthServiceProxy.logAction).toHaveBeenCalled();
      
      const auditLogCall = mockAuthServiceProxy.logAction.mock.calls[0][0];
      expect(auditLogCall.action).toBe('CREATE_TASK');
      expect(auditLogCall.user).toEqual(mockAuthenticatedUser.user);
    });

    it('should include timestamp in audit log', async () => {
      const createDto: CreateTaskDto = {
        name: 'Task',
        projectId: 'proj-1',
      };

      mockTasksRepository.save.mockResolvedValue({ id: '1', ...createDto });

      await service.create(createDto, mockAuthenticatedUser);

      const auditLogCall = mockAuthServiceProxy.logAction.mock.calls[0][0];
      expect(auditLogCall.createdAt).toBeDefined();
      expect(typeof auditLogCall.createdAt).toBe('string');
    });

    it('should handle repository save errors', async () => {
      const createDto: CreateTaskDto = {
        name: 'Error Task',
        projectId: 'proj-1',
      };

      mockTasksRepository.save.mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        service.create(createDto, mockAuthenticatedUser)
      ).rejects.toThrow('Database error');
    });

    it('should create task with all optional fields', async () => {
      const createDto: CreateTaskDto = {
        name: 'Complete Task',
        description: 'Full description',
        assignedTo: 'Developer',
        sprint: 3,
        projectId: 'proj-complete',
      };

      const savedTask = { id: 'task-complete', ...createDto };
      mockTasksRepository.save.mockResolvedValue(savedTask);

      const result = await service.create(createDto, mockAuthenticatedUser);

      expect(result.description).toBe('Full description');
      expect(result.assignedTo).toBe('Developer');
      expect(result.sprint).toBe(3);
    });

    it('should create task with null optional fields', async () => {
      const createDto: CreateTaskDto = {
        name: 'Minimal Task',
        description: null,
        assignedTo: null,
        sprint: null,
        projectId: 'proj-1',
      };

      const savedTask = { id: 'task-min', ...createDto };
      mockTasksRepository.save.mockResolvedValue(savedTask);

      const result = await service.create(createDto, mockAuthenticatedUser);

      expect(result.description).toBeNull();
      expect(result.assignedTo).toBeNull();
      expect(result.sprint).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all tasks for a project', async () => {
      const projectId = 'project-123';
      const mockTasks = [
        { id: '1', name: 'Task 1', projectId },
        { id: '2', name: 'Task 2', projectId },
        { id: '3', name: 'Task 3', projectId },
      ];

      mockTasksRepository.find.mockResolvedValue(mockTasks);

      const result = await service.findAll(projectId, mockAuthenticatedUser);

      expect(mockTasksRepository.find).toHaveBeenCalledWith({
        where: { project: { id: projectId } },
        relations: ['project'],
      });
      expect(result).toEqual(mockTasks);
      expect(result).toHaveLength(3);
    });

    it('should create audit log for findAll', async () => {
      const projectId = 'proj-audit';
      mockTasksRepository.find.mockResolvedValue([]);

      await service.findAll(projectId, mockAuthenticatedUser);

      expect(mockAuthServiceProxy.logAction).toHaveBeenCalled();
      
      const auditLogCall = mockAuthServiceProxy.logAction.mock.calls[0][0];
      expect(auditLogCall.action).toBe('GET_ALL_TASKS');
    });

    it('should return empty array if no tasks found', async () => {
      const projectId = 'empty-project';
      mockTasksRepository.find.mockResolvedValue([]);

      const result = await service.findAll(projectId, mockAuthenticatedUser);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should filter tasks by project id', async () => {
      const projectId = 'specific-project';
      mockTasksRepository.find.mockResolvedValue([]);

      await service.findAll(projectId, mockAuthenticatedUser);

      expect(mockTasksRepository.find).toHaveBeenCalledWith({
        where: { project: { id: projectId } },
        relations: ['project'],
      });
    });

    it('should include project relation', async () => {
      const projectId = 'proj-with-relation';
      mockTasksRepository.find.mockResolvedValue([]);

      await service.findAll(projectId, mockAuthenticatedUser);

      const findCall = mockTasksRepository.find.mock.calls[0][0];
      expect(findCall.relations).toContain('project');
    });

    it('should handle repository find errors', async () => {
      mockTasksRepository.find.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(
        service.findAll('any-id', mockAuthenticatedUser)
      ).rejects.toThrow('Database connection failed');
    });

    it('should include user in audit log', async () => {
      mockTasksRepository.find.mockResolvedValue([]);

      await service.findAll('proj-1', mockAuthenticatedUser);

      const auditLogCall = mockAuthServiceProxy.logAction.mock.calls[0][0];
      expect(auditLogCall.user).toEqual(mockAuthenticatedUser.user);
      expect(auditLogCall.user.id).toBe('user-123');
    });
  });

  describe('findOne', () => {
    it('should find a task by id', async () => {
      const taskId = 'task-456';
      const mockTask = {
        id: taskId,
        name: 'Found Task',
        description: 'Task description',
      };

      mockTasksRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.findOne(taskId, mockAuthenticatedUser);

      expect(mockTasksRepository.findOne).toHaveBeenCalledWith({
        where: { id: taskId },
        relations: ['project'],
      });
      expect(result).toEqual(mockTask);
    });

    it('should create audit log for findOne', async () => {
      const taskId = 'task-audit';
      mockTasksRepository.findOne.mockResolvedValue({
        id: taskId,
        name: 'Task',
      });

      await service.findOne(taskId, mockAuthenticatedUser);

      expect(mockAuthServiceProxy.logAction).toHaveBeenCalled();
      
      const auditLogCall = mockAuthServiceProxy.logAction.mock.calls[0][0];
      expect(auditLogCall.action).toBe('GET_TASK');
      expect(auditLogCall.description).toContain(taskId);
    });

    it('should return null if task not found', async () => {
      const taskId = 'non-existent';
      mockTasksRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(taskId, mockAuthenticatedUser);

      expect(result).toBeNull();
    });

    it('should include project relation', async () => {
      const taskId = 'task-with-project';
      mockTasksRepository.findOne.mockResolvedValue({
        id: taskId,
        name: 'Task',
      });

      await service.findOne(taskId, mockAuthenticatedUser);

      const findOneCall = mockTasksRepository.findOne.mock.calls[0][0];
      expect(findOneCall.relations).toContain('project');
    });

    it('should include task id in audit log description', async () => {
      const taskId = 'specific-task-id';
      mockTasksRepository.findOne.mockResolvedValue({
        id: taskId,
        name: 'Task',
      });

      await service.findOne(taskId, mockAuthenticatedUser);

      const auditLogCall = mockAuthServiceProxy.logAction.mock.calls[0][0];
      expect(auditLogCall.description).toBe(`Get task with id: ${taskId}`);
    });

    it('should handle repository findOne errors', async () => {
      mockTasksRepository.findOne.mockRejectedValue(
        new Error('Query failed')
      );

      await expect(
        service.findOne('any-id', mockAuthenticatedUser)
      ).rejects.toThrow('Query failed');
    });
  });

  describe('update', () => {
    it('should update a task successfully', async () => {
      const taskId = 'task-789';
      const updateDto: UpdateTaskDto = {
        name: 'Updated Task',
        description: 'Updated description',
      };

      const existingTask = {
        id: taskId,
        name: 'Old Task',
        description: 'Old description',
      };

      const updatedTask = {
        ...existingTask,
        ...updateDto,
      };

      mockTasksRepository.findOne.mockResolvedValue(existingTask);
      mockTasksRepository.save.mockResolvedValue(updatedTask);

      const result = await service.update(
        taskId,
        updateDto,
        mockAuthenticatedUser
      );

      expect(mockTasksRepository.findOne).toHaveBeenCalledWith({
        where: { id: taskId },
      });
      expect(mockTasksRepository.save).toHaveBeenCalledWith({
        ...existingTask,
        ...updateDto,
      });
      expect(result).toEqual(updatedTask);
    });

    it('should throw NotFoundException if task not found', async () => {
      const taskId = 'non-existent';
      const updateDto: UpdateTaskDto = {
        name: 'Updated',
      };

      mockTasksRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(taskId, updateDto, mockAuthenticatedUser)
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.update(taskId, updateDto, mockAuthenticatedUser)
      ).rejects.toThrow('Task not found');
    });

    it('should create audit log for update', async () => {
      const taskId = 'task-update';
      const updateDto: UpdateTaskDto = { name: 'New Name' };

      mockTasksRepository.findOne.mockResolvedValue({
        id: taskId,
        name: 'Old Name',
      });
      mockTasksRepository.save.mockResolvedValue({
        id: taskId,
        name: 'New Name',
      });

      await service.update(taskId, updateDto, mockAuthenticatedUser);

      expect(mockAuthServiceProxy.logAction).toHaveBeenCalled();
      
      const auditLogCall = mockAuthServiceProxy.logAction.mock.calls[0][0];
      expect(auditLogCall.action).toBe('UPDATE_TASK');
      expect(auditLogCall.description).toContain(taskId);
    });

    it('should update only provided fields', async () => {
      const taskId = 'partial-update';
      const updateDto: UpdateTaskDto = {
        sprint: 2,
      };

      const existingTask = {
        id: taskId,
        name: 'Task Name',
        description: 'Description',
        sprint: 1,
      };

      mockTasksRepository.findOne.mockResolvedValue(existingTask);
      mockTasksRepository.save.mockResolvedValue({
        ...existingTask,
        sprint: 2,
      });

      await service.update(taskId, updateDto, mockAuthenticatedUser);

      expect(mockTasksRepository.save).toHaveBeenCalledWith({
        ...existingTask,
        sprint: 2,
      });
    });

    it('should not call save if task not found', async () => {
      const taskId = 'non-existent';
      const updateDto: UpdateTaskDto = { name: 'Test' };

      mockTasksRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(taskId, updateDto, mockAuthenticatedUser)
      ).rejects.toThrow();

      expect(mockTasksRepository.save).not.toHaveBeenCalled();
    });

    it('should handle multiple field updates', async () => {
      const taskId = 'multi-update';
      const updateDto: UpdateTaskDto = {
        name: 'New Name',
        description: 'New Description',
        assignedTo: 'New Developer',
        sprint: 5,
      };

      const existingTask = {
        id: taskId,
        name: 'Old',
        description: 'Old',
      };

      mockTasksRepository.findOne.mockResolvedValue(existingTask);
      mockTasksRepository.save.mockResolvedValue({
        ...existingTask,
        ...updateDto,
      });

      await service.update(taskId, updateDto, mockAuthenticatedUser);

      expect(mockTasksRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Name',
          description: 'New Description',
          assignedTo: 'New Developer',
          sprint: 5,
        })
      );
    });

    it('should handle updating to null values', async () => {
      const taskId = 'null-update';
      const updateDto: UpdateTaskDto = {
        description: null,
        assignedTo: null,
        sprint: null,
      };

      const existingTask = {
        id: taskId,
        name: 'Task',
        description: 'Old description',
      };

      mockTasksRepository.findOne.mockResolvedValue(existingTask);
      mockTasksRepository.save.mockResolvedValue({
        ...existingTask,
        ...updateDto,
      });

      await service.update(taskId, updateDto, mockAuthenticatedUser);

      expect(mockTasksRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          description: null,
          assignedTo: null,
          sprint: null,
        })
      );
    });
  });

  describe('remove', () => {
    it('should remove a task successfully', async () => {
      const taskId = 'task-remove';
      const mockTask = {
        id: taskId,
        name: 'Task to Remove',
      };

      mockTasksRepository.findOne.mockResolvedValue(mockTask);
      mockTasksRepository.remove.mockResolvedValue(mockTask);

      const result = await service.remove(taskId, mockAuthenticatedUser);

      expect(mockTasksRepository.findOne).toHaveBeenCalledWith({
        where: { id: taskId },
      });
      expect(mockTasksRepository.remove).toHaveBeenCalledWith(mockTask);
      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException if task not found', async () => {
      const taskId = 'non-existent';

      mockTasksRepository.findOne.mockResolvedValue(null);

      await expect(
        service.remove(taskId, mockAuthenticatedUser)
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.remove(taskId, mockAuthenticatedUser)
      ).rejects.toThrow('Task not found');
    });

    it('should create audit log for remove', async () => {
      const taskId = 'task-delete';
      mockTasksRepository.findOne.mockResolvedValue({
        id: taskId,
        name: 'To Delete',
      });
      mockTasksRepository.remove.mockResolvedValue({});

      await service.remove(taskId, mockAuthenticatedUser);

      expect(mockAuthServiceProxy.logAction).toHaveBeenCalled();
      
      const auditLogCall = mockAuthServiceProxy.logAction.mock.calls[0][0];
      expect(auditLogCall.action).toBe('DELETE_TASK');
      expect(auditLogCall.description).toContain(taskId);
    });

    it('should not call remove if task not found', async () => {
      const taskId = 'non-existent';

      mockTasksRepository.findOne.mockResolvedValue(null);

      await expect(
        service.remove(taskId, mockAuthenticatedUser)
      ).rejects.toThrow();

      expect(mockTasksRepository.remove).not.toHaveBeenCalled();
    });

    it('should include task id in audit log description', async () => {
      const taskId = 'specific-delete-id';
      mockTasksRepository.findOne.mockResolvedValue({
        id: taskId,
        name: 'Task',
      });
      mockTasksRepository.remove.mockResolvedValue({});

      await service.remove(taskId, mockAuthenticatedUser);

      const auditLogCall = mockAuthServiceProxy.logAction.mock.calls[0][0];
      expect(auditLogCall.description).toBe(
        `Delete task with id: ${taskId}`
      );
    });

    it('should handle repository remove errors', async () => {
      const taskId = 'error-remove';
      mockTasksRepository.findOne.mockResolvedValue({
        id: taskId,
        name: 'Task',
      });
      mockTasksRepository.remove.mockRejectedValue(
        new Error('Delete failed')
      );

      await expect(
        service.remove(taskId, mockAuthenticatedUser)
      ).rejects.toThrow('Delete failed');
    });
  });

  describe('createAuditLog (private method)', () => {
    it('should create audit log with correct structure via create method', async () => {
      const createDto: CreateTaskDto = {
        name: 'Test',
        projectId: 'proj-1',
      };

      mockTasksRepository.save.mockResolvedValue({ id: '1', ...createDto });

      await service.create(createDto, mockAuthenticatedUser);

      const auditLogCall = mockAuthServiceProxy.logAction.mock.calls[0][0];
      
      expect(auditLogCall).toHaveProperty('action');
      expect(auditLogCall).toHaveProperty('description');
      expect(auditLogCall).toHaveProperty('details');
      expect(auditLogCall).toHaveProperty('createdAt');
      expect(auditLogCall).toHaveProperty('user');
    });

    it('should handle null description and details', async () => {
      const createDto: CreateTaskDto = {
        name: 'Task',
        projectId: 'proj-1',
      };

      mockTasksRepository.save.mockResolvedValue({ id: '1', ...createDto });

      await service.create(createDto, mockAuthenticatedUser);

      const auditLogCall = mockAuthServiceProxy.logAction.mock.calls[0][0];
      expect(auditLogCall.description).toBeNull();
      expect(auditLogCall.details).toBeNull();
    });

    it('should include user from authenticated request', async () => {
      const customUser: AuthenticatedUserInterface = {
        user: {
          id: 'custom-user-id',
          email: 'custom@example.com',
          name: 'Custom',
          fullName: 'Custom User',
          createdAt: '2025-01-01',
          lastLogin: '2025-01-15',
          token: 'custom-token',
        },
      } as AuthenticatedUserInterface;

      const createDto: CreateTaskDto = {
        name: 'Task',
        projectId: 'proj-1',
      };

      mockTasksRepository.save.mockResolvedValue({ id: '1', ...createDto });

      await service.create(createDto, customUser);

      const auditLogCall = mockAuthServiceProxy.logAction.mock.calls[0][0];
      expect(auditLogCall.user.id).toBe('custom-user-id');
      expect(auditLogCall.user.email).toBe('custom@example.com');
    });
  });

  describe('Integration scenarios', () => {
    it('should complete CRUD workflow', async () => {
      const projectId = 'proj-crud';

      // Create
      const createDto: CreateTaskDto = {
        name: 'CRUD Task',
        description: 'Test task',
        projectId,
      };

      const createdTask = { id: 'task-1', ...createDto };
      mockTasksRepository.save.mockResolvedValue(createdTask);

      const created = await service.create(createDto, mockAuthenticatedUser);
      expect(created.id).toBe('task-1');

      // FindAll
      mockTasksRepository.find.mockResolvedValue([createdTask]);
      const all = await service.findAll(projectId, mockAuthenticatedUser);
      expect(all).toHaveLength(1);

      // FindOne
      mockTasksRepository.findOne.mockResolvedValue(createdTask);
      const found = await service.findOne('task-1', mockAuthenticatedUser);
      expect(found.name).toBe('CRUD Task');

      // Update
      const updateDto: UpdateTaskDto = { description: 'Updated' };
      mockTasksRepository.findOne.mockResolvedValue(createdTask);
      mockTasksRepository.save.mockResolvedValue({
        ...createdTask,
        description: 'Updated',
      });
      await service.update('task-1', updateDto, mockAuthenticatedUser);

      // Remove
      mockTasksRepository.findOne.mockResolvedValue(createdTask);
      mockTasksRepository.remove.mockResolvedValue(createdTask);
      await service.remove('task-1', mockAuthenticatedUser);

      // Verify all audit logs were created
      expect(mockAuthServiceProxy.logAction).toHaveBeenCalledTimes(5);
    });
  });

  describe('Edge cases', () => {
    it('should handle very long task names', async () => {
      const longName = 'A'.repeat(1000);
      const createDto: CreateTaskDto = {
        name: longName,
        projectId: 'proj-1',
      };

      mockTasksRepository.save.mockResolvedValue({ id: '1', ...createDto });

      const result = await service.create(createDto, mockAuthenticatedUser);

      expect(result.name).toBe(longName);
    });

    it('should handle special characters in task name', async () => {
      const createDto: CreateTaskDto = {
        name: 'Task @#$% with "quotes" and \'apostrophes\'',
        projectId: 'proj-1',
      };

      mockTasksRepository.save.mockResolvedValue({ id: '1', ...createDto });

      const result = await service.create(createDto, mockAuthenticatedUser);

      expect(result.name).toContain('@#$%');
    });

    it('should handle UUID format for task id', async () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      mockTasksRepository.findOne.mockResolvedValue({
        id: uuid,
        name: 'UUID Task',
      });

      const result = await service.findOne(uuid, mockAuthenticatedUser);

      expect(result.id).toBe(uuid);
    });

    it('should handle zero sprint number', async () => {
      const createDto: CreateTaskDto = {
        name: 'Sprint Zero',
        sprint: 0,
        projectId: 'proj-1',
      };

      mockTasksRepository.save.mockResolvedValue({ id: '1', ...createDto });

      const result = await service.create(createDto, mockAuthenticatedUser);

      expect(result.sprint).toBe(0);
    });

    it('should handle negative sprint number', async () => {
      const createDto: CreateTaskDto = {
        name: 'Negative Sprint',
        sprint: -1,
        projectId: 'proj-1',
      };

      mockTasksRepository.save.mockResolvedValue({ id: '1', ...createDto });

      const result = await service.create(createDto, mockAuthenticatedUser);

      expect(result.sprint).toBe(-1);
    });
  });
});