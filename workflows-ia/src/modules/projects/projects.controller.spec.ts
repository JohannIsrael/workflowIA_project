import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AuthenticatedUserInterface } from '../auth/interfaces/authenticated-user-interface';
import { NotFoundException } from '@nestjs/common';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let mockProjectsService: any;
  let mockAuthenticatedUser: AuthenticatedUserInterface;

  beforeEach(async () => {
    // Mock ProjectsService
    mockProjectsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
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
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: mockProjectsService,
        },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a project successfully', async () => {
      const createDto: CreateProjectDto = {
        name: 'New Project',
        priority: 'high',
        backtech: 'NestJS',
        fronttech: 'React',
        cloudTech: 'AWS',
        sprintsQuantity: 5,
        endDate: '2025-12-31',
      } as CreateProjectDto;

      const createdProject = {
        id: 'project-123',
        ...createDto,
      };

      mockProjectsService.create.mockResolvedValue(createdProject);

      const result = await controller.create(createDto, mockAuthenticatedUser);

      expect(mockProjectsService.create).toHaveBeenCalledWith(
        createDto,
        mockAuthenticatedUser
      );
      expect(result).toEqual(createdProject);
    });

    it('should pass authenticated user to service', async () => {
      const createDto: CreateProjectDto = {
        name: 'User Test Project',
      } as CreateProjectDto;

      mockProjectsService.create.mockResolvedValue({ id: '1', ...createDto });

      await controller.create(createDto, mockAuthenticatedUser);

      expect(mockProjectsService.create).toHaveBeenCalledWith(
        createDto,
        mockAuthenticatedUser
      );
    });

    it('should handle service errors', async () => {
      const createDto: CreateProjectDto = {
        name: 'Error Project',
      } as CreateProjectDto;

      mockProjectsService.create.mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        controller.create(createDto, mockAuthenticatedUser)
      ).rejects.toThrow('Database error');
    });

    it('should create project with minimal data', async () => {
      const createDto: CreateProjectDto = {
        name: 'Minimal Project',
      } as CreateProjectDto;

      const createdProject = { id: 'min-1', name: 'Minimal Project' };
      mockProjectsService.create.mockResolvedValue(createdProject);

      const result = await controller.create(createDto, mockAuthenticatedUser);

      expect(result.name).toBe('Minimal Project');
    });

    it('should create project with all fields', async () => {
      const createDto: CreateProjectDto = {
        name: 'Complete Project',
        priority: 'medium',
        backtech: 'Express',
        fronttech: 'Vue',
        cloudTech: 'GCP',
        sprintsQuantity: 10,
        endDate: '2026-01-01',
      } as CreateProjectDto;

      const createdProject = { id: 'complete-1', ...createDto };
      mockProjectsService.create.mockResolvedValue(createdProject);

      const result = await controller.create(createDto, mockAuthenticatedUser);

      expect(result).toMatchObject(createDto);
    });
  });

  describe('findAll', () => {
    it('should return all projects', async () => {
      const mockProjects = [
        { id: '1', name: 'Project 1', priority: 'high' },
        { id: '2', name: 'Project 2', priority: 'medium' },
        { id: '3', name: 'Project 3', priority: 'low' },
      ];

      mockProjectsService.findAll.mockResolvedValue(mockProjects);

      const result = await controller.findAll(mockAuthenticatedUser);

      expect(mockProjectsService.findAll).toHaveBeenCalledWith(
        mockAuthenticatedUser
      );
      expect(result).toEqual(mockProjects);
      expect(result).toHaveLength(3);
    });

    it('should return empty array if no projects found', async () => {
      mockProjectsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(mockAuthenticatedUser);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should pass authenticated user to service', async () => {
      mockProjectsService.findAll.mockResolvedValue([]);

      await controller.findAll(mockAuthenticatedUser);

      expect(mockProjectsService.findAll).toHaveBeenCalledWith(
        mockAuthenticatedUser
      );
    });

    it('should handle service errors', async () => {
      mockProjectsService.findAll.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(controller.findAll(mockAuthenticatedUser)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should return projects with different structures', async () => {
      const mockProjects = [
        { id: '1', name: 'Simple', priority: 'high' },
        {
          id: '2',
          name: 'Complete',
          priority: 'medium',
          backtech: 'NestJS',
          fronttech: 'React',
          cloudTech: 'AWS',
          sprintsQuantity: 5,
          endDate: '2025-12-31',
        },
      ];

      mockProjectsService.findAll.mockResolvedValue(mockProjects);

      const result = await controller.findAll(mockAuthenticatedUser);

      expect(result[0]).toHaveProperty('name');
      expect(result[1]).toHaveProperty('backtech');
      expect(result[1]).toHaveProperty('sprintsQuantity');
    });
  });

  describe('findOne', () => {
    it('should find a project by id', async () => {
      const projectId = 'project-456';
      const mockProject = {
        id: projectId,
        name: 'Found Project',
        priority: 'high',
      };

      mockProjectsService.findOne.mockResolvedValue(mockProject);

      const result = await controller.findOne(projectId, mockAuthenticatedUser);

      expect(mockProjectsService.findOne).toHaveBeenCalledWith(
        projectId,
        mockAuthenticatedUser
      );
      expect(result).toEqual(mockProject);
    });

    it('should return null if project not found', async () => {
      const projectId = 'non-existent';
      mockProjectsService.findOne.mockResolvedValue(null);

      const result = await controller.findOne(projectId, mockAuthenticatedUser);

      expect(result).toBeNull();
    });

    it('should pass authenticated user to service', async () => {
      const projectId = 'proj-123';
      mockProjectsService.findOne.mockResolvedValue({
        id: projectId,
        name: 'Project',
      });

      await controller.findOne(projectId, mockAuthenticatedUser);

      expect(mockProjectsService.findOne).toHaveBeenCalledWith(
        projectId,
        mockAuthenticatedUser
      );
    });

    it('should handle UUID format ids', async () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      mockProjectsService.findOne.mockResolvedValue({
        id: uuid,
        name: 'UUID Project',
      });

      const result = await controller.findOne(uuid, mockAuthenticatedUser);

      expect(result.id).toBe(uuid);
    });

    it('should handle service errors', async () => {
      mockProjectsService.findOne.mockRejectedValue(
        new Error('Query failed')
      );

      await expect(
        controller.findOne('any-id', mockAuthenticatedUser)
      ).rejects.toThrow('Query failed');
    });
  });

  describe('update', () => {
    it('should update a project successfully', async () => {
      const projectId = 'project-789';
      const updateDto: UpdateProjectDto = {
        name: 'Updated Project',
        priority: 'low',
      };

      const updatedProject = {
        id: projectId,
        name: 'Updated Project',
        priority: 'low',
      };

      mockProjectsService.update.mockResolvedValue(updatedProject);

      const result = await controller.update(
        projectId,
        updateDto,
        mockAuthenticatedUser
      );

      expect(mockProjectsService.update).toHaveBeenCalledWith(
        projectId,
        updateDto,
        mockAuthenticatedUser
      );
      expect(result).toEqual(updatedProject);
    });

    it('should throw NotFoundException if project not found', async () => {
      const projectId = 'non-existent';
      const updateDto: UpdateProjectDto = {
        name: 'Updated',
      };

      mockProjectsService.update.mockRejectedValue(
        new NotFoundException('Project not found')
      );

      await expect(
        controller.update(projectId, updateDto, mockAuthenticatedUser)
      ).rejects.toThrow(NotFoundException);
    });

    it('should pass all parameters to service', async () => {
      const projectId = 'proj-update';
      const updateDto: UpdateProjectDto = {
        priority: 'high',
        backtech: 'Express',
      };

      mockProjectsService.update.mockResolvedValue({
        id: projectId,
        ...updateDto,
      });

      await controller.update(projectId, updateDto, mockAuthenticatedUser);

      expect(mockProjectsService.update).toHaveBeenCalledWith(
        projectId,
        updateDto,
        mockAuthenticatedUser
      );
    });

    it('should update only provided fields', async () => {
      const projectId = 'partial-update';
      const updateDto: UpdateProjectDto = {
        priority: 'medium',
      };

      mockProjectsService.update.mockResolvedValue({
        id: projectId,
        name: 'Existing Name',
        priority: 'medium',
      });

      const result = await controller.update(
        projectId,
        updateDto,
        mockAuthenticatedUser
      );

      expect(result.priority).toBe('medium');
      expect(result.name).toBe('Existing Name');
    });

    it('should handle multiple field updates', async () => {
      const projectId = 'multi-update';
      const updateDto: UpdateProjectDto = {
        name: 'New Name',
        priority: 'low',
        backtech: 'Express',
        fronttech: 'Angular',
        cloudTech: 'Azure',
        sprintsQuantity: 8,
        endDate: '2026-06-30',
      };

      mockProjectsService.update.mockResolvedValue({
        id: projectId,
        ...updateDto,
      });

      const result = await controller.update(
        projectId,
        updateDto,
        mockAuthenticatedUser
      );

      expect(result).toMatchObject(updateDto);
    });

    it('should handle service errors', async () => {
      const projectId = 'error-update';
      const updateDto: UpdateProjectDto = { name: 'Error' };

      mockProjectsService.update.mockRejectedValue(
        new Error('Update failed')
      );

      await expect(
        controller.update(projectId, updateDto, mockAuthenticatedUser)
      ).rejects.toThrow('Update failed');
    });
  });

  describe('remove', () => {
    it('should remove a project successfully', async () => {
      const projectId = 'project-remove';

      mockProjectsService.remove.mockResolvedValue({
        id: projectId,
        name: 'Removed Project',
      });

      const result = await controller.remove(projectId, mockAuthenticatedUser);

      expect(mockProjectsService.remove).toHaveBeenCalledWith(
        projectId,
        mockAuthenticatedUser
      );
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException if project not found', async () => {
      const projectId = 'non-existent';

      mockProjectsService.remove.mockRejectedValue(
        new NotFoundException('Project not found')
      );

      await expect(
        controller.remove(projectId, mockAuthenticatedUser)
      ).rejects.toThrow(NotFoundException);
    });

    it('should pass authenticated user to service', async () => {
      const projectId = 'proj-delete';

      mockProjectsService.remove.mockResolvedValue({
        id: projectId,
        name: 'Deleted',
      });

      await controller.remove(projectId, mockAuthenticatedUser);

      expect(mockProjectsService.remove).toHaveBeenCalledWith(
        projectId,
        mockAuthenticatedUser
      );
    });

    it('should return undefined (204 No Content)', async () => {
      const projectId = 'proj-204';

      mockProjectsService.remove.mockResolvedValue({
        id: projectId,
        name: 'Deleted',
      });

      const result = await controller.remove(projectId, mockAuthenticatedUser);

      expect(result).toBeUndefined();
    });

    it('should handle UUID format ids', async () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';

      mockProjectsService.remove.mockResolvedValue({
        id: uuid,
        name: 'UUID Project',
      });

      await controller.remove(uuid, mockAuthenticatedUser);

      expect(mockProjectsService.remove).toHaveBeenCalledWith(
        uuid,
        mockAuthenticatedUser
      );
    });

    it('should handle service errors', async () => {
      mockProjectsService.remove.mockRejectedValue(
        new Error('Delete failed')
      );

      await expect(
        controller.remove('any-id', mockAuthenticatedUser)
      ).rejects.toThrow('Delete failed');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete CRUD workflow', async () => {
      // Create
      const createDto: CreateProjectDto = {
        name: 'CRUD Project',
        priority: 'high',
      } as CreateProjectDto;

      const createdProject = { id: 'crud-1', ...createDto };
      mockProjectsService.create.mockResolvedValue(createdProject);

      const created = await controller.create(createDto, mockAuthenticatedUser);
      expect(created.id).toBe('crud-1');

      // FindAll
      mockProjectsService.findAll.mockResolvedValue([createdProject]);
      const all = await controller.findAll(mockAuthenticatedUser);
      expect(all).toHaveLength(1);

      // FindOne
      mockProjectsService.findOne.mockResolvedValue(createdProject);
      const found = await controller.findOne('crud-1', mockAuthenticatedUser);
      expect(found.name).toBe('CRUD Project');

      // Update
      const updateDto: UpdateProjectDto = { priority: 'low' };
      mockProjectsService.update.mockResolvedValue({
        ...createdProject,
        priority: 'low',
      });
      const updated = await controller.update(
        'crud-1',
        updateDto,
        mockAuthenticatedUser
      );
      expect(updated.priority).toBe('low');

      // Remove
      mockProjectsService.remove.mockResolvedValue(createdProject);
      await controller.remove('crud-1', mockAuthenticatedUser);

      // Verify all methods were called
      expect(mockProjectsService.create).toHaveBeenCalled();
      expect(mockProjectsService.findAll).toHaveBeenCalled();
      expect(mockProjectsService.findOne).toHaveBeenCalled();
      expect(mockProjectsService.update).toHaveBeenCalled();
      expect(mockProjectsService.remove).toHaveBeenCalled();
    });
  });

  describe('Authenticated user handling', () => {
    it('should pass different authenticated users correctly', async () => {
      const user1: AuthenticatedUserInterface = {
        user: {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'User One',
          fullName: 'User One Full',
          createdAt: '2025-01-01',
          lastLogin: '2025-01-15',
          token: 'token-1',
        },
      } as AuthenticatedUserInterface;

      const user2: AuthenticatedUserInterface = {
        user: {
          id: 'user-2',
          email: 'user2@example.com',
          name: 'User Two',
          fullName: 'User Two Full',
          createdAt: '2025-01-01',
          lastLogin: '2025-01-15',
          token: 'token-2',
        },
      } as AuthenticatedUserInterface;

      mockProjectsService.findAll.mockResolvedValue([]);

      await controller.findAll(user1);
      expect(mockProjectsService.findAll).toHaveBeenCalledWith(user1);

      await controller.findAll(user2);
      expect(mockProjectsService.findAll).toHaveBeenCalledWith(user2);
    });

    it('should maintain user context across all operations', async () => {
      const createDto: CreateProjectDto = { name: 'Test' } as CreateProjectDto;
      const updateDto: UpdateProjectDto = { name: 'Updated' };

      mockProjectsService.create.mockResolvedValue({ id: '1', name: 'Test' });
      mockProjectsService.findAll.mockResolvedValue([]);
      mockProjectsService.findOne.mockResolvedValue({ id: '1', name: 'Test' });
      mockProjectsService.update.mockResolvedValue({
        id: '1',
        name: 'Updated',
      });
      mockProjectsService.remove.mockResolvedValue({ id: '1', name: 'Test' });

      await controller.create(createDto, mockAuthenticatedUser);
      await controller.findAll(mockAuthenticatedUser);
      await controller.findOne('1', mockAuthenticatedUser);
      await controller.update('1', updateDto, mockAuthenticatedUser);
      await controller.remove('1', mockAuthenticatedUser);

      // All calls should include the same authenticated user
      expect(mockProjectsService.create).toHaveBeenCalledWith(
        expect.anything(),
        mockAuthenticatedUser
      );
      expect(mockProjectsService.findAll).toHaveBeenCalledWith(
        mockAuthenticatedUser
      );
      expect(mockProjectsService.findOne).toHaveBeenCalledWith(
        expect.anything(),
        mockAuthenticatedUser
      );
      expect(mockProjectsService.update).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        mockAuthenticatedUser
      );
      expect(mockProjectsService.remove).toHaveBeenCalledWith(
        expect.anything(),
        mockAuthenticatedUser
      );
    });
  });

  describe('Error handling', () => {
    it('should propagate NotFoundException from service', async () => {
      mockProjectsService.findOne.mockRejectedValue(
        new NotFoundException('Project not found')
      );

      await expect(
        controller.findOne('invalid', mockAuthenticatedUser)
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate generic errors from service', async () => {
      mockProjectsService.create.mockRejectedValue(
        new Error('Unexpected error')
      );

      await expect(
        controller.create({} as CreateProjectDto, mockAuthenticatedUser)
      ).rejects.toThrow('Unexpected error');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty create DTO', async () => {
      const createDto = {} as CreateProjectDto;

      mockProjectsService.create.mockResolvedValue({
        id: 'empty-1',
        name: undefined,
      });

      const result = await controller.create(createDto, mockAuthenticatedUser);

      expect(mockProjectsService.create).toHaveBeenCalledWith(
        createDto,
        mockAuthenticatedUser
      );
    });

    it('should handle empty update DTO', async () => {
      const updateDto = {} as UpdateProjectDto;

      mockProjectsService.update.mockResolvedValue({
        id: 'proj-1',
        name: 'Unchanged',
      });

      const result = await controller.update(
        'proj-1',
        updateDto,
        mockAuthenticatedUser
      );

      expect(mockProjectsService.update).toHaveBeenCalledWith(
        'proj-1',
        updateDto,
        mockAuthenticatedUser
      );
    });

    it('should handle special characters in project id', async () => {
      const specialId = 'project-with-@#$%-chars';

      mockProjectsService.findOne.mockResolvedValue({
        id: specialId,
        name: 'Special',
      });

      const result = await controller.findOne(specialId, mockAuthenticatedUser);

      expect(result.id).toBe(specialId);
    });

    it('should handle very long project names', async () => {
      const longName = 'A'.repeat(1000);
      const createDto: CreateProjectDto = {
        name: longName,
      } as CreateProjectDto;

      mockProjectsService.create.mockResolvedValue({ id: '1', name: longName });

      const result = await controller.create(createDto, mockAuthenticatedUser);

      expect(result.name).toBe(longName);
    });
  });
});