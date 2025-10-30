import { Test, TestingModule } from '@nestjs/testing';
import { GeminiController } from './gemini.controller';
import { GeminiService } from './gemini.service';

describe('GeminiController', () => {
  let controller: GeminiController;
  let service: GeminiService;

  const mockGeminiService = {
    createProject: jest.fn(),
    predictProject: jest.fn(),
    optimizeProject: jest.fn(),
    executeStrategy: jest.fn(),
    getAvailableStrategies: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GeminiController],
      providers: [
        {
          provide: GeminiService,
          useValue: mockGeminiService,
        },
      ],
    }).compile();

    controller = module.get<GeminiController>(GeminiController);
    service = module.get<GeminiService>(GeminiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generateProject', () => {
    it('should create a project and return sanitized response', async () => {
      const idea = 'Create an e-commerce platform';
      const mockProject = {
        id: 'proj-123',
        name: 'E-commerce Platform',
        priority: 'high',
        backtech: 'NestJS',
        fronttech: 'React',
        cloudTech: 'AWS',
        sprintsQuantity: 5,
        endDate: '2025-12-31',
        tasks: [
          {
            id: 'task-1',
            name: 'Setup database',
            description: 'Configure PostgreSQL',
            assignedTo: 'John',
            sprint: 1,
          },
        ],
      };

      mockGeminiService.createProject.mockResolvedValue(mockProject);

      const result = await controller.generateProject(idea);

      expect(service.createProject).toHaveBeenCalledWith(idea);
      expect(result).toEqual({
        id: 'proj-123',
        name: 'E-commerce Platform',
        priority: 'high',
        backtech: 'NestJS',
        fronttech: 'React',
        cloudTech: 'AWS',
        sprintsQuantity: 5,
        endDate: '2025-12-31',
        tasks: [
          {
            id: 'task-1',
            name: 'Setup database',
            description: 'Configure PostgreSQL',
            assignedTo: 'John',
            sprint: 1,
          },
        ],
      });
    });

    it('should handle array of projects', async () => {
      const idea = 'Create 3 microservices';
      const mockProjects = [
        { 
          id: '1', 
          name: 'Service 1', 
          priority: 'high',
          backtech: 'NestJS',
          fronttech: 'React',
          cloudTech: 'AWS',
          sprintsQuantity: 3,
          endDate: '2025-12-31',
          tasks: [] 
        },
        { 
          id: '2', 
          name: 'Service 2', 
          priority: 'medium',
          backtech: 'Express',
          fronttech: 'Vue',
          cloudTech: 'GCP',
          sprintsQuantity: 2,
          endDate: '2025-11-30',
          tasks: [] 
        },
      ];

      mockGeminiService.createProject.mockResolvedValue(mockProjects);

      const result = await controller.generateProject(idea);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Service 1');
      expect(result[1].name).toBe('Service 2');
    });

    it('should sanitize project removing internal fields', async () => {
      const idea = 'Create project';
      const mockProject = {
        id: '123',
        name: 'Test',
        priority: 'high',
        backtech: 'Node',
        fronttech: 'React',
        cloudTech: 'AWS',
        sprintsQuantity: 2,
        endDate: '2025-12-01',
        tasks: [],
        internalField: 'should be removed',
        __metadata: 'should be removed',
      };

      mockGeminiService.createProject.mockResolvedValue(mockProject);

      const result = await controller.generateProject(idea);

      expect(result).not.toHaveProperty('internalField');
      expect(result).not.toHaveProperty('__metadata');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
    });

    it('should sanitize tasks removing extra fields', async () => {
      const idea = 'Create project';
      const mockProject = {
        id: '123',
        name: 'Test',
        priority: 'high',
        backtech: 'Node',
        fronttech: 'React',
        cloudTech: 'AWS',
        sprintsQuantity: 2,
        endDate: '2025-12-01',
        tasks: [
          {
            id: 't1',
            name: 'Task 1',
            description: 'Description',
            assignedTo: 'Dev',
            sprint: 1,
            extraField: 'should be removed',
            internalData: 'should be removed',
          },
        ],
      };

      mockGeminiService.createProject.mockResolvedValue(mockProject);

      const result = await controller.generateProject(idea);

      expect(result.tasks[0]).not.toHaveProperty('extraField');
      expect(result.tasks[0]).not.toHaveProperty('internalData');
      expect(result.tasks[0]).toHaveProperty('id');
      expect(result.tasks[0]).toHaveProperty('name');
      expect(result.tasks[0]).toHaveProperty('description');
      expect(result.tasks[0]).toHaveProperty('assignedTo');
      expect(result.tasks[0]).toHaveProperty('sprint');
    });

    it('should handle project with null tasks', async () => {
      const idea = 'Create project';
      const mockProject = {
        id: '123',
        name: 'Test',
        priority: 'high',
        backtech: 'Node',
        fronttech: 'React',
        cloudTech: 'AWS',
        sprintsQuantity: 2,
        endDate: '2025-12-01',
        tasks: null,
      };

      mockGeminiService.createProject.mockResolvedValue(mockProject);

      const result = await controller.generateProject(idea);

      expect(result.tasks).toBeUndefined();
    });

    it('should handle project with undefined tasks', async () => {
      const idea = 'Create project';
      const mockProject = {
        id: '123',
        name: 'Test',
        priority: 'high',
        backtech: 'Node',
        fronttech: 'React',
        cloudTech: 'AWS',
        sprintsQuantity: 2,
        endDate: '2025-12-01',
      };

      mockGeminiService.createProject.mockResolvedValue(mockProject);

      const result = await controller.generateProject(idea);

      expect(result.tasks).toBeUndefined();
    });
  });

  describe('predictProject', () => {
    it('should predict project tasks and return sanitized response', async () => {
      const projectId = 'proj-123';
      const mockProject = {
        id: projectId,
        name: 'Test Project',
        priority: 'medium',
        backtech: 'Express',
        fronttech: 'Vue',
        cloudTech: 'Azure',
        sprintsQuantity: 3,
        endDate: '2025-11-30',
        tasks: [
          {
            id: 'task-1',
            name: 'Original Task',
            description: 'First task',
            assignedTo: 'Alice',
            sprint: 1,
          },
          {
            id: 'task-2',
            name: 'Predicted Task',
            description: 'New predicted task',
            assignedTo: 'Bob',
            sprint: 2,
          },
        ],
      };

      mockGeminiService.predictProject.mockResolvedValue(mockProject);

      const result = await controller.predictProject(projectId);

      expect(service.predictProject).toHaveBeenCalledWith(projectId);
      expect(result.tasks).toHaveLength(2);
      expect(result.tasks[1].name).toBe('Predicted Task');
    });

    it('should sanitize predicted project response', async () => {
      const projectId = 'proj-123';
      const mockProject = {
        id: projectId,
        name: 'Project',
        priority: 'high',
        backtech: 'NestJS',
        fronttech: 'Angular',
        cloudTech: 'AWS',
        sprintsQuantity: 4,
        endDate: '2025-12-15',
        tasks: [],
        __metadata: 'should be removed',
        internalField: 'should be removed',
      };

      mockGeminiService.predictProject.mockResolvedValue(mockProject);

      const result = await controller.predictProject(projectId);

      expect(result).not.toHaveProperty('__metadata');
      expect(result).not.toHaveProperty('internalField');
    });

    it('should handle null optional fields', async () => {
      const projectId = 'proj-123';
      const mockProject = {
        id: projectId,
        name: 'Project',
        priority: null,
        backtech: null,
        fronttech: null,
        cloudTech: null,
        sprintsQuantity: null,
        endDate: null,
        tasks: [],
      };

      mockGeminiService.predictProject.mockResolvedValue(mockProject);

      const result = await controller.predictProject(projectId);

      expect(result.priority).toBeNull();
      expect(result.sprintsQuantity).toBeNull();
      expect(result.endDate).toBeNull();
    });
  });

  describe('optimizeProject', () => {
    it('should optimize project tasks and return sanitized response', async () => {
      const projectId = 'proj-123';
      const mockProject = {
        id: projectId,
        name: 'Optimized Project',
        priority: 'high',
        backtech: 'NestJS',
        fronttech: 'Angular',
        cloudTech: 'Azure',
        sprintsQuantity: 4,
        endDate: '2025-12-15',
        tasks: [
          {
            id: 'opt-task-1',
            name: 'Optimized Task 1',
            description: 'Better task',
            assignedTo: 'Charlie',
            sprint: 1,
          },
        ],
      };

      mockGeminiService.optimizeProject.mockResolvedValue(mockProject);

      const result = await controller.optimizeProject(projectId);

      expect(service.optimizeProject).toHaveBeenCalledWith(projectId);
      expect(result.name).toBe('Optimized Project');
      expect(result.tasks).toHaveLength(1);
    });

    it('should sanitize optimized project response', async () => {
      const projectId = 'proj-123';
      const mockProject = {
        id: projectId,
        name: 'Project',
        priority: 'high',
        backtech: 'Node',
        fronttech: 'React',
        cloudTech: 'GCP',
        sprintsQuantity: 5,
        endDate: '2025-12-31',
        tasks: [],
        __metadata: { tasksRemoved: 3, tasksAdded: 0 },
      };

      mockGeminiService.optimizeProject.mockResolvedValue(mockProject);

      const result = await controller.optimizeProject(projectId);

      expect(result).not.toHaveProperty('__metadata');
    });

    it('should handle project with replaced tasks', async () => {
      const projectId = 'proj-123';
      const mockProject = {
        id: projectId,
        name: 'Project',
        priority: 'medium',
        backtech: 'Express',
        fronttech: 'Vue',
        cloudTech: 'AWS',
        sprintsQuantity: 3,
        endDate: '2025-11-30',
        tasks: [
          { id: 'new-1', name: 'New Task 1', description: 'Optimized', assignedTo: 'Dev1', sprint: 1 },
          { id: 'new-2', name: 'New Task 2', description: 'Optimized', assignedTo: 'Dev2', sprint: 2 },
        ],
      };

      mockGeminiService.optimizeProject.mockResolvedValue(mockProject);

      const result = await controller.optimizeProject(projectId);

      expect(result.tasks).toHaveLength(2);
      expect(result.tasks[0].id).toBe('new-1');
      expect(result.tasks[1].id).toBe('new-2');
    });
  });

  describe('executeStrategy', () => {
    it('should execute create strategy', async () => {
      const strategy = 'create';
      const userInput = 'Build a blog';
      const mockProject = {
        id: 'blog-1',
        name: 'Blog Platform',
        priority: 'low',
        backtech: 'Express',
        fronttech: 'React',
        cloudTech: 'Vercel',
        sprintsQuantity: 2,
        endDate: '2025-10-31',
        tasks: [],
      };

      mockGeminiService.executeStrategy.mockResolvedValue(mockProject);

      const result = await controller.executeStrategy(strategy, userInput);

      expect(service.executeStrategy).toHaveBeenCalledWith('create', {
        userInput,
        projectId: undefined,
      });
      expect(result.name).toBe('Blog Platform');
    });

    it('should execute predict strategy with projectId', async () => {
      const strategy = 'predict';
      const projectId = 'proj-456';
      const mockProject = {
        id: projectId,
        name: 'Updated Project',
        priority: 'high',
        backtech: 'NestJS',
        fronttech: 'Angular',
        cloudTech: 'AWS',
        sprintsQuantity: 4,
        endDate: '2025-12-15',
        tasks: [],
      };

      mockGeminiService.executeStrategy.mockResolvedValue(mockProject);

      const result = await controller.executeStrategy(
        strategy,
        undefined,
        projectId
      );

      expect(service.executeStrategy).toHaveBeenCalledWith('predict', {
        userInput: undefined,
        projectId,
      });
    });

    it('should execute optimize strategy with projectId', async () => {
      const strategy = 'optimize';
      const projectId = 'proj-789';
      const mockProject = {
        id: projectId,
        name: 'Optimized Project',
        priority: 'medium',
        backtech: 'Express',
        fronttech: 'Vue',
        cloudTech: 'GCP',
        sprintsQuantity: 3,
        endDate: '2025-11-30',
        tasks: [],
      };

      mockGeminiService.executeStrategy.mockResolvedValue(mockProject);

      const result = await controller.executeStrategy(
        strategy,
        undefined,
        projectId
      );

      expect(service.executeStrategy).toHaveBeenCalledWith('optimize', {
        userInput: undefined,
        projectId,
      });
    });

    it('should handle multiple projects response', async () => {
      const strategy = 'create';
      const userInput = 'Create 2 services';
      const mockProjects = [
        { id: '1', name: 'Service 1', tasks: [], priority: 'high', backtech: 'Node', fronttech: 'React', cloudTech: 'AWS', sprintsQuantity: 2, endDate: '2025-12-31' },
        { id: '2', name: 'Service 2', tasks: [], priority: 'medium', backtech: 'Express', fronttech: 'Vue', cloudTech: 'GCP', sprintsQuantity: 3, endDate: '2025-11-30' },
      ];

      mockGeminiService.executeStrategy.mockResolvedValue(mockProjects);

      const result = await controller.executeStrategy(strategy, userInput);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
    });

    it('should sanitize response from executeStrategy', async () => {
      const strategy = 'create';
      const userInput = 'Test';
      const mockProject = {
        id: '1',
        name: 'Test',
        priority: 'high',
        backtech: 'Node',
        fronttech: 'React',
        cloudTech: 'AWS',
        sprintsQuantity: 2,
        endDate: '2025-12-01',
        tasks: [],
        internalField: 'remove me',
      };

      mockGeminiService.executeStrategy.mockResolvedValue(mockProject);

      const result = await controller.executeStrategy(strategy, userInput);

      expect(result).not.toHaveProperty('internalField');
    });
  });

  describe('getStrategies', () => {
    it('should return available strategies with descriptions', async () => {
      mockGeminiService.getAvailableStrategies.mockReturnValue([
        'create',
        'predict',
        'optimize',
      ]);

      const result = await controller.getStrategies();

      expect(result).toEqual({
        strategies: ['create', 'predict', 'optimize'],
        description: {
          create: 'Create a new project from user idea',
          predict: 'Predict and add new tasks to existing project',
          optimize: 'Optimize project by replacing all tasks',
        },
      });
    });

    it('should call service.getAvailableStrategies', async () => {
      mockGeminiService.getAvailableStrategies.mockReturnValue([]);

      await controller.getStrategies();

      expect(service.getAvailableStrategies).toHaveBeenCalled();
    });

    it('should include all strategy descriptions', async () => {
      mockGeminiService.getAvailableStrategies.mockReturnValue([
        'create',
        'predict',
        'optimize',
      ]);

      const result = await controller.getStrategies();

      expect(result.description).toHaveProperty('create');
      expect(result.description).toHaveProperty('predict');
      expect(result.description).toHaveProperty('optimize');
      expect(result.description.create).toBeTruthy();
      expect(result.description.predict).toBeTruthy();
      expect(result.description.optimize).toBeTruthy();
    });
  });

  describe('sanitizeResponse (private method)', () => {
    it('should sanitize single project keeping only allowed fields', async () => {
      const mockProject = {
        id: '123',
        name: 'Test',
        priority: 'high',
        backtech: 'Node',
        fronttech: 'React',
        cloudTech: 'AWS',
        sprintsQuantity: 2,
        endDate: '2025-12-01',
        tasks: [],
        extraField: 'remove',
        anotherField: 'remove',
      };

      mockGeminiService.createProject.mockResolvedValue(mockProject);

      const result = await controller.generateProject('test');

      const allowedFields = ['id', 'name', 'priority', 'backtech', 'fronttech', 'cloudTech', 'sprintsQuantity', 'endDate', 'tasks'];
      Object.keys(result).forEach(key => {
        expect(allowedFields).toContain(key);
      });
    });

    it('should sanitize array of projects', async () => {
      const mockProjects = [
        {
          id: '1',
          name: 'Project 1',
          priority: 'high',
          backtech: 'Node',
          fronttech: 'React',
          cloudTech: 'AWS',
          sprintsQuantity: 2,
          endDate: '2025-12-01',
          tasks: [],
          internalData: 'hidden',
        },
        {
          id: '2',
          name: 'Project 2',
          priority: 'medium',
          backtech: 'Express',
          fronttech: 'Vue',
          cloudTech: 'GCP',
          sprintsQuantity: 3,
          endDate: '2025-11-30',
          tasks: [],
          internalData: 'hidden',
        },
      ];

      mockGeminiService.createProject.mockResolvedValue(mockProjects);

      const result = await controller.generateProject('test');

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).not.toHaveProperty('internalData');
      expect(result[1]).not.toHaveProperty('internalData');
    });

    it('should sanitize tasks within project', async () => {
      const mockProject = {
        id: '1',
        name: 'Test',
        priority: 'high',
        backtech: 'Node',
        fronttech: 'React',
        cloudTech: 'AWS',
        sprintsQuantity: 2,
        endDate: '2025-12-01',
        tasks: [
          {
            id: 't1',
            name: 'Task',
            description: 'Desc',
            assignedTo: 'Dev',
            sprint: 1,
            extraTaskField: 'remove',
          },
        ],
      };

      mockGeminiService.createProject.mockResolvedValue(mockProject);

      const result = await controller.generateProject('test');

      expect(result.tasks[0]).not.toHaveProperty('extraTaskField');
      expect(result.tasks[0]).toHaveProperty('id');
      expect(result.tasks[0]).toHaveProperty('name');
      expect(result.tasks[0]).toHaveProperty('description');
      expect(result.tasks[0]).toHaveProperty('assignedTo');
      expect(result.tasks[0]).toHaveProperty('sprint');
    });

    it('should handle null values in project fields', async () => {
      const mockProject = {
        id: '1',
        name: 'Test',
        priority: null,
        backtech: null,
        fronttech: null,
        cloudTech: null,
        sprintsQuantity: null,
        endDate: null,
        tasks: null,
      };

      mockGeminiService.createProject.mockResolvedValue(mockProject);

      const result = await controller.generateProject('test');

      expect(result.priority).toBeNull();
      expect(result.tasks).toBeUndefined();
    });

    it('should handle empty tasks array', async () => {
      const mockProject = {
        id: '1',
        name: 'Test',
        priority: 'high',
        backtech: 'Node',
        fronttech: 'React',
        cloudTech: 'AWS',
        sprintsQuantity: 2,
        endDate: '2025-12-01',
        tasks: [],
      };

      mockGeminiService.createProject.mockResolvedValue(mockProject);

      const result = await controller.generateProject('test');

      expect(result.tasks).toEqual([]);
    });
  });

  describe('Error handling', () => {
    it('should propagate service errors', async () => {
      mockGeminiService.createProject.mockRejectedValue(
        new Error('Service error')
      );

      await expect(controller.generateProject('test')).rejects.toThrow(
        'Service error'
      );
    });

    it('should propagate BadRequestException from service', async () => {
      const error = new Error('Project not found');
      error.name = 'BadRequestException';
      
      mockGeminiService.predictProject.mockRejectedValue(error);

      await expect(controller.predictProject('invalid')).rejects.toThrow(
        'Project not found'
      );
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete workflow: create -> predict -> optimize', async () => {
      // Create
      const createResult = {
        id: '1',
        name: 'Project',
        priority: 'high',
        backtech: 'Node',
        fronttech: 'React',
        cloudTech: 'AWS',
        sprintsQuantity: 2,
        endDate: '2025-12-01',
        tasks: [{ id: 't1', name: 'Initial', description: 'Desc', assignedTo: 'Dev', sprint: 1 }],
      };
      mockGeminiService.createProject.mockResolvedValue(createResult);
      
      const created = await controller.generateProject('Create project');
      expect(created.id).toBe('1');
      expect(created.tasks).toHaveLength(1);

      // Predict
      const predictResult = {
        ...createResult,
        tasks: [
          ...createResult.tasks,
          { id: 't2', name: 'Predicted', description: 'New', assignedTo: 'Dev2', sprint: 2 },
        ],
      };
      mockGeminiService.predictProject.mockResolvedValue(predictResult);
      
      const predicted = await controller.predictProject('1');
      expect(predicted.tasks).toHaveLength(2);

      // Optimize
      const optimizeResult = {
        ...createResult,
        tasks: [
          { id: 't3', name: 'Optimized', description: 'Better', assignedTo: 'Dev3', sprint: 1 },
        ],
      };
      mockGeminiService.optimizeProject.mockResolvedValue(optimizeResult);
      
      const optimized = await controller.optimizeProject('1');
      expect(optimized.tasks).toHaveLength(1);
      expect(optimized.tasks[0].name).toBe('Optimized');
    });
  });
});