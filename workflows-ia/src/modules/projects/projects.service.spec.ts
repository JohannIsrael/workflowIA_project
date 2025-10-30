import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { AuthServiceProxy } from '../auth/proxies/auth-service.proxy';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Projects } from '../gemini/entities/Projects.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AuthenticatedUserInterface } from '../auth/interfaces/authenticated-user-interface';
import { NotFoundException } from '@nestjs/common';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let mockAuthServiceProxy: any;
  let mockProjectsRepository: any;
  let mockAuthenticatedUser: AuthenticatedUserInterface;

  beforeEach(async () => {
    // Mock AuthServiceProxy
    mockAuthServiceProxy = {
      logAction: jest.fn().mockResolvedValue(undefined),
    };

    // Mock Projects Repository
    mockProjectsRepository = {
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
        ProjectsService,
        {
          provide: AuthServiceProxy,
          useValue: mockAuthServiceProxy,
        },
        {
          provide: getRepositoryToken(Projects),
          useValue: mockProjectsRepository,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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

      const savedProject = {
        id: 'project-123',
        ...createDto,
      };

      mockProjectsRepository.save.mockResolvedValue(savedProject);

      const result = await service.create(createDto, mockAuthenticatedUser);

      expect(mockProjectsRepository.save).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(savedProject);
    });

    it('should create audit log for project creation', async () => {
      const createDto: CreateProjectDto = {
        name: 'Audit Project',
      } as CreateProjectDto;

      const savedProject = { id: 'proj-1', ...createDto };
      mockProjectsRepository.save.mockResolvedValue(savedProject);

      await service.create(createDto, mockAuthenticatedUser);

      expect(mockAuthServiceProxy.logAction).toHaveBeenCalled();
      
      const auditLogCall = mockAuthServiceProxy.logAction.mock.calls[0][0];
      expect(auditLogCall.action).toBe('CREATE_PROJECT');
      expect(auditLogCall.user).toEqual(mockAuthenticatedUser.user);
    });

    it('should include timestamp in audit log', async () => {
      const createDto: CreateProjectDto = {
        name: 'Project',
      } as CreateProjectDto;

      mockProjectsRepository.save.mockResolvedValue({ id: '1', ...createDto });

      await service.create(createDto, mockAuthenticatedUser);

      const auditLogCall = mockAuthServiceProxy.logAction.mock.calls[0][0];
      expect(auditLogCall.createdAt).toBeDefined();
      expect(typeof auditLogCall.createdAt).toBe('string');
    });

    it('should handle repository save errors', async () => {
      const createDto: CreateProjectDto = {
        name: 'Error Project',
      } as CreateProjectDto;

      mockProjectsRepository.save.mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        service.create(createDto, mockAuthenticatedUser)
      ).rejects.toThrow('Database error');
    });

    it('should create project with all optional fields', async () => {
      const createDto: CreateProjectDto = {
        name: 'Complete Project',
        priority: 'medium',
        backtech: 'Express',
        fronttech: 'Vue',
        cloudTech: 'GCP',
        sprintsQuantity: 10,
        endDate: '2026-01-01',
      } as CreateProjectDto;

      const savedProject = { id: 'proj-complete', ...createDto };
      mockProjectsRepository.save.mockResolvedValue(savedProject);

      const result = await service.create(createDto, mockAuthenticatedUser);

      expect(result.priority).toBe('medium');
      expect(result.sprintsQuantity).toBe(10);
      expect(result.cloudTech).toBe('GCP');
    });
  });

  describe('findAll', () => {
    it('should return all projects', async () => {
      const mockProjects = [
        { id: '1', name: 'Project 1', priority: 'high' },
        { id: '2', name: 'Project 2', priority: 'medium' },
        { id: '3', name: 'Project 3', priority: 'low' },
      ];

      mockProjectsRepository.find.mockResolvedValue(mockProjects);

      const result = await service.findAll(mockAuthenticatedUser);

      expect(mockProjectsRepository.find).toHaveBeenCalled();
      expect(result).toEqual(mockProjects);
      expect(result).toHaveLength(3);
    });

    it('should create audit log for findAll', async () => {
      mockProjectsRepository.find.mockResolvedValue([]);

      await service.findAll(mockAuthenticatedUser);

      expect(mockAuthServiceProxy.logAction).toHaveBeenCalled();
      
      const auditLogCall = mockAuthServiceProxy.logAction.mock.calls[0][0];
      expect(auditLogCall.action).toBe('GET_ALL_PROJECTS');
    });

    it('should return empty array if no projects found', async () => {
      mockProjectsRepository.find.mockResolvedValue([]);

      const result = await service.findAll(mockAuthenticatedUser);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle repository find errors', async () => {
      mockProjectsRepository.find.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(service.findAll(mockAuthenticatedUser)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should include user in audit log', async () => {
      mockProjectsRepository.find.mockResolvedValue([]);

      await service.findAll(mockAuthenticatedUser);

      const auditLogCall = mockAuthServiceProxy.logAction.mock.calls[0][0];
      expect(auditLogCall.user).toEqual(mockAuthenticatedUser.user);
      expect(auditLogCall.user.id).toBe('user-123');
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

      mockProjectsRepository.findOne.mockResolvedValue(mockProject);

      const result = await service.findOne(projectId, mockAuthenticatedUser);

      expect(mockProjectsRepository.findOne).toHaveBeenCalledWith({
        where: { id: projectId },
      });
      expect(result).toEqual(mockProject);
    });

    it('should create audit log for findOne', async () => {
      const projectId = 'proj-audit';
      mockProjectsRepository.findOne.mockResolvedValue({
        id: projectId,
        name: 'Project',
      });

      await service.findOne(projectId, mockAuthenticatedUser);

      expect(mockAuthServiceProxy.logAction).toHaveBeenCalled();
      
      const auditLogCall = mockAuthServiceProxy.logAction.mock.calls[0][0];
      expect(auditLogCall.action).toBe('GET_PROJECT');
      expect(auditLogCall.description).toContain(projectId);
    });

    it('should return null if project not found', async () => {
      const projectId = 'non-existent';
      mockProjectsRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(projectId, mockAuthenticatedUser);

      expect(result).toBeNull();
    });

    it('should include project id in audit log description', async () => {
      const projectId = 'specific-project-id';
      mockProjectsRepository.findOne.mockResolvedValue({
        id: projectId,
        name: 'Project',
      });

      await service.findOne(projectId, mockAuthenticatedUser);

      const auditLogCall = mockAuthServiceProxy.logAction.mock.calls[0][0];
      expect(auditLogCall.description).toBe(`Get project with id: ${projectId}`);
    });

    it('should handle repository findOne errors', async () => {
      mockProjectsRepository.findOne.mockRejectedValue(
        new Error('Query failed')
      );

      await expect(
        service.findOne('any-id', mockAuthenticatedUser)
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

      const existingProject = {
        id: projectId,
        name: 'Old Project',
        priority: 'high',
      };

      const updatedProject = {
        ...existingProject,
        ...updateDto,
      };

      mockProjectsRepository.findOne.mockResolvedValue(existingProject);
      mockProjectsRepository.save.mockResolvedValue(updatedProject);

      const result = await service.update(
        projectId,
        updateDto,
        mockAuthenticatedUser
      );

      expect(mockProjectsRepository.findOne).toHaveBeenCalledWith({
        where: { id: projectId },
      });
      expect(mockProjectsRepository.save).toHaveBeenCalledWith({
        ...existingProject,
        ...updateDto,
      });
      expect(result).toEqual(existingProject);
    });

    it('should throw NotFoundException if project not found', async () => {
      const projectId = 'non-existent';
      const updateDto: UpdateProjectDto = {
        name: 'Updated',
      };

      mockProjectsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(projectId, updateDto, mockAuthenticatedUser)
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.update(projectId, updateDto, mockAuthenticatedUser)
      ).rejects.toThrow('Project not found');
    });

    it('should create audit log for update', async () => {
      const projectId = 'proj-update';
      const updateDto: UpdateProjectDto = { name: 'New Name' };

      mockProjectsRepository.findOne.mockResolvedValue({
        id: projectId,
        name: 'Old Name',
      });
      mockProjectsRepository.save.mockResolvedValue({
        id: projectId,
        name: 'New Name',
      });

      await service.update(projectId, updateDto, mockAuthenticatedUser);

      expect(mockAuthServiceProxy.logAction).toHaveBeenCalled();
      
      const auditLogCall = mockAuthServiceProxy.logAction.mock.calls[0][0];
      expect(auditLogCall.action).toBe('UPDATE_PROJECT');
      expect(auditLogCall.description).toContain(projectId);
    });

    it('should update only provided fields', async () => {
      const projectId = 'partial-update';
      const updateDto: UpdateProjectDto = {
        priority: 'medium',
      };

      const existingProject = {
        id: projectId,
        name: 'Project Name',
        priority: 'high',
        backtech: 'NestJS',
      };

      mockProjectsRepository.findOne.mockResolvedValue(existingProject);
      mockProjectsRepository.save.mockResolvedValue({
        ...existingProject,
        priority: 'medium',
      });

      await service.update(projectId, updateDto, mockAuthenticatedUser);

      expect(mockProjectsRepository.save).toHaveBeenCalledWith({
        ...existingProject,
        priority: 'medium',
      });
    });

    it('should not call save if project not found', async () => {
      const projectId = 'non-existent';
      const updateDto: UpdateProjectDto = { name: 'Test' };

      mockProjectsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(projectId, updateDto, mockAuthenticatedUser)
      ).rejects.toThrow();

      expect(mockProjectsRepository.save).not.toHaveBeenCalled();
    });

    it('should handle multiple field updates', async () => {
      const projectId = 'multi-update';
      const updateDto: UpdateProjectDto = {
        name: 'New Name',
        priority: 'low',
        backtech: 'Express',
        fronttech: 'Angular',
        sprintsQuantity: 8,
      };

      const existingProject = {
        id: projectId,
        name: 'Old',
        priority: 'high',
      };

      mockProjectsRepository.findOne.mockResolvedValue(existingProject);
      mockProjectsRepository.save.mockResolvedValue({
        ...existingProject,
        ...updateDto,
      });

      await service.update(projectId, updateDto, mockAuthenticatedUser);

      expect(mockProjectsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Name',
          priority: 'low',
          backtech: 'Express',
          fronttech: 'Angular',
          sprintsQuantity: 8,
        })
      );
    });
  });

  describe('remove', () => {
    it('should remove a project successfully', async () => {
      const projectId = 'project-remove';
      const mockProject = {
        id: projectId,
        name: 'Project to Remove',
      };

      mockProjectsRepository.findOne.mockResolvedValue(mockProject);
      mockProjectsRepository.remove.mockResolvedValue(mockProject);

      const result = await service.remove(projectId, mockAuthenticatedUser);

      expect(mockProjectsRepository.findOne).toHaveBeenCalledWith({
        where: { id: projectId },
      });
      expect(mockProjectsRepository.remove).toHaveBeenCalledWith(mockProject);
      expect(result).toEqual(mockProject);
    });

    it('should throw NotFoundException if project not found', async () => {
      const projectId = 'non-existent';

      mockProjectsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.remove(projectId, mockAuthenticatedUser)
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.remove(projectId, mockAuthenticatedUser)
      ).rejects.toThrow('Project not found');
    });

    it('should create audit log for remove', async () => {
      const projectId = 'proj-delete';
      mockProjectsRepository.findOne.mockResolvedValue({
        id: projectId,
        name: 'To Delete',
      });
      mockProjectsRepository.remove.mockResolvedValue({});

      await service.remove(projectId, mockAuthenticatedUser);

      expect(mockAuthServiceProxy.logAction).toHaveBeenCalled();
      
      const auditLogCall = mockAuthServiceProxy.logAction.mock.calls[0][0];
      expect(auditLogCall.action).toBe('DELETE_PROJECT');
      expect(auditLogCall.description).toContain(projectId);
    });

    it('should not call remove if project not found', async () => {
      const projectId = 'non-existent';

      mockProjectsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.remove(projectId, mockAuthenticatedUser)
      ).rejects.toThrow();

      expect(mockProjectsRepository.remove).not.toHaveBeenCalled();
    });

    it('should include project id in audit log description', async () => {
      const projectId = 'specific-delete-id';
      mockProjectsRepository.findOne.mockResolvedValue({
        id: projectId,
        name: 'Project',
      });
      mockProjectsRepository.remove.mockResolvedValue({});

      await service.remove(projectId, mockAuthenticatedUser);

      const auditLogCall = mockAuthServiceProxy.logAction.mock.calls[0][0];
      expect(auditLogCall.description).toBe(
        `Delete project with id: ${projectId}`
      );
    });

    it('should handle repository remove errors', async () => {
      const projectId = 'error-remove';
      mockProjectsRepository.findOne.mockResolvedValue({
        id: projectId,
        name: 'Project',
      });
      mockProjectsRepository.remove.mockRejectedValue(
        new Error('Delete failed')
      );

      await expect(
        service.remove(projectId, mockAuthenticatedUser)
      ).rejects.toThrow('Delete failed');
    });
  });

  describe('createAuditLog (private method)', () => {
    it('should create audit log with correct structure via create method', async () => {
      const createDto: CreateProjectDto = {
        name: 'Test',
      } as CreateProjectDto;

      mockProjectsRepository.save.mockResolvedValue({ id: '1', ...createDto });

      await service.create(createDto, mockAuthenticatedUser);

      const auditLogCall = mockAuthServiceProxy.logAction.mock.calls[0][0];
      
      expect(auditLogCall).toHaveProperty('action');
      expect(auditLogCall).toHaveProperty('description');
      expect(auditLogCall).toHaveProperty('details');
      expect(auditLogCall).toHaveProperty('createdAt');
      expect(auditLogCall).toHaveProperty('user');
    });

    it('should handle null description and details', async () => {
      mockProjectsRepository.find.mockResolvedValue([]);

      await service.findAll(mockAuthenticatedUser);

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

      mockProjectsRepository.find.mockResolvedValue([]);

      await service.findAll(customUser);

      const auditLogCall = mockAuthServiceProxy.logAction.mock.calls[0][0];
      expect(auditLogCall.user.id).toBe('custom-user-id');
      expect(auditLogCall.user.email).toBe('custom@example.com');
    });
  });

  describe('Integration scenarios', () => {
    it('should complete CRUD workflow', async () => {
      // Create
      const createDto: CreateProjectDto = {
        name: 'CRUD Project',
        priority: 'high',
      } as CreateProjectDto;

      const createdProject = { id: 'crud-1', ...createDto };
      mockProjectsRepository.save.mockResolvedValue(createdProject);

      const created = await service.create(createDto, mockAuthenticatedUser);
      expect(created.id).toBe('crud-1');

      // FindAll
      mockProjectsRepository.find.mockResolvedValue([createdProject]);
      const all = await service.findAll(mockAuthenticatedUser);
      expect(all).toHaveLength(1);

      // FindOne
      mockProjectsRepository.findOne.mockResolvedValue(createdProject);
      const found = await service.findOne('crud-1', mockAuthenticatedUser);
      expect(found.name).toBe('CRUD Project');

      // Update
      const updateDto: UpdateProjectDto = { priority: 'low' };
      mockProjectsRepository.findOne.mockResolvedValue(createdProject);
      mockProjectsRepository.save.mockResolvedValue({
        ...createdProject,
        priority: 'low',
      });
      await service.update('crud-1', updateDto, mockAuthenticatedUser);

      // Remove
      mockProjectsRepository.findOne.mockResolvedValue(createdProject);
      mockProjectsRepository.remove.mockResolvedValue(createdProject);
      await service.remove('crud-1', mockAuthenticatedUser);

      // Verify all audit logs were created
      expect(mockAuthServiceProxy.logAction).toHaveBeenCalledTimes(5);
    });
  });

  describe('Edge cases', () => {
    it('should handle very long project names', async () => {
      const longName = 'A'.repeat(1000);
      const createDto: CreateProjectDto = {
        name: longName,
      } as CreateProjectDto;

      mockProjectsRepository.save.mockResolvedValue({ id: '1', ...createDto });

      const result = await service.create(createDto, mockAuthenticatedUser);

      expect(result.name).toBe(longName);
    });

    it('should handle special characters in project name', async () => {
      const createDto: CreateProjectDto = {
        name: 'Project @#$% with "quotes" and \'apostrophes\'',
      } as CreateProjectDto;

      mockProjectsRepository.save.mockResolvedValue({ id: '1', ...createDto });

      const result = await service.create(createDto, mockAuthenticatedUser);

      expect(result.name).toContain('@#$%');
    });

    it('should handle UUID format for project id', async () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      mockProjectsRepository.findOne.mockResolvedValue({
        id: uuid,
        name: 'UUID Project',
      });

      const result = await service.findOne(uuid, mockAuthenticatedUser);

      expect(result.id).toBe(uuid);
    });
  });
});