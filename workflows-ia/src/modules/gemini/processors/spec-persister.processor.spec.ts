import { Test, TestingModule } from '@nestjs/testing';
import { SpecPersisterProcessor } from './spec-persister.processor';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Projects } from '../entities/Projects.entity';
import { Tasks } from '../entities/Tasks.entity';
import { DataSource } from 'typeorm';

describe('SpecPersisterProcessor', () => {
  let processor: SpecPersisterProcessor;
  let mockProjectsRepository: any;
  let mockTasksRepository: any;
  let mockDataSource: any;
  let mockEntityManager: any;

  beforeEach(async () => {
    // Mock del EntityManager
    mockEntityManager = {
      getRepository: jest.fn(),
      save: jest.fn(),
    };

    // Mock del DataSource con transaction
    mockDataSource = {
      transaction: jest.fn((callback) => callback(mockEntityManager)),
    };

    // Mock de los repositories
    mockProjectsRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    mockTasksRepository = {
      save: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpecPersisterProcessor,
        {
          provide: getRepositoryToken(Projects),
          useValue: mockProjectsRepository,
        },
        {
          provide: getRepositoryToken(Tasks),
          useValue: mockTasksRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    processor = module.get<SpecPersisterProcessor>(SpecPersisterProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('handle - Single project persistence', () => {
    it('should persist single project with tasks', async () => {
      const input = {
        isSingle: true,
        projects: [
          {
            name: 'Test Project',
            priority: 'high',
            backtech: 'NestJS',
            fronttech: 'React',
            cloudTech: 'AWS',
            sprintsQuantity: 5,
            endDate: '2025-12-31',
            tasks: [
              {
                name: 'Task 1',
                description: 'Description 1',
                assignedTo: 'John',
                sprint: 1,
              },
              {
                name: 'Task 2',
                description: 'Description 2',
                assignedTo: 'Jane',
                sprint: 2,
              },
            ],
          },
        ],
      };

      const savedProject = {
        id: 'proj-123',
        ...input.projects[0],
        tasks: input.projects[0].tasks.map((t, i) => ({
          id: `task-${i}`,
          ...t,
        })),
      };

      mockEntityManager.getRepository.mockReturnValue({
        save: jest.fn().mockResolvedValue(savedProject),
      });

      const result = await processor['handle'](input);

      expect(result.isSingle).toBe(true);
      expect(result.projects).toHaveLength(1);
      expect(result.projects[0].id).toBe('proj-123');
      expect(result.projects[0].name).toBe('Test Project');
      expect(result.projects[0].tasks).toHaveLength(2);
      expect(mockDataSource.transaction).toHaveBeenCalled();
    });

    it('should persist project without tasks', async () => {
      const input = {
        isSingle: true,
        projects: [
          {
            name: 'Empty Project',
            priority: 'low',
            tasks: [],
          },
        ],
      };

      const savedProject = {
        id: 'proj-456',
        name: 'Empty Project',
        priority: 'low',
        tasks: [],
      };

      mockEntityManager.getRepository.mockReturnValue({
        save: jest.fn().mockResolvedValue(savedProject),
      });

      const result = await processor['handle'](input);

      expect(result.isSingle).toBe(true);
      expect(result.projects[0].tasks).toEqual([]);
    });

    it('should handle null optional fields', async () => {
      const input = {
        isSingle: true,
        projects: [
          {
            name: 'Project',
            priority: null,
            backtech: null,
            fronttech: null,
            cloudTech: null,
            sprintsQuantity: null,
            endDate: null,
            tasks: [],
          },
        ],
      };

      const savedProject = {
        id: 'proj-789',
        ...input.projects[0],
      };

      mockEntityManager.getRepository.mockReturnValue({
        save: jest.fn().mockResolvedValue(savedProject),
      });

      const result = await processor['handle'](input);

      expect(result.projects[0].priority).toBeNull();
      expect(result.projects[0].sprintsQuantity).toBeNull();
      expect(result.projects[0].endDate).toBeNull();
    });
  });

  describe('handle - Multiple projects persistence', () => {
    it('should persist multiple projects', async () => {
      const input = {
        isSingle: false,
        projects: [
          {
            name: 'Project 1',
            priority: 'high',
            tasks: [{ name: 'Task 1', description: 'Desc 1' }],
          },
          {
            name: 'Project 2',
            priority: 'medium',
            tasks: [{ name: 'Task 2', description: 'Desc 2' }],
          },
        ],
      };

      let callCount = 0;
      mockEntityManager.getRepository.mockReturnValue({
        save: jest.fn().mockImplementation((project) => {
          callCount++;
          return Promise.resolve({
            id: `proj-${callCount}`,
            ...project,
          });
        }),
      });

      const result = await processor['handle'](input);

      expect(result.isSingle).toBe(false);
      expect(result.projects).toHaveLength(2);
      expect(result.projects[0].name).toBe('Project 1');
      expect(result.projects[1].name).toBe('Project 2');
      expect(mockDataSource.transaction).toHaveBeenCalled();
    });

    it('should persist all projects in same transaction', async () => {
      const input = {
        isSingle: false,
        projects: [
          { name: 'P1', tasks: [] },
          { name: 'P2', tasks: [] },
          { name: 'P3', tasks: [] },
        ],
      };

      mockEntityManager.getRepository.mockReturnValue({
        save: jest.fn().mockImplementation((p) =>
          Promise.resolve({ id: 'test-id', ...p })
        ),
      });

      await processor['handle'](input);

      expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('handle - Task persistence', () => {
    it('should create task entities with correct properties', async () => {
      const input = {
        isSingle: true,
        projects: [
          {
            name: 'Project',
            tasks: [
              {
                name: 'Task 1',
                description: 'Description 1',
                assignedTo: 'Developer',
                sprint: 3,
              },
            ],
          },
        ],
      };

      let savedTasks: any[] = [];
      mockEntityManager.getRepository.mockReturnValue({
        save: jest.fn().mockImplementation((project) => {
          savedTasks = project.tasks;
          return Promise.resolve({
            id: 'proj-id',
            ...project,
            tasks: project.tasks.map((t: any, i: number) => ({
              id: `task-${i}`,
              ...t,
            })),
          });
        }),
      });

      const result = await processor['handle'](input);

      expect(savedTasks).toHaveLength(1);
      expect(savedTasks[0].name).toBe('Task 1');
      expect(savedTasks[0].description).toBe('Description 1');
      expect(savedTasks[0].assignedTo).toBe('Developer');
      expect(savedTasks[0].sprint).toBe(3);
      expect(result.projects[0].tasks[0].id).toBe(undefined);
    });

    it('should handle tasks with null assignedTo', async () => {
      const input = {
        isSingle: true,
        projects: [
          {
            name: 'Project',
            tasks: [
              {
                name: 'Unassigned Task',
                description: 'No assignee',
                assignedTo: null,
                sprint: 1,
              },
            ],
          },
        ],
      };

      mockEntityManager.getRepository.mockReturnValue({
        save: jest.fn().mockImplementation((p) =>
          Promise.resolve({ id: 'id', ...p })
        ),
      });

      const result = await processor['handle'](input);

      expect(result.projects[0].tasks[0].assignedTo).toBeNull();
    });

    it('should handle tasks with null sprint', async () => {
      const input = {
        isSingle: true,
        projects: [
          {
            name: 'Project',
            tasks: [
              {
                name: 'Task',
                description: 'Desc',
                sprint: null,
              },
            ],
          },
        ],
      };

      mockEntityManager.getRepository.mockReturnValue({
        save: jest.fn().mockImplementation((p) =>
          Promise.resolve({ id: 'id', ...p })
        ),
      });

      const result = await processor['handle'](input);

      expect(result.projects[0].tasks[0].sprint).toBeNull();
    });
  });

  describe('handle - Data type conversions', () => {
    it('should convert sprintsQuantity string to number', async () => {
      const input = {
        isSingle: true,
        projects: [
          {
            name: 'Project',
            sprintsQuantity: '5' as any,
            tasks: [],
          },
        ],
      };

      mockEntityManager.getRepository.mockReturnValue({
        save: jest.fn().mockImplementation((p) =>
          Promise.resolve({ id: 'id', ...p })
        ),
      });

      const result = await processor['handle'](input);

      expect(result.projects[0].sprintsQuantity).toBe(5);
      expect(typeof result.projects[0].sprintsQuantity).toBe('number');
    });

    it('should convert sprint string to number', async () => {
      const input = {
        isSingle: true,
        projects: [
          {
            name: 'Project',
            tasks: [
              { name: 'Task', sprint: '3' as any },
            ],
          },
        ],
      };

      mockEntityManager.getRepository.mockReturnValue({
        save: jest.fn().mockImplementation((p) =>
          Promise.resolve({ id: 'id', ...p })
        ),
      });

      const result = await processor['handle'](input);

      expect(result.projects[0].tasks[0].sprint).toBe(3);
    });

    it('should handle empty string as null for numeric fields', async () => {
      const input = {
        isSingle: true,
        projects: [
          {
            name: 'Project',
            sprintsQuantity: '' as any,
            tasks: [{ name: 'Task', sprint: '' as any }],
          },
        ],
      };

      mockEntityManager.getRepository.mockReturnValue({
        save: jest.fn().mockImplementation((p) =>
          Promise.resolve({ id: 'id', ...p })
        ),
      });

      const result = await processor['handle'](input);

      expect(result.projects[0].sprintsQuantity).toBeNull();
      expect(result.projects[0].tasks[0].sprint).toBeNull();
    });

    it('should handle invalid numbers as null', async () => {
      const input = {
        isSingle: true,
        projects: [
          {
            name: 'Project',
            sprintsQuantity: 'invalid' as any,
            tasks: [{ name: 'Task', sprint: NaN as any }],
          },
        ],
      };

      mockEntityManager.getRepository.mockReturnValue({
        save: jest.fn().mockImplementation((p) =>
          Promise.resolve({ id: 'id', ...p })
        ),
      });

      const result = await processor['handle'](input);

      expect(result.projects[0].sprintsQuantity).toBeNull();
      expect(result.projects[0].tasks[0].sprint).toBeNull();
    });
  });

  describe('handle - Edge cases', () => {
    it('should handle project with many tasks', async () => {
      const tasks = Array.from({ length: 50 }, (_, i) => ({
        name: `Task ${i + 1}`,
        description: `Description ${i + 1}`,
        sprint: (i % 5) + 1,
      }));

      const input = {
        isSingle: true,
        projects: [
          {
            name: 'Large Project',
            tasks,
          },
        ],
      };

      mockEntityManager.getRepository.mockReturnValue({
        save: jest.fn().mockImplementation((p) =>
          Promise.resolve({ id: 'id', ...p })
        ),
      });

      const result = await processor['handle'](input);

      expect(result.projects[0].tasks).toHaveLength(50);
    });

    it('should handle undefined values correctly', async () => {
      const input = {
        isSingle: true,
        projects: [
          {
            name: 'Project',
            tasks: [
              {
                name: 'Task',
                description: undefined as any,
                assignedTo: undefined as any,
                sprint: undefined as any,
              },
            ],
          },
        ],
      };

      mockEntityManager.getRepository.mockReturnValue({
        save: jest.fn().mockImplementation((p) =>
          Promise.resolve({ id: 'id', ...p })
        ),
      });

      const result = await processor['handle'](input);

      expect(result.projects[0].tasks[0].description).toBeUndefined();
      expect(result.projects[0].tasks[0].sprint).toBeNull();
    });

    it('should preserve task order', async () => {
      const input = {
        isSingle: true,
        projects: [
          {
            name: 'Project',
            tasks: [
              { name: 'First', description: '1' },
              { name: 'Second', description: '2' },
              { name: 'Third', description: '3' },
            ],
          },
        ],
      };

      mockEntityManager.getRepository.mockReturnValue({
        save: jest.fn().mockImplementation((p) =>
          Promise.resolve({
            id: 'id',
            ...p,
            tasks: p.tasks.map((t: any, i: number) => ({ id: `t${i}`, ...t })),
          })
        ),
      });

      const result = await processor['handle'](input);

      expect(result.projects[0].tasks[0].name).toBe('First');
      expect(result.projects[0].tasks[1].name).toBe('Second');
      expect(result.projects[0].tasks[2].name).toBe('Third');
    });
  });

  describe('handle - Transaction handling', () => {
    it('should rollback on error', async () => {
      const input = {
        isSingle: true,
        projects: [{ name: 'Project', tasks: [] }],
      };

      mockDataSource.transaction.mockImplementation((callback) => {
        return callback(mockEntityManager).catch((error: Error) => {
          throw error;
        });
      });

      mockEntityManager.getRepository.mockReturnValue({
        save: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await expect(processor['handle'](input)).rejects.toThrow('Database error');
    });

    it('should use transaction for all operations', async () => {
      const input = {
        isSingle: false,
        projects: [
          { name: 'P1', tasks: [] },
          { name: 'P2', tasks: [] },
        ],
      };

      mockEntityManager.getRepository.mockReturnValue({
        save: jest.fn().mockImplementation((p) =>
          Promise.resolve({ id: 'id', ...p })
        ),
      });

      await processor['handle'](input);

      expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
      expect(mockEntityManager.getRepository).toHaveBeenCalled();
    });
  });

  describe('process - Chain of Responsibility', () => {
    it('should process and return persisted result when no next processor', async () => {
      const input = {
        isSingle: true,
        projects: [
          {
            name: 'Test',
            tasks: [{ name: 'Task' }],
          },
        ],
      };

      mockEntityManager.getRepository.mockReturnValue({
        save: jest.fn().mockImplementation((p) =>
          Promise.resolve({ id: 'id', ...p })
        ),
      });

      const result = await processor.process(input);

      expect(result.isSingle).toBe(true);
      expect(result.projects).toBeDefined();
    });

    it('should pass persisted result to next processor if set', async () => {
      const mockNextProcessor = {
        process: jest.fn().mockResolvedValue({ final: true }),
        setNext: jest.fn(),
      };

      processor.setNext(mockNextProcessor);

      const input = {
        isSingle: true,
        projects: [{ name: 'Test', tasks: [] }],
      };

      mockEntityManager.getRepository.mockReturnValue({
        save: jest.fn().mockImplementation((p) =>
          Promise.resolve({ id: 'id', ...p })
        ),
      });

      const result = await processor.process(input);

      expect(mockNextProcessor.process).toHaveBeenCalled();
      expect(result).toEqual({ final: true });
    });
  });
});