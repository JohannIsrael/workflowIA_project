import { Test, TestingModule } from '@nestjs/testing';
import { OptimizeProjectStrategy } from './optimize-project.strategy';
import { GoogleGenAI } from '@google/genai';
import { JsonCleanerProcessor } from '../processors/json-cleaner.processor';
import { JsonParserProcessor } from '../processors/json-parser.processor';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Projects } from '../entities/Projects.entity';
import { Tasks } from '../entities/Tasks.entity';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { WORKFLOW_OPTIMIZE_PROMPT } from '../entities/prompts/Optimize';

describe('OptimizeProjectStrategy', () => {
  let strategy: OptimizeProjectStrategy;
  let mockGenAI: any;
  let mockJsonCleaner: any;
  let mockJsonParser: any;
  let mockProjectsRepository: any;
  let mockTasksRepository: any;
  let mockDataSource: any;
  let mockEntityManager: any;

  beforeEach(async () => {
    // Mock EntityManager
    mockEntityManager = {
      getRepository: jest.fn(),
      remove: jest.fn(),
      save: jest.fn(),
    };

    // Mock DataSource with transaction
    mockDataSource = {
      transaction: jest.fn((callback) => callback(mockEntityManager)),
    };

    // Mock GoogleGenAI
    mockGenAI = {
      models: {
        generateContent: jest.fn(),
      },
    };

    // Mock processors
    mockJsonCleaner = {
      handle: jest.fn(),
    };

    mockJsonParser = {
      handle: jest.fn(),
    };

    // Mock repositories
    mockProjectsRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
    };

    mockTasksRepository = {
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OptimizeProjectStrategy,
        {
          provide: GoogleGenAI,
          useValue: mockGenAI,
        },
        {
          provide: JsonCleanerProcessor,
          useValue: mockJsonCleaner,
        },
        {
          provide: JsonParserProcessor,
          useValue: mockJsonParser,
        },
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

    strategy = module.get<OptimizeProjectStrategy>(OptimizeProjectStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('getPrompt', () => {
    it('should return the optimize workflow prompt', () => {
      const prompt = strategy.getPrompt();
      
      expect(prompt).toBe(WORKFLOW_OPTIMIZE_PROMPT);
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });
  });

  describe('validate', () => {
    it('should validate successfully with existingProject', () => {
      const context = {
        existingProject: { id: '1', name: 'Test', tasks: [] } as any,
      };
      
      expect(() => strategy.validate(context)).not.toThrow();
    });

    it('should throw error if context is missing', () => {
      expect(() => strategy.validate(null as any)).toThrow();
      expect(() => strategy.validate(undefined as any)).toThrow();
    });

    it('should throw BadRequestException if existingProject is missing', () => {
      const context = {};
      
      expect(() => strategy.validate(context)).toThrow(BadRequestException);
      expect(() => strategy.validate(context)).toThrow('existingProject is required');
    });

    it('should throw BadRequestException if existingProject is null', () => {
      const context = { existingProject: null };
      
      expect(() => strategy.validate(context)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException if existingProject is undefined', () => {
      const context = { existingProject: undefined };
      
      expect(() => strategy.validate(context)).toThrow(BadRequestException);
    });
  });

  describe('execute - Replace all tasks', () => {
    it('should replace all tasks with optimized ones', async () => {
      const existingProject = {
        id: 'proj-123',
        name: 'E-commerce',
        tasks: [
          { id: 't1', name: 'Old Task 1' },
          { id: 't2', name: 'Old Task 2' },
          { id: 't3', name: 'Old Task 3' },
        ],
      } as any;

      const context = { existingProject };

      const mockGeminiResponse = {
        text: '{"tasks": [{"name": "Optimized Task 1"}, {"name": "Optimized Task 2"}]}',
      };

      const parsedResponse = {
        tasks: [
          { name: 'Optimized Task 1', description: 'Better task 1' },
          { name: 'Optimized Task 2', description: 'Better task 2' },
        ],
      };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.handle.mockReturnValue(mockGeminiResponse.text);
      mockJsonParser.handle.mockReturnValue(parsedResponse);

      const mockTaskRepo = {
        remove: jest.fn().mockResolvedValue(undefined),
      };

      const mockProjectRepo = {
        save: jest.fn().mockImplementation((project) => {
          const saved = {
            ...project,
            tasks: project.tasks.map((t: any, i: number) => ({
              ...t,
              id: `new-t${i + 1}`,
            })),
          };
          (saved as any).__metadata = {
            tasksRemoved: 3,
            tasksAdded: 2,
            fieldsUpdated: [],
          };
          return Promise.resolve(saved);
        }),
      };

      mockEntityManager.getRepository.mockImplementation((entity) => {
        if (entity === Tasks) return mockTaskRepo;
        if (entity === Projects) return mockProjectRepo;
        return null;
      });

      const result = await strategy.execute(context);

      expect(result.action).toBe('optimize');
      expect(result.project.tasks.length).toBe(2);
      expect(result.metadata.tasksRemoved).toBe(3);
      expect(result.metadata.tasksAdded).toBe(2);
      expect(mockTaskRepo.remove).toHaveBeenCalled();
      expect(mockDataSource.transaction).toHaveBeenCalled();
    });

    it('should handle project with no existing tasks', async () => {
      const existingProject = {
        id: 'proj-1',
        name: 'Empty Project',
        tasks: [],
      } as any;

      const context = { existingProject };

      const mockGeminiResponse = {
        text: '{"tasks": [{"name": "New Task"}]}',
      };
      const parsedResponse = {
        tasks: [{ name: 'New Task' }],
      };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.handle.mockReturnValue(mockGeminiResponse.text);
      mockJsonParser.handle.mockReturnValue(parsedResponse);

      const mockTaskRepo = { remove: jest.fn() };
      const mockProjectRepo = {
        save: jest.fn().mockImplementation((p) => {
          const saved = { ...p };
          (saved as any).__metadata = {
            tasksRemoved: 0,
            tasksAdded: 1,
            fieldsUpdated: [],
          };
          return Promise.resolve(saved);
        }),
      };

      mockEntityManager.getRepository.mockImplementation((entity) => {
        if (entity === Tasks) return mockTaskRepo;
        if (entity === Projects) return mockProjectRepo;
        return null;
      });

      const result = await strategy.execute(context);

      expect(result.metadata.tasksRemoved).toBe(0);
      expect(result.metadata.tasksAdded).toBe(1);
      expect(mockTaskRepo.remove).not.toHaveBeenCalled();
    });

    it('should handle optimization resulting in empty tasks', async () => {
      const existingProject = {
        id: 'proj-1',
        name: 'Project',
        tasks: [
          { id: 't1', name: 'Task 1' },
          { id: 't2', name: 'Task 2' },
        ],
      } as any;

      const context = { existingProject };

      const mockGeminiResponse = { text: '{"tasks": []}' };
      const parsedResponse = { tasks: [] };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.handle.mockReturnValue(mockGeminiResponse.text);
      mockJsonParser.handle.mockReturnValue(parsedResponse);

      const mockTaskRepo = {
        remove: jest.fn().mockResolvedValue(undefined),
      };
      const mockProjectRepo = {
        save: jest.fn().mockImplementation((p) => {
          const saved = { ...p, tasks: [] };
          (saved as any).__metadata = {
            tasksRemoved: 2,
            tasksAdded: 0,
            fieldsUpdated: [],
          };
          return Promise.resolve(saved);
        }),
      };

      mockEntityManager.getRepository.mockImplementation((entity) => {
        if (entity === Tasks) return mockTaskRepo;
        if (entity === Projects) return mockProjectRepo;
        return null;
      });

      const result = await strategy.execute(context);

      expect(result.metadata.tasksRemoved).toBe(2);
      expect(result.metadata.tasksAdded).toBe(0);
      expect(result.project.tasks).toEqual([]);
    });
  });

  describe('execute - Update project fields', () => {
    it('should update sprintsQuantity if provided', async () => {
      const existingProject = {
        id: 'proj-1',
        name: 'Project',
        sprintsQuantity: 3,
        tasks: [],
      } as any;

      const context = { existingProject };

      const mockGeminiResponse = {
        text: '{"sprintsQuantity": 5, "tasks": []}',
      };
      const parsedResponse = { sprintsQuantity: 5, tasks: [] };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.handle.mockReturnValue(mockGeminiResponse.text);
      mockJsonParser.handle.mockReturnValue(parsedResponse);

      const mockProjectRepo = {
        save: jest.fn().mockImplementation((p) => {
          const saved = { ...p };
          (saved as any).__metadata = {
            tasksRemoved: 0,
            tasksAdded: 0,
            fieldsUpdated: ['sprintsQuantity'],
          };
          return Promise.resolve(saved);
        }),
      };

      mockEntityManager.getRepository.mockReturnValue(mockProjectRepo);

      const result = await strategy.execute(context);

      expect(result.project.sprintsQuantity).toBe(5);
      expect(result.metadata.fieldsUpdated).toContain('sprintsQuantity');
    });

    it('should update endDate if provided', async () => {
      const existingProject = {
        id: 'proj-1',
        name: 'Project',
        endDate: '2025-10-31',
        tasks: [],
      } as any;

      const context = { existingProject };

      const mockGeminiResponse = {
        text: '{"endDate": "2025-12-31", "tasks": []}',
      };
      const parsedResponse = { endDate: '2025-12-31', tasks: [] };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.handle.mockReturnValue(mockGeminiResponse.text);
      mockJsonParser.handle.mockReturnValue(parsedResponse);

      const mockProjectRepo = {
        save: jest.fn().mockImplementation((p) => {
          const saved = { ...p };
          (saved as any).__metadata = {
            tasksRemoved: 0,
            tasksAdded: 0,
            fieldsUpdated: ['endDate'],
          };
          return Promise.resolve(saved);
        }),
      };

      mockEntityManager.getRepository.mockReturnValue(mockProjectRepo);

      const result = await strategy.execute(context);

      expect(result.project.endDate).toBe('2025-12-31');
      expect(result.metadata.fieldsUpdated).toContain('endDate');
    });

    it('should update multiple fields and tasks simultaneously', async () => {
      const existingProject = {
        id: 'proj-1',
        name: 'Project',
        sprintsQuantity: 3,
        endDate: '2025-10-31',
        tasks: [{ id: 't1', name: 'Old' }],
      } as any;

      const context = { existingProject };

      const mockGeminiResponse = {
        text: '{"sprintsQuantity": 6, "endDate": "2026-01-31", "tasks": [{"name": "New"}]}',
      };
      const parsedResponse = {
        sprintsQuantity: 6,
        endDate: '2026-01-31',
        tasks: [{ name: 'New' }],
      };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.handle.mockReturnValue(mockGeminiResponse.text);
      mockJsonParser.handle.mockReturnValue(parsedResponse);

      const mockTaskRepo = {
        remove: jest.fn().mockResolvedValue(undefined),
      };
      const mockProjectRepo = {
        save: jest.fn().mockImplementation((p) => {
          const saved = { ...p };
          (saved as any).__metadata = {
            tasksRemoved: 1,
            tasksAdded: 1,
            fieldsUpdated: ['sprintsQuantity', 'endDate'],
          };
          return Promise.resolve(saved);
        }),
      };

      mockEntityManager.getRepository.mockImplementation((entity) => {
        if (entity === Tasks) return mockTaskRepo;
        if (entity === Projects) return mockProjectRepo;
        return null;
      });

      const result = await strategy.execute(context);

      expect(result.project.sprintsQuantity).toBe(6);
      expect(result.project.endDate).toBe('2026-01-31');
      expect(result.metadata.fieldsUpdated).toEqual(['sprintsQuantity', 'endDate']);
      expect(result.metadata.tasksRemoved).toBe(1);
      expect(result.metadata.tasksAdded).toBe(1);
    });

    it('should not update fields if values are the same', async () => {
      const existingProject = {
        id: 'proj-1',
        name: 'Project',
        sprintsQuantity: 5,
        endDate: '2025-12-31',
        tasks: [],
      } as any;

      const context = { existingProject };

      const mockGeminiResponse = {
        text: '{"sprintsQuantity": 5, "endDate": "2025-12-31", "tasks": []}',
      };
      const parsedResponse = {
        sprintsQuantity: 5,
        endDate: '2025-12-31',
        tasks: [],
      };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.handle.mockReturnValue(mockGeminiResponse.text);
      mockJsonParser.handle.mockReturnValue(parsedResponse);

      const mockProjectRepo = {
        save: jest.fn().mockImplementation((p) => {
          const saved = { ...p };
          (saved as any).__metadata = {
            tasksRemoved: 0,
            tasksAdded: 0,
            fieldsUpdated: [],
          };
          return Promise.resolve(saved);
        }),
      };

      mockEntityManager.getRepository.mockReturnValue(mockProjectRepo);

      const result = await strategy.execute(context);

      expect(result.metadata.fieldsUpdated).toEqual([]);
    });
  });

  describe('execute - Transaction handling', () => {
    it('should execute all operations in a transaction', async () => {
      const existingProject = {
        id: 'proj-1',
        name: 'Project',
        tasks: [{ id: 't1', name: 'Old' }],
      } as any;

      const context = { existingProject };

      const mockGeminiResponse = { text: '{"tasks": [{"name": "New"}]}' };
      const parsedResponse = { tasks: [{ name: 'New' }] };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.handle.mockReturnValue(mockGeminiResponse.text);
      mockJsonParser.handle.mockReturnValue(parsedResponse);

      const mockTaskRepo = {
        remove: jest.fn().mockResolvedValue(undefined),
      };
      const mockProjectRepo = {
        save: jest.fn().mockImplementation((p) => {
          const saved = { ...p };
          (saved as any).__metadata = { tasksRemoved: 1, tasksAdded: 1, fieldsUpdated: [] };
          return Promise.resolve(saved);
        }),
      };

      mockEntityManager.getRepository.mockImplementation((entity) => {
        if (entity === Tasks) return mockTaskRepo;
        if (entity === Projects) return mockProjectRepo;
        return null;
      });

      await strategy.execute(context);

      expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
      expect(mockEntityManager.getRepository).toHaveBeenCalled();
    });

    it('should rollback on error', async () => {
      const existingProject = {
        id: 'proj-1',
        name: 'Project',
        tasks: [{ id: 't1', name: 'Task' }],
      } as any;

      const context = { existingProject };

      const mockGeminiResponse = { text: '{"tasks": []}' };
      const parsedResponse = { tasks: [] };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.handle.mockReturnValue(mockGeminiResponse.text);
      mockJsonParser.handle.mockReturnValue(parsedResponse);

      mockDataSource.transaction.mockImplementation((callback) => {
        return callback(mockEntityManager).catch((error: Error) => {
          throw error;
        });
      });

      const mockTaskRepo = {
        remove: jest.fn().mockRejectedValue(new Error('Delete failed')),
      };

      mockEntityManager.getRepository.mockReturnValue(mockTaskRepo);

      await expect(strategy.execute(context)).rejects.toThrow('Delete failed');
    });
  });

  describe('execute - Task field normalization', () => {
    it('should handle alternative task field names', async () => {
      const existingProject = {
        id: 'proj-1',
        name: 'Project',
        tasks: [],
      } as any;

      const context = { existingProject };

      const mockGeminiResponse = {
        text: '{"Tasks": [{"taskName": "Task"}]}',
      };
      const parsedResponse = {
        Tasks: [{ taskName: 'Task' }],
      };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.handle.mockReturnValue(mockGeminiResponse.text);
      mockJsonParser.handle.mockReturnValue(parsedResponse);

      const mockProjectRepo = {
        save: jest.fn().mockImplementation((p) => {
          const saved = { ...p };
          (saved as any).__metadata = { tasksRemoved: 0, tasksAdded: 1, fieldsUpdated: [] };
          return Promise.resolve(saved);
        }),
      };

      mockEntityManager.getRepository.mockReturnValue(mockProjectRepo);

      const result = await strategy.execute(context);

      expect(result.project.tasks[0].name).toBe('Task');
    });

    it('should handle null sprint and assignedTo values', async () => {
      const existingProject = {
        id: 'proj-1',
        name: 'Project',
        tasks: [],
      } as any;

      const context = { existingProject };

      const mockGeminiResponse = {
        text: '{"tasks": [{"name": "Task", "sprint": null, "assignedTo": null}]}',
      };
      const parsedResponse = {
        tasks: [{ name: 'Task', sprint: null, assignedTo: null }],
      };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.handle.mockReturnValue(mockGeminiResponse.text);
      mockJsonParser.handle.mockReturnValue(parsedResponse);

      const mockProjectRepo = {
        save: jest.fn().mockImplementation((p) => {
          const saved = { ...p };
          (saved as any).__metadata = { tasksRemoved: 0, tasksAdded: 1, fieldsUpdated: [] };
          return Promise.resolve(saved);
        }),
      };

      mockEntityManager.getRepository.mockReturnValue(mockProjectRepo);

      const result = await strategy.execute(context);

      expect(result.project.tasks[0].sprint).toBeNull();
      expect(result.project.tasks[0].assignedTo).toBeNull();
    });

    it('should convert sprint values correctly', async () => {
      const existingProject = {
        id: 'proj-1',
        name: 'Project',
        tasks: [],
      } as any;

      const context = { existingProject };

      const mockGeminiResponse = {
        text: '{"tasks": [{"name": "T1", "sprint": "3"}, {"name": "T2", "sprint": ""}, {"name": "T3", "sprint": "invalid"}]}',
      };
      const parsedResponse = {
        tasks: [
          { name: 'T1', sprint: '3' },
          { name: 'T2', sprint: '' },
          { name: 'T3', sprint: 'invalid' },
        ],
      };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.handle.mockReturnValue(mockGeminiResponse.text);
      mockJsonParser.handle.mockReturnValue(parsedResponse);

      const mockProjectRepo = {
        save: jest.fn().mockImplementation((p) => {
          const saved = { ...p };
          (saved as any).__metadata = { tasksRemoved: 0, tasksAdded: 3, fieldsUpdated: [] };
          return Promise.resolve(saved);
        }),
      };

      mockEntityManager.getRepository.mockReturnValue(mockProjectRepo);

      const result = await strategy.execute(context);

      expect(result.project.tasks[0].sprint).toBe(3);
      expect(result.project.tasks[1].sprint).toBeNull();
      expect(result.project.tasks[2].sprint).toBeNull();
    });
  });

  describe('execute - Error handling', () => {
    it('should throw error if Gemini returns empty response', async () => {
      const existingProject = { id: '1', name: 'Test', tasks: [] } as any;
      const context = { existingProject };

      const mockGeminiResponse = { text: '' };
      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);

      await expect(strategy.execute(context)).rejects.toThrow(
        'Empty response from Gemini'
      );
    });

    it('should throw error if Gemini API fails', async () => {
      const existingProject = { id: '1', name: 'Test', tasks: [] } as any;
      const context = { existingProject };

      mockGenAI.models.generateContent.mockRejectedValue(
        new Error('API Error')
      );

      await expect(strategy.execute(context)).rejects.toThrow('API Error');
    });

    it('should validate context before execution', async () => {
      const context = {};

      await expect(strategy.execute(context)).rejects.toThrow(
        BadRequestException
      );

      expect(mockGenAI.models.generateContent).not.toHaveBeenCalled();
    });
  });

  describe('execute - Gemini integration', () => {
    it('should use gemini-2.5-flash model', async () => {
      const existingProject = { id: '1', name: 'Test', tasks: [] } as any;
      const context = { existingProject };

      const mockGeminiResponse = { text: '{"tasks": []}' };
      const parsedResponse = { tasks: [] };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.handle.mockReturnValue(mockGeminiResponse.text);
      mockJsonParser.handle.mockReturnValue(parsedResponse);

      const mockProjectRepo = {
        save: jest.fn().mockImplementation((p) => {
          const saved = { ...p };
          (saved as any).__metadata = { tasksRemoved: 0, tasksAdded: 0, fieldsUpdated: [] };
          return Promise.resolve(saved);
        }),
      };

      mockEntityManager.getRepository.mockReturnValue(mockProjectRepo);

      await strategy.execute(context);

      const callArgs = mockGenAI.models.generateContent.mock.calls[0][0];
      expect(callArgs.model).toBe('gemini-2.5-flash');
    });

    it('should include existing project data in prompt', async () => {
      const existingProject = {
        id: 'proj-1',
        name: 'E-commerce Platform',
        priority: 'high',
        tasks: [{ id: 't1', name: 'Old Task' }],
      } as any;

      const context = { existingProject };

      const mockGeminiResponse = { text: '{"tasks": []}' };
      const parsedResponse = { tasks: [] };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.handle.mockReturnValue(mockGeminiResponse.text);
      mockJsonParser.handle.mockReturnValue(parsedResponse);

      const mockTaskRepo = {
        remove: jest.fn().mockResolvedValue(undefined),
      };
      const mockProjectRepo = {
        save: jest.fn().mockImplementation((p) => {
          const saved = { ...p };
          (saved as any).__metadata = { tasksRemoved: 1, tasksAdded: 0, fieldsUpdated: [] };
          return Promise.resolve(saved);
        }),
      };

      mockEntityManager.getRepository.mockImplementation((entity) => {
        if (entity === Tasks) return mockTaskRepo;
        if (entity === Projects) return mockProjectRepo;
        return null;
      });

      await strategy.execute(context);

      const callArgs = mockGenAI.models.generateContent.mock.calls[0][0];
      expect(callArgs.contents).toContain('E-commerce Platform');
      expect(callArgs.contents).toContain('Old Task');
      expect(callArgs.contents).toContain('Current project data');
    });
  });

  describe('Metadata extraction', () => {
    it('should extract and remove __metadata from project', async () => {
      const existingProject = {
        id: '1',
        name: 'Test',
        tasks: [{ id: 't1', name: 'Old' }],
      } as any;

      const context = { existingProject };

      const mockGeminiResponse = { text: '{"tasks": [{"name": "New"}]}' };
      const parsedResponse = { tasks: [{ name: 'New' }] };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.handle.mockReturnValue(mockGeminiResponse.text);
      mockJsonParser.handle.mockReturnValue(parsedResponse);

      const mockTaskRepo = {
        remove: jest.fn().mockResolvedValue(undefined),
      };
      const mockProjectRepo = {
        save: jest.fn().mockImplementation((p) => {
          const saved = { ...p };
          (saved as any).__metadata = {
            tasksRemoved: 1,
            tasksAdded: 1,
            fieldsUpdated: [],
          };
          return Promise.resolve(saved);
        }),
      };

      mockEntityManager.getRepository.mockImplementation((entity) => {
        if (entity === Tasks) return mockTaskRepo;
        if (entity === Projects) return mockProjectRepo;
        return null;
      });

      const result = await strategy.execute(context);

      // Metadata should be in result
      expect(result.metadata.tasksRemoved).toBe(1);
      expect(result.metadata.tasksAdded).toBe(1);
      
      // __metadata should not be in final project
      expect((result.project as any).__metadata).toBeUndefined();
    });
  });
});