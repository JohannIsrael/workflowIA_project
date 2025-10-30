import { Test, TestingModule } from '@nestjs/testing';
import { GeminiService } from './gemini.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Projects } from './entities/Projects.entity';
import { GeminiStrategyFactory } from './strategies/strategy.factory';
import { BadRequestException } from '@nestjs/common';

describe('GeminiService', () => {
  let service: GeminiService;
  let mockProjectsRepository: any;
  let mockStrategyFactory: any;
  let mockCreateStrategy: any;
  let mockPredictStrategy: any;
  let mockOptimizeStrategy: any;

  beforeEach(async () => {
    // Mock strategies
    mockCreateStrategy = {
      execute: jest.fn(),
      getPrompt: jest.fn(),
      validate: jest.fn(),
    };

    mockPredictStrategy = {
      execute: jest.fn(),
      getPrompt: jest.fn(),
      validate: jest.fn(),
    };

    mockOptimizeStrategy = {
      execute: jest.fn(),
      getPrompt: jest.fn(),
      validate: jest.fn(),
    };

    // Mock strategy factory
    mockStrategyFactory = {
      getStrategy: jest.fn(),
      getAvailableStrategies: jest.fn().mockReturnValue(['create', 'predict', 'optimize']),
      hasStrategy: jest.fn(),
    };

    // Mock repository
    mockProjectsRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiService,
        {
          provide: getRepositoryToken(Projects),
          useValue: mockProjectsRepository,
        },
        {
          provide: GeminiStrategyFactory,
          useValue: mockStrategyFactory,
        },
      ],
    }).compile();

    service = module.get<GeminiService>(GeminiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createProject', () => {
    it('should create a single project successfully', async () => {
      const userInput = 'Create an e-commerce platform';
      const mockProject = {
        id: 'proj-123',
        name: 'E-commerce Platform',
        tasks: [],
      };

      mockStrategyFactory.getStrategy.mockReturnValue(mockCreateStrategy);
      mockCreateStrategy.execute.mockResolvedValue({
        action: 'create',
        project: mockProject,
      });

      const result = await service.createProject(userInput);

      expect(mockStrategyFactory.getStrategy).toHaveBeenCalledWith('create');
      expect(mockCreateStrategy.execute).toHaveBeenCalledWith({
        userInput,
      });
      expect(result).toEqual(mockProject);
    });

    it('should create multiple projects successfully', async () => {
      const userInput = 'Create 3 microservices';
      const mockProjects = [
        { id: '1', name: 'Service 1', tasks: [] },
        { id: '2', name: 'Service 2', tasks: [] },
        { id: '3', name: 'Service 3', tasks: [] },
      ];

      mockStrategyFactory.getStrategy.mockReturnValue(mockCreateStrategy);
      mockCreateStrategy.execute.mockResolvedValue({
        action: 'create',
        project: mockProjects,
      });

      const result = await service.createProject(userInput);

      expect(result).toEqual(mockProjects);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);
    });

    it('should pass userInput to strategy context', async () => {
      const userInput = 'Build a blog';
      
      mockStrategyFactory.getStrategy.mockReturnValue(mockCreateStrategy);
      mockCreateStrategy.execute.mockResolvedValue({
        action: 'create',
        project: { id: '1', name: 'Blog' },
      });

      await service.createProject(userInput);

      expect(mockCreateStrategy.execute).toHaveBeenCalledWith({
        userInput: 'Build a blog',
      });
    });

    it('should handle strategy execution errors', async () => {
      const userInput = 'Invalid input';
      
      mockStrategyFactory.getStrategy.mockReturnValue(mockCreateStrategy);
      mockCreateStrategy.execute.mockRejectedValue(
        new Error('Strategy failed')
      );

      await expect(service.createProject(userInput)).rejects.toThrow(
        'Strategy failed'
      );
    });
  });

  describe('predictProject', () => {
    it('should predict and add tasks to existing project', async () => {
      const projectId = 'proj-123';
      const existingProject = {
        id: projectId,
        name: 'Test Project',
        tasks: [{ id: 't1', name: 'Task 1' }],
      };

      const updatedProject = {
        ...existingProject,
        tasks: [
          { id: 't1', name: 'Task 1' },
          { id: 't2', name: 'New Task' },
        ],
      };

      mockProjectsRepository.findOne.mockResolvedValue(existingProject);
      mockStrategyFactory.getStrategy.mockReturnValue(mockPredictStrategy);
      mockPredictStrategy.execute.mockResolvedValue({
        action: 'predict',
        project: updatedProject,
      });

      const result = await service.predictProject(projectId);

      expect(mockProjectsRepository.findOne).toHaveBeenCalledWith({
        where: { id: projectId },
        relations: ['tasks'],
      });
      expect(mockStrategyFactory.getStrategy).toHaveBeenCalledWith('predict');
      expect(mockPredictStrategy.execute).toHaveBeenCalledWith({
        existingProject,
      });
      expect(result).toEqual(updatedProject);
    });

    it('should throw BadRequestException if project not found', async () => {
      const projectId = 'non-existent';
      mockProjectsRepository.findOne.mockResolvedValue(null);

      await expect(service.predictProject(projectId)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.predictProject(projectId)).rejects.toThrow(
        `Project with id ${projectId} not found`
      );
    });

    it('should load project with tasks relation', async () => {
      const projectId = 'proj-123';
      const existingProject = {
        id: projectId,
        name: 'Project',
        tasks: [],
      };

      mockProjectsRepository.findOne.mockResolvedValue(existingProject);
      mockStrategyFactory.getStrategy.mockReturnValue(mockPredictStrategy);
      mockPredictStrategy.execute.mockResolvedValue({
        action: 'predict',
        project: existingProject,
      });

      await service.predictProject(projectId);

      expect(mockProjectsRepository.findOne).toHaveBeenCalledWith({
        where: { id: projectId },
        relations: ['tasks'],
      });
    });

    it('should handle strategy execution errors', async () => {
      const projectId = 'proj-123';
      const existingProject = { id: projectId, name: 'Test', tasks: [] };

      mockProjectsRepository.findOne.mockResolvedValue(existingProject);
      mockStrategyFactory.getStrategy.mockReturnValue(mockPredictStrategy);
      mockPredictStrategy.execute.mockRejectedValue(
        new Error('Prediction failed')
      );

      await expect(service.predictProject(projectId)).rejects.toThrow(
        'Prediction failed'
      );
    });
  });

  describe('optimizeProject', () => {
    it('should optimize project by replacing tasks', async () => {
      const projectId = 'proj-123';
      const existingProject = {
        id: projectId,
        name: 'Test Project',
        tasks: [
          { id: 't1', name: 'Old Task 1' },
          { id: 't2', name: 'Old Task 2' },
        ],
      };

      const optimizedProject = {
        ...existingProject,
        tasks: [
          { id: 't3', name: 'Optimized Task 1' },
          { id: 't4', name: 'Optimized Task 2' },
        ],
      };

      mockProjectsRepository.findOne.mockResolvedValue(existingProject);
      mockStrategyFactory.getStrategy.mockReturnValue(mockOptimizeStrategy);
      mockOptimizeStrategy.execute.mockResolvedValue({
        action: 'optimize',
        project: optimizedProject,
      });

      const result = await service.optimizeProject(projectId);

      expect(mockStrategyFactory.getStrategy).toHaveBeenCalledWith('optimize');
      expect(mockOptimizeStrategy.execute).toHaveBeenCalledWith({
        existingProject,
      });
      expect(result).toEqual(optimizedProject);
    });

    it('should throw BadRequestException if project not found', async () => {
      const projectId = 'invalid-id';
      mockProjectsRepository.findOne.mockResolvedValue(null);

      await expect(service.optimizeProject(projectId)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.optimizeProject(projectId)).rejects.toThrow(
        `Project with id ${projectId} not found`
      );
    });

    it('should load project with tasks relation', async () => {
      const projectId = 'proj-123';
      const existingProject = {
        id: projectId,
        name: 'Project',
        tasks: [],
      };

      mockProjectsRepository.findOne.mockResolvedValue(existingProject);
      mockStrategyFactory.getStrategy.mockReturnValue(mockOptimizeStrategy);
      mockOptimizeStrategy.execute.mockResolvedValue({
        action: 'optimize',
        project: existingProject,
      });

      await service.optimizeProject(projectId);

      expect(mockProjectsRepository.findOne).toHaveBeenCalledWith({
        where: { id: projectId },
        relations: ['tasks'],
      });
    });

    it('should handle strategy execution errors', async () => {
      const projectId = 'proj-123';
      const existingProject = { id: projectId, name: 'Test', tasks: [] };

      mockProjectsRepository.findOne.mockResolvedValue(existingProject);
      mockStrategyFactory.getStrategy.mockReturnValue(mockOptimizeStrategy);
      mockOptimizeStrategy.execute.mockRejectedValue(
        new Error('Optimization failed')
      );

      await expect(service.optimizeProject(projectId)).rejects.toThrow(
        'Optimization failed'
      );
    });
  });

  describe('executeStrategy', () => {
    it('should execute create strategy with userInput', async () => {
      const mockProject = { id: '1', name: 'Test', tasks: [] };
      
      mockStrategyFactory.getStrategy.mockReturnValue(mockCreateStrategy);
      mockCreateStrategy.execute.mockResolvedValue({
        action: 'create',
        project: mockProject,
      });

      const result = await service.executeStrategy('create', {
        userInput: 'Create app',
      });

      expect(mockStrategyFactory.getStrategy).toHaveBeenCalledWith('create');
      expect(mockCreateStrategy.execute).toHaveBeenCalledWith({
        userInput: 'Create app',
      });
      expect(result).toEqual(mockProject);
    });

    it('should execute predict strategy with projectId', async () => {
      const projectId = 'proj-123';
      const existingProject = { id: projectId, name: 'Test', tasks: [] };
      const mockProject = { ...existingProject, tasks: [{ id: 't1', name: 'New' }] };

      mockProjectsRepository.findOne.mockResolvedValue(existingProject);
      mockStrategyFactory.getStrategy.mockReturnValue(mockPredictStrategy);
      mockPredictStrategy.execute.mockResolvedValue({
        action: 'predict',
        project: mockProject,
      });

      const result = await service.executeStrategy('predict', { projectId });

      expect(mockProjectsRepository.findOne).toHaveBeenCalledWith({
        where: { id: projectId },
        relations: ['tasks'],
      });
      expect(result).toEqual(mockProject);
    });

    it('should execute optimize strategy with projectId', async () => {
      const projectId = 'proj-456';
      const existingProject = { id: projectId, name: 'Test', tasks: [] };
      const optimizedProject = { ...existingProject, tasks: [{ id: 't1' }] };

      mockProjectsRepository.findOne.mockResolvedValue(existingProject);
      mockStrategyFactory.getStrategy.mockReturnValue(mockOptimizeStrategy);
      mockOptimizeStrategy.execute.mockResolvedValue({
        action: 'optimize',
        project: optimizedProject,
      });

      const result = await service.executeStrategy('optimize', { projectId });

      expect(result).toEqual(optimizedProject);
    });

    it('should throw error when userInput missing for create', async () => {
      await expect(
        service.executeStrategy('create', { projectId: '123' })
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.executeStrategy('create', { projectId: '123' })
      ).rejects.toThrow('userInput is required for create strategy');
    });

    it('should throw error when projectId missing for predict', async () => {
      await expect(
        service.executeStrategy('predict', { userInput: 'test' })
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.executeStrategy('predict', { userInput: 'test' })
      ).rejects.toThrow('projectId is required for predict strategy');
    });

    it('should throw error when projectId missing for optimize', async () => {
      await expect(
        service.executeStrategy('optimize', { userInput: 'test' })
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.executeStrategy('optimize', { userInput: 'test' })
      ).rejects.toThrow('projectId is required for optimize strategy');
    });

    it('should handle both userInput and projectId provided for create', async () => {
      const mockProject = { id: '1', name: 'Test', tasks: [] };
      
      mockStrategyFactory.getStrategy.mockReturnValue(mockCreateStrategy);
      mockCreateStrategy.execute.mockResolvedValue({
        action: 'create',
        project: mockProject,
      });

      const result = await service.executeStrategy('create', {
        userInput: 'Test',
        projectId: 'ignored',
      });

      // Should use only userInput for create
      expect(mockCreateStrategy.execute).toHaveBeenCalledWith({
        userInput: 'Test',
      });
      expect(result).toBeDefined();
    });

    it('should throw error if project not found for predict/optimize', async () => {
      mockProjectsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.executeStrategy('predict', { projectId: 'invalid' })
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.executeStrategy('optimize', { projectId: 'invalid' })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAvailableStrategies', () => {
    it('should return list of available strategies', () => {
      const strategies = service.getAvailableStrategies();

      expect(strategies).toEqual(['create', 'predict', 'optimize']);
      expect(mockStrategyFactory.getAvailableStrategies).toHaveBeenCalled();
    });

    it('should delegate to strategy factory', () => {
      mockStrategyFactory.getAvailableStrategies.mockReturnValue([
        'create',
        'predict',
        'optimize',
        'new-strategy',
      ]);

      const strategies = service.getAvailableStrategies();

      expect(strategies).toHaveLength(4);
      expect(strategies).toContain('new-strategy');
    });
  });

  describe('loadProject (private method)', () => {
    it('should load project with tasks', async () => {
      const projectId = 'proj-123';
      const mockProject = {
        id: projectId,
        name: 'Project',
        tasks: [{ id: 't1', name: 'Task' }],
      };

      mockProjectsRepository.findOne.mockResolvedValue(mockProject);

      // Access through predictProject which calls loadProject
      mockStrategyFactory.getStrategy.mockReturnValue(mockPredictStrategy);
      mockPredictStrategy.execute.mockResolvedValue({
        action: 'predict',
        project: mockProject,
      });

      await service.predictProject(projectId);

      expect(mockProjectsRepository.findOne).toHaveBeenCalledWith({
        where: { id: projectId },
        relations: ['tasks'],
      });
    });

    it('should throw error if project not found', async () => {
      const projectId = 'non-existent';
      mockProjectsRepository.findOne.mockResolvedValue(null);

      await expect(service.predictProject(projectId)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.predictProject(projectId)).rejects.toThrow(
        'Project with id non-existent not found'
      );
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete create workflow', async () => {
      const userInput = 'Create a complete e-commerce platform';
      const mockProject = {
        id: 'ecom-1',
        name: 'E-commerce Platform',
        priority: 'high',
        backtech: 'NestJS',
        fronttech: 'React',
        tasks: [
          { id: 't1', name: 'User Auth' },
          { id: 't2', name: 'Product Catalog' },
          { id: 't3', name: 'Shopping Cart' },
        ],
      };

      mockStrategyFactory.getStrategy.mockReturnValue(mockCreateStrategy);
      mockCreateStrategy.execute.mockResolvedValue({
        action: 'create',
        project: mockProject,
      });

      const result = await service.createProject(userInput);

      expect(result.name).toBe('E-commerce Platform');
      expect(result.tasks).toHaveLength(3);
    });

    it('should handle complete predict workflow', async () => {
      const projectId = 'proj-123';
      const existingProject = {
        id: projectId,
        name: 'E-commerce',
        tasks: [{ id: 't1', name: 'Setup' }],
      };

      const updatedProject = {
        ...existingProject,
        tasks: [
          { id: 't1', name: 'Setup' },
          { id: 't2', name: 'Payment Integration' },
          { id: 't3', name: 'Email Notifications' },
        ],
      };

      mockProjectsRepository.findOne.mockResolvedValue(existingProject);
      mockStrategyFactory.getStrategy.mockReturnValue(mockPredictStrategy);
      mockPredictStrategy.execute.mockResolvedValue({
        action: 'predict',
        project: updatedProject,
      });

      const result = await service.predictProject(projectId);

      expect(result.tasks).toHaveLength(3);
      expect(result.tasks[0].name).toBe('Setup');
      expect(result.tasks[1].name).toBe('Payment Integration');
    });

    it('should handle complete optimize workflow', async () => {
      const projectId = 'proj-123';
      const existingProject = {
        id: projectId,
        name: 'Legacy App',
        tasks: [
          { id: 't1', name: 'Old Task 1' },
          { id: 't2', name: 'Old Task 2' },
          { id: 't3', name: 'Old Task 3' },
        ],
      };

      const optimizedProject = {
        ...existingProject,
        tasks: [
          { id: 't4', name: 'Optimized Task 1' },
          { id: 't5', name: 'Optimized Task 2' },
        ],
      };

      mockProjectsRepository.findOne.mockResolvedValue(existingProject);
      mockStrategyFactory.getStrategy.mockReturnValue(mockOptimizeStrategy);
      mockOptimizeStrategy.execute.mockResolvedValue({
        action: 'optimize',
        project: optimizedProject,
      });

      const result = await service.optimizeProject(projectId);

      expect(result.tasks).toHaveLength(2);
      expect(result.tasks[0].name).toBe('Optimized Task 1');
    });

    it('should handle multiple strategy calls in sequence', async () => {
      // Create
      const createMockProject = { id: '1', name: 'New', tasks: [] };
      mockStrategyFactory.getStrategy.mockReturnValueOnce(mockCreateStrategy);
      mockCreateStrategy.execute.mockResolvedValueOnce({
        action: 'create',
        project: createMockProject,
      });

      const created = await service.createProject('Create project');
      expect(created.id).toBe('1');

      // Predict
      const existingProject = { id: '1', name: 'New', tasks: [] };
      const predictedProject = { ...existingProject, tasks: [{ id: 't1' }] };
      
      mockProjectsRepository.findOne.mockResolvedValueOnce(existingProject);
      mockStrategyFactory.getStrategy.mockReturnValueOnce(mockPredictStrategy);
      mockPredictStrategy.execute.mockResolvedValueOnce({
        action: 'predict',
        project: predictedProject,
      });

      const predicted = await service.predictProject('1');
      expect(predicted.tasks).toHaveLength(1);

      // Optimize
      mockProjectsRepository.findOne.mockResolvedValueOnce(predictedProject);
      mockStrategyFactory.getStrategy.mockReturnValueOnce(mockOptimizeStrategy);
      mockOptimizeStrategy.execute.mockResolvedValueOnce({
        action: 'optimize',
        project: { ...predictedProject, tasks: [{ id: 't2' }] },
      });

      const optimized = await service.optimizeProject('1');
      expect(optimized.tasks).toHaveLength(1);
      expect(optimized.tasks[0].id).toBe('t2');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty userInput gracefully', async () => {
      mockStrategyFactory.getStrategy.mockReturnValue(mockCreateStrategy);
      mockCreateStrategy.execute.mockResolvedValue({
        action: 'create',
        project: { id: '1', name: 'Default', tasks: [] },
      });

      const result = await service.createProject('');

      expect(result).toBeDefined();
    });

    it('should handle very long userInput', async () => {
      const longInput = 'A'.repeat(10000);
      
      mockStrategyFactory.getStrategy.mockReturnValue(mockCreateStrategy);
      mockCreateStrategy.execute.mockResolvedValue({
        action: 'create',
        project: { id: '1', name: 'Test', tasks: [] },
      });

      const result = await service.createProject(longInput);

      expect(mockCreateStrategy.execute).toHaveBeenCalledWith({
        userInput: longInput,
      });
    });

    it('should handle project with no tasks', async () => {
      const projectId = 'proj-empty';
      const emptyProject = {
        id: projectId,
        name: 'Empty Project',
        tasks: [],
      };

      mockProjectsRepository.findOne.mockResolvedValue(emptyProject);
      mockStrategyFactory.getStrategy.mockReturnValue(mockPredictStrategy);
      mockPredictStrategy.execute.mockResolvedValue({
        action: 'predict',
        project: emptyProject,
      });

      const result = await service.predictProject(projectId);

      expect(result.tasks).toEqual([]);
    });
  });
});