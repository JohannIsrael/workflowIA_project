import { Test, TestingModule } from '@nestjs/testing';
import { PredictProjectStrategy } from './predict-project.strategy';
import { GoogleGenAI } from '@google/genai';
import { JsonCleanerProcessor } from '../processors/json-cleaner.processor';
import { JsonParserProcessor } from '../processors/json-parser.processor';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Projects } from '../entities/Projects.entity';
import { Tasks } from '../entities/Tasks.entity';
import { BadRequestException } from '@nestjs/common';
import { WORKFLOW_PREDICT_PROMPT } from '../entities/prompts/Predict';

describe('PredictProjectStrategy', () => {
  let strategy: PredictProjectStrategy;
  let mockGenAI: any;
  let mockJsonCleaner: any;
  let mockJsonParser: any;
  let mockProjectsRepository: any;
  let mockTasksRepository: any;

  beforeEach(async () => {
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
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PredictProjectStrategy,
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
      ],
    }).compile();

    strategy = module.get<PredictProjectStrategy>(PredictProjectStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('getPrompt', () => {
    it('should return the predict workflow prompt', () => {
      const prompt = strategy.getPrompt();
      
      expect(prompt).toBe(WORKFLOW_PREDICT_PROMPT);
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

  describe('execute - Add new tasks', () => {
    it('should add new tasks to existing project', async () => {
      const existingProject = {
        id: 'proj-123',
        name: 'E-commerce',
        tasks: [
          { id: 't1', name: 'Existing Task 1' },
          { id: 't2', name: 'Existing Task 2' },
        ],
      } as any;

      const context = { existingProject };

      const mockGeminiResponse = {
        text: '{"tasks": [{"name": "New Task 1"}, {"name": "New Task 2"}]}',
      };

      const parsedResponse = {
        tasks: [
          { name: 'New Task 1', description: 'Predicted task 1' },
          { name: 'New Task 2', description: 'Predicted task 2' },
        ],
      };

      const savedProject = {
        ...existingProject,
        tasks: [
          ...existingProject.tasks,
          { id: 't3', name: 'New Task 1', description: 'Predicted task 1' },
          { id: 't4', name: 'New Task 2', description: 'Predicted task 2' },
        ],
      };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.handle.mockReturnValue(mockGeminiResponse.text);
      mockJsonParser.handle.mockReturnValue(parsedResponse);
      mockProjectsRepository.save.mockResolvedValue(savedProject);

      const result = await strategy.execute(context);

      expect(result.action).toBe('predict');
      expect(result.project).toBeDefined();
      expect(result.metadata.tasksAdded).toBe(2);
      expect(mockProjectsRepository.save).toHaveBeenCalled();
    });

    it('should preserve existing tasks when adding new ones', async () => {
      const existingProject = {
        id: 'proj-1',
        name: 'Project',
        tasks: [
          { id: 't1', name: 'Task 1', sprint: 1 },
        ],
      } as any;

      const context = { existingProject };

      const mockGeminiResponse = { text: '{"tasks": [{"name": "Task 2"}]}' };
      const parsedResponse = {
        tasks: [{ name: 'Task 2', sprint: 2 }],
      };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.handle.mockReturnValue(mockGeminiResponse.text);
      mockJsonParser.handle.mockReturnValue(parsedResponse);
      mockProjectsRepository.save.mockImplementation((project) => {
        return Promise.resolve({
          ...project,
          tasks: project.tasks.map((t: any, i: number) => ({
            ...t,
            id: t.id || `t-new-${i}`,
          })),
        });
      });

      const result = await strategy.execute(context);

      const savedProject = result.project as Projects;
      expect(savedProject.tasks.length).toBe(2);
      // Original task should still be there
      expect(savedProject.tasks.some((t: any) => t.name === 'Task 1')).toBe(true);
      // New task should be added
      expect(savedProject.tasks.some((t: any) => t.name === 'Task 2')).toBe(true);
    });

    it('should handle empty tasks array from Gemini', async () => {
      const existingProject = {
        id: 'proj-1',
        name: 'Project',
        tasks: [{ id: 't1', name: 'Task 1' }],
      } as any;

      const context = { existingProject };

      const mockGeminiResponse = { text: '{"tasks": []}' };
      const parsedResponse = { tasks: [] };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.handle.mockReturnValue(mockGeminiResponse.text);
      mockJsonParser.handle.mockReturnValue(parsedResponse);
      mockProjectsRepository.save.mockResolvedValue(existingProject);

      const result = await strategy.execute(context);

      expect(result.metadata.tasksAdded).toBe(0);
      expect(result.project.tasks.length).toBe(1);
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

      const mockGeminiResponse = { text: '{"sprintsQuantity": 5, "tasks": []}' };
      const parsedResponse = { sprintsQuantity: 5, tasks: [] };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.handle.mockReturnValue(mockGeminiResponse.text);
      mockJsonParser.handle.mockReturnValue(parsedResponse);
      mockProjectsRepository.save.mockImplementation((p) => Promise.resolve(p));

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

      const mockGeminiResponse = { text: '{"endDate": "2025-12-31", "tasks": []}' };
      const parsedResponse = { endDate: '2025-12-31', tasks: [] };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.handle.mockReturnValue(mockGeminiResponse.text);
      mockJsonParser.handle.mockReturnValue(parsedResponse);
      mockProjectsRepository.save.mockImplementation((p) => Promise.resolve(p));

      const result = await strategy.execute(context);

      expect(result.project.endDate).toBe('2025-12-31');
      expect(result.metadata.fieldsUpdated).toContain('endDate');
    });

    it('should update both sprintsQuantity and endDate', async () => {
      const existingProject = {
        id: 'proj-1',
        name: 'Project',
        sprintsQuantity: 3,
        endDate: '2025-10-31',
        tasks: [],
      } as any;

      const context = { existingProject };

      const mockGeminiResponse = {
        text: '{"sprintsQuantity": 6, "endDate": "2026-01-31", "tasks": []}',
      };
      const parsedResponse = {
        sprintsQuantity: 6,
        endDate: '2026-01-31',
        tasks: [],
      };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.handle.mockReturnValue(mockGeminiResponse.text);
      mockJsonParser.handle.mockReturnValue(parsedResponse);
      mockProjectsRepository.save.mockImplementation((p) => Promise.resolve(p));

      const result = await strategy.execute(context);

      expect(result.project.sprintsQuantity).toBe(6);
      expect(result.project.endDate).toBe('2026-01-31');
      expect(result.metadata.fieldsUpdated).toEqual(['sprintsQuantity', 'endDate']);
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
      mockProjectsRepository.save.mockImplementation((p) => Promise.resolve(p));

      const result = await strategy.execute(context);

      expect(result.metadata.fieldsUpdated).toEqual([]);
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
        text: '{"Tasks": [{"taskName": "Task", "description": "Desc"}]}',
      };
      const parsedResponse = {
        Tasks: [{ taskName: 'Task', description: 'Desc' }],
      };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.handle.mockReturnValue(mockGeminiResponse.text);
      mockJsonParser.handle.mockReturnValue(parsedResponse);
      mockProjectsRepository.save.mockImplementation((p) => Promise.resolve(p));

      const result = await strategy.execute(context);

      expect(result.project.tasks[0].name).toBe('Task');
    });

    it('should handle null and undefined task fields', async () => {
      const existingProject = {
        id: 'proj-1',
        name: 'Project',
        tasks: [],
      } as any;

      const context = { existingProject };

      const mockGeminiResponse = {
        text: '{"tasks": [{"name": "Task", "assignedTo": null, "sprint": ""}]}',
      };
      const parsedResponse = {
        tasks: [{ name: 'Task', assignedTo: null, sprint: '' }],
      };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.handle.mockReturnValue(mockGeminiResponse.text);
      mockJsonParser.handle.mockReturnValue(parsedResponse);
      mockProjectsRepository.save.mockImplementation((p) => Promise.resolve(p));

      const result = await strategy.execute(context);

      const task = result.project.tasks[0];
      expect(task.assignedTo).toBeNull();
      expect(task.sprint).toBeNull();
    });

    it('should convert sprint string to number', async () => {
      const existingProject = {
        id: 'proj-1',
        name: 'Project',
        tasks: [],
      } as any;

      const context = { existingProject };

      const mockGeminiResponse = {
        text: '{"tasks": [{"name": "Task", "sprint": "3"}]}',
      };
      const parsedResponse = {
        tasks: [{ name: 'Task', sprint: '3' }],
      };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.handle.mockReturnValue(mockGeminiResponse.text);
      mockJsonParser.handle.mockReturnValue(parsedResponse);
      mockProjectsRepository.save.mockImplementation((p) => Promise.resolve(p));

      const result = await strategy.execute(context);

      expect(result.project.tasks[0].sprint).toBe(3);
      expect(typeof result.project.tasks[0].sprint).toBe('number');
    });

    it('should handle invalid sprint values as null', async () => {
      const existingProject = {
        id: 'proj-1',
        name: 'Project',
        tasks: [],
      } as any;

      const context = { existingProject };

      const mockGeminiResponse = {
        text: '{"tasks": [{"name": "T1", "sprint": "invalid"}, {"name": "T2", "sprint": NaN}]}',
      };
      const parsedResponse = {
        tasks: [
          { name: 'T1', sprint: 'invalid' },
          { name: 'T2', sprint: NaN },
        ],
      };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.handle.mockReturnValue(mockGeminiResponse.text);
      mockJsonParser.handle.mockReturnValue(parsedResponse);
      mockProjectsRepository.save.mockImplementation((p) => Promise.resolve(p));

      const result = await strategy.execute(context);

      expect(result.project.tasks[0].sprint).toBeNull();
      expect(result.project.tasks[1].sprint).toBeNull();
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

    it('should handle repository save errors', async () => {
      const existingProject = { id: '1', name: 'Test', tasks: [] } as any;
      const context = { existingProject };

      const mockGeminiResponse = { text: '{"tasks": []}' };
      const parsedResponse = { tasks: [] };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.handle.mockReturnValue(mockGeminiResponse.text);
      mockJsonParser.handle.mockReturnValue(parsedResponse);
      mockProjectsRepository.save.mockRejectedValue(
        new Error('Database error')
      );

      await expect(strategy.execute(context)).rejects.toThrow('Database error');
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
      mockProjectsRepository.save.mockResolvedValue(existingProject);

      await strategy.execute(context);

      const callArgs = mockGenAI.models.generateContent.mock.calls[0][0];
      expect(callArgs.model).toBe('gemini-2.5-flash');
    });

    it('should include existing project data in prompt', async () => {
      const existingProject = {
        id: 'proj-1',
        name: 'E-commerce Platform',
        priority: 'high',
        tasks: [
          { id: 't1', name: 'Task 1', sprint: 1 },
        ],
      } as any;

      const context = { existingProject };

      const mockGeminiResponse = { text: '{"tasks": []}' };
      const parsedResponse = { tasks: [] };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.handle.mockReturnValue(mockGeminiResponse.text);
      mockJsonParser.handle.mockReturnValue(parsedResponse);
      mockProjectsRepository.save.mockResolvedValue(existingProject);

      await strategy.execute(context);

      const callArgs = mockGenAI.models.generateContent.mock.calls[0][0];
      expect(callArgs.contents).toContain('E-commerce Platform');
      expect(callArgs.contents).toContain('Task 1');
      expect(callArgs.contents).toContain('Current project data');
    });
  });

  describe('Metadata extraction', () => {
    it('should extract and remove __metadata from project', async () => {
      const existingProject = { id: '1', name: 'Test', tasks: [] } as any;
      const context = { existingProject };

      const mockGeminiResponse = { text: '{"tasks": [{"name": "New"}]}' };
      const parsedResponse = { tasks: [{ name: 'New' }] };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.handle.mockReturnValue(mockGeminiResponse.text);
      mockJsonParser.handle.mockReturnValue(parsedResponse);
      mockProjectsRepository.save.mockImplementation((p) => {
        const saved = { ...p };
        (saved as any).__metadata = {
          tasksAdded: 1,
          fieldsUpdated: [],
        };
        return Promise.resolve(saved);
      });

      const result = await strategy.execute(context);

      // Metadata should be in result
      expect(result.metadata.tasksAdded).toBe(1);
      
      // __metadata should not be in final project
      expect((result.project as any).__metadata).toBeUndefined();
    });
  });
});