import { Test, TestingModule } from '@nestjs/testing';
import { CreateProjectStrategy } from './create-project.strategy';
import { GoogleGenAI } from '@google/genai';
import { JsonCleanerProcessor } from '../processors/json-cleaner.processor';
import { JsonParserProcessor } from '../processors/json-parser.processor';
import { SpecNormalizerProcessor } from '../processors/spec-normalizer.processor';
import { SpecPersisterProcessor } from '../processors/spec-persister.processor';
import { BadRequestException } from '@nestjs/common';
import { WORKFLOW_CREATE_PROMPT } from '../entities/prompts/Create';

describe('CreateProjectStrategy', () => {
  let strategy: CreateProjectStrategy;
  let mockGenAI: any;
  let mockJsonCleaner: any;
  let mockJsonParser: any;
  let mockSpecNormalizer: any;
  let mockSpecPersister: any;

  beforeEach(async () => {
    // Mock GoogleGenAI
    mockGenAI = {
      models: {
        generateContent: jest.fn(),
      },
    };

    // Mock processors
    mockJsonCleaner = {
      setNext: jest.fn().mockReturnThis(),
      process: jest.fn(),
    };

    mockJsonParser = {
      setNext: jest.fn().mockReturnThis(),
      process: jest.fn(),
    };

    mockSpecNormalizer = {
      setNext: jest.fn().mockReturnThis(),
      process: jest.fn(),
    };

    mockSpecPersister = {
      setNext: jest.fn().mockReturnThis(),
      process: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateProjectStrategy,
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
          provide: SpecNormalizerProcessor,
          useValue: mockSpecNormalizer,
        },
        {
          provide: SpecPersisterProcessor,
          useValue: mockSpecPersister,
        },
      ],
    }).compile();

    strategy = module.get<CreateProjectStrategy>(CreateProjectStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('getPrompt', () => {
    it('should return the create workflow prompt', () => {
      const prompt = strategy.getPrompt();
      
      expect(prompt).toBe(WORKFLOW_CREATE_PROMPT);
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });
  });

  describe('validate', () => {
    it('should validate successfully with userInput', () => {
      const context = { userInput: 'Create an e-commerce platform' };
      
      expect(() => strategy.validate(context)).not.toThrow();
    });

    it('should throw error if context is missing', () => {
      expect(() => strategy.validate(null as any)).toThrow();
      expect(() => strategy.validate(undefined as any)).toThrow();
    });

    it('should throw BadRequestException if userInput is missing', () => {
      const context = {};
      
      expect(() => strategy.validate(context)).toThrow(BadRequestException);
      expect(() => strategy.validate(context)).toThrow('userInput is required');
    });

    it('should throw BadRequestException if userInput is empty', () => {
      const context = { userInput: '' };
      
      expect(() => strategy.validate(context)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException if userInput is null', () => {
      const context = { userInput: null as any };
      
      expect(() => strategy.validate(context)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException if userInput is undefined', () => {
      const context = { userInput: undefined };
      
      expect(() => strategy.validate(context)).toThrow(BadRequestException);
    });

    it('should accept userInput with whitespace', () => {
      const context = { userInput: '  Valid input  ' };
      
      expect(() => strategy.validate(context)).not.toThrow();
    });
  });

  describe('execute - Single project creation', () => {
    it('should create a single project successfully', async () => {
      const context = { userInput: 'Create an e-commerce platform' };
      
      const mockGeminiResponse = {
        text: '```json\n{"name": "E-commerce Platform", "tasks": []}\n```',
      };

      const mockPersistedResult = {
        isSingle: true,
        projects: [
          {
            id: 'proj-123',
            name: 'E-commerce Platform',
            tasks: [],
          },
        ],
      };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.process.mockResolvedValue(mockPersistedResult);

      const result = await strategy.execute(context);

      expect(result.action).toBe('create');
      expect(result.project).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(mockGenAI.models.generateContent).toHaveBeenCalled();
    });

    it('should include userInput in the prompt', async () => {
      const context = { userInput: 'Build a blog platform' };
      
      const mockGeminiResponse = { text: '{"name": "Blog", "tasks": []}' };
      const mockPersistedResult = {
        isSingle: true,
        projects: [{ id: '1', name: 'Blog', tasks: [] }],
      };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.process.mockResolvedValue(mockPersistedResult);

      await strategy.execute(context);

      const callArgs = mockGenAI.models.generateContent.mock.calls[0][0];
      expect(callArgs.contents).toContain('Build a blog platform');
    });

    it('should use gemini-2.5-flash model', async () => {
      const context = { userInput: 'Test project' };
      
      const mockGeminiResponse = { text: '{"name": "Test", "tasks": []}' };
      const mockPersistedResult = {
        isSingle: true,
        projects: [{ id: '1', name: 'Test', tasks: [] }],
      };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.process.mockResolvedValue(mockPersistedResult);

      await strategy.execute(context);

      const callArgs = mockGenAI.models.generateContent.mock.calls[0][0];
      expect(callArgs.model).toBe('gemini-2.5-flash');
    });

    it('should return single project when isSingle is true', async () => {
      const context = { userInput: 'Create project' };
      
      const mockGeminiResponse = { text: '{"name": "Project", "tasks": []}' };
      const mockPersistedResult = {
        isSingle: true,
        projects: [
          { 
            id: 'proj-1', 
            name: 'Project', 
            tasks: [
              { id: 't1', name: 'Task 1' },
              { id: 't2', name: 'Task 2' }
            ] 
          }
        ],
      };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.process.mockResolvedValue(mockPersistedResult);

      const result = await strategy.execute(context);

      expect(result.action).toBe('create');
      expect(result.project).toEqual(mockPersistedResult.projects[0]);
      expect(Array.isArray(result.project)).toBe(false);
      expect(result.metadata.tasksAdded).toBe(2);
    });
  });

  describe('execute - Multiple projects creation', () => {
    it('should create multiple projects successfully', async () => {
      const context = { userInput: 'Create 3 microservices' };
      
      const mockGeminiResponse = {
        text: '{"projects": [{"name": "Service 1"}, {"name": "Service 2"}]}',
      };

      const mockPersistedResult = {
        isSingle: false,
        projects: [
          { id: 'p1', name: 'Service 1', tasks: [] },
          { id: 'p2', name: 'Service 2', tasks: [] },
        ],
      };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.process.mockResolvedValue(mockPersistedResult);

      const result = await strategy.execute(context);

      expect(result.action).toBe('create');
      expect(Array.isArray(result.project)).toBe(true);
      expect((result.project as any[]).length).toBe(2);
    });

    it('should calculate total tasks from all projects', async () => {
      const context = { userInput: 'Create projects' };
      
      const mockGeminiResponse = { text: '{"projects": []}' };
      const mockPersistedResult = {
        isSingle: false,
        projects: [
          { id: 'p1', name: 'P1', tasks: [{ id: 't1' }, { id: 't2' }] },
          { id: 'p2', name: 'P2', tasks: [{ id: 't3' }] },
          { id: 'p3', name: 'P3', tasks: [{ id: 't4' }, { id: 't5' }, { id: 't6' }] },
        ],
      };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.process.mockResolvedValue(mockPersistedResult);

      const result = await strategy.execute(context);

      expect(result.metadata.tasksAdded).toBe(6);
    });

    it('should handle projects without tasks', async () => {
      const context = { userInput: 'Create empty projects' };
      
      const mockGeminiResponse = { text: '{"projects": []}' };
      const mockPersistedResult = {
        isSingle: false,
        projects: [
          { id: 'p1', name: 'P1' },
          { id: 'p2', name: 'P2', tasks: [] },
        ],
      };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.process.mockResolvedValue(mockPersistedResult);

      const result = await strategy.execute(context);

      expect(result.metadata.tasksAdded).toBe(0);
    });
  });

  describe('execute - Processing chain', () => {
    it('should pass raw response through processing chain', async () => {
      const context = { userInput: 'Test' };
      const rawResponse = '```json\n{"name": "Test"}\n```';
      
      const mockGeminiResponse = { text: rawResponse };
      const mockPersistedResult = {
        isSingle: true,
        projects: [{ id: '1', name: 'Test', tasks: [] }],
      };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.process.mockResolvedValue(mockPersistedResult);

      await strategy.execute(context);

      expect(mockJsonCleaner.process).toHaveBeenCalledWith(rawResponse);
    });

    it('should build processing chain correctly on initialization', () => {
      // Verify chain was built in constructor
      // The chain is built: cleaner -> parser -> normalizer -> persister
      expect(mockJsonCleaner.setNext).toHaveBeenCalledWith(mockJsonParser);
      // Note: setNext returns 'this', so subsequent calls are chained
      // We only need to verify the first call since the strategy builds it internally
      expect(mockJsonCleaner.setNext).toHaveBeenCalled();
    });
  });

  describe('execute - Error handling', () => {
    it('should throw error if Gemini returns empty response', async () => {
      const context = { userInput: 'Test' };
      
      const mockGeminiResponse = { text: '' };
      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);

      await expect(strategy.execute(context)).rejects.toThrow(
        'Empty response from Gemini'
      );
    });

    it('should throw error if Gemini returns null text', async () => {
      const context = { userInput: 'Test' };
      
      const mockGeminiResponse = { text: null };
      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);

      await expect(strategy.execute(context)).rejects.toThrow(
        'Empty response from Gemini'
      );
    });

    it('should throw error if Gemini returns undefined text', async () => {
      const context = { userInput: 'Test' };
      
      const mockGeminiResponse = { text: undefined };
      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);

      await expect(strategy.execute(context)).rejects.toThrow(
        'Empty response from Gemini'
      );
    });

    it('should throw error if Gemini API fails', async () => {
      const context = { userInput: 'Test' };
      
      mockGenAI.models.generateContent.mockRejectedValue(
        new Error('API Error')
      );

      await expect(strategy.execute(context)).rejects.toThrow('API Error');
    });

    it('should throw error if processing chain fails', async () => {
      const context = { userInput: 'Test' };
      
      const mockGeminiResponse = { text: 'valid response' };
      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.process.mockRejectedValue(
        new Error('Processing failed')
      );

      await expect(strategy.execute(context)).rejects.toThrow(
        'Processing failed'
      );
    });

    it('should validate context before execution', async () => {
      const context = {};

      await expect(strategy.execute(context)).rejects.toThrow(
        BadRequestException
      );
      
      // Should not call Gemini if validation fails
      expect(mockGenAI.models.generateContent).not.toHaveBeenCalled();
    });
  });

  describe('execute - Metadata', () => {
    it('should include tasksAdded in metadata', async () => {
      const context = { userInput: 'Test' };
      
      const mockGeminiResponse = { text: '{"name": "Test"}' };
      const mockPersistedResult = {
        isSingle: true,
        projects: [
          { 
            id: '1', 
            name: 'Test', 
            tasks: [
              { id: 't1', name: 'Task 1' },
              { id: 't2', name: 'Task 2' },
            ] 
          }
        ],
      };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.process.mockResolvedValue(mockPersistedResult);

      const result = await strategy.execute(context);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.tasksAdded).toBe(2);
    });

    it('should handle zero tasks in metadata', async () => {
      const context = { userInput: 'Test' };
      
      const mockGeminiResponse = { text: '{"name": "Test"}' };
      const mockPersistedResult = {
        isSingle: true,
        projects: [{ id: '1', name: 'Test', tasks: [] }],
      };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.process.mockResolvedValue(mockPersistedResult);

      const result = await strategy.execute(context);

      expect(result.metadata.tasksAdded).toBe(0);
    });
  });

  describe('buildPromptWithContext', () => {
    it('should append userInput to base prompt', () => {
      const context = { userInput: 'Build a CRM system' };
      const basePrompt = 'Base prompt text';
      
      const result = strategy['buildPromptWithContext'](basePrompt, context);

      expect(result).toContain('Base prompt text');
      expect(result).toContain('Build a CRM system');
      expect(result).toContain('User idea:');
    });

    it('should handle context without userInput', () => {
      const context = {};
      const basePrompt = 'Base prompt';
      
      const result = strategy['buildPromptWithContext'](basePrompt, context);

      expect(result).toBe('Base prompt');
      expect(result).not.toContain('User idea:');
    });

    it('should include existingProject only if provided in context', () => {
      const contextWithProject = { 
        userInput: 'Test',
        existingProject: { id: '1', name: 'Existing' } as any
      };
      const contextWithoutProject = {
        userInput: 'Test'
      };
      const basePrompt = 'Base prompt';
      
      // With existingProject - base class includes it
      const resultWith = strategy['buildPromptWithContext'](basePrompt, contextWithProject);
      expect(resultWith).toContain('Test');
      expect(resultWith).toContain('Current project data');
      expect(resultWith).toContain('Existing');
      
      // Without existingProject - should not include it
      const resultWithout = strategy['buildPromptWithContext'](basePrompt, contextWithoutProject);
      expect(resultWithout).toContain('Test');
      expect(resultWithout).not.toContain('Current project data');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complex project with multiple tasks', async () => {
      const context = { 
        userInput: 'Create a complete e-commerce platform with user management' 
      };
      
      const mockGeminiResponse = { text: '{"name": "E-commerce"}' };
      const mockPersistedResult = {
        isSingle: true,
        projects: [{
          id: 'ecom-1',
          name: 'E-commerce Platform',
          priority: 'high',
          backtech: 'NestJS',
          fronttech: 'React',
          tasks: [
            { id: 't1', name: 'User Authentication' },
            { id: 't2', name: 'Product Catalog' },
            { id: 't3', name: 'Shopping Cart' },
            { id: 't4', name: 'Payment Integration' },
            { id: 't5', name: 'Order Management' },
          ]
        }],
      };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.process.mockResolvedValue(mockPersistedResult);

      const result = await strategy.execute(context);

      expect(result.action).toBe('create');
      expect(result.metadata.tasksAdded).toBe(5);
      expect(result.project).toBeDefined();
    });

    it('should handle whitespace in user input', async () => {
      const context = { userInput: '  Build a blog   ' };
      
      const mockGeminiResponse = { text: '{"name": "Blog"}' };
      const mockPersistedResult = {
        isSingle: true,
        projects: [{ id: '1', name: 'Blog', tasks: [] }],
      };

      mockGenAI.models.generateContent.mockResolvedValue(mockGeminiResponse);
      mockJsonCleaner.process.mockResolvedValue(mockPersistedResult);

      await strategy.execute(context);

      const callArgs = mockGenAI.models.generateContent.mock.calls[0][0];
      expect(callArgs.contents).toContain('Build a blog');
    });
  });
});