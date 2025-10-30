import { Test, TestingModule } from '@nestjs/testing';
import { GeminiStrategyFactory } from './strategy.factory';
import { CreateProjectStrategy } from './create-project.strategy';
import { PredictProjectStrategy } from './predict-project.strategy';
import { OptimizeProjectStrategy } from './optimize-project.strategy';
import { BadRequestException } from '@nestjs/common';

describe('GeminiStrategyFactory', () => {
  let factory: GeminiStrategyFactory;
  let mockCreateStrategy: CreateProjectStrategy;
  let mockPredictStrategy: PredictProjectStrategy;
  let mockOptimizeStrategy: OptimizeProjectStrategy;

  beforeEach(async () => {
    // Create mock strategies
    mockCreateStrategy = {
      execute: jest.fn(),
      getPrompt: jest.fn().mockReturnValue('CREATE_PROMPT'),
      validate: jest.fn(),
    } as any;

    mockPredictStrategy = {
      execute: jest.fn(),
      getPrompt: jest.fn().mockReturnValue('PREDICT_PROMPT'),
      validate: jest.fn(),
    } as any;

    mockOptimizeStrategy = {
      execute: jest.fn(),
      getPrompt: jest.fn().mockReturnValue('OPTIMIZE_PROMPT'),
      validate: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiStrategyFactory,
        {
          provide: CreateProjectStrategy,
          useValue: mockCreateStrategy,
        },
        {
          provide: PredictProjectStrategy,
          useValue: mockPredictStrategy,
        },
        {
          provide: OptimizeProjectStrategy,
          useValue: mockOptimizeStrategy,
        },
      ],
    }).compile();

    factory = module.get<GeminiStrategyFactory>(GeminiStrategyFactory);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(factory).toBeDefined();
  });

  describe('getStrategy', () => {
    it('should return create strategy when type is "create"', () => {
      const strategy = factory.getStrategy('create');
      
      expect(strategy).toBe(mockCreateStrategy);
      expect(strategy).toBeDefined();
    });

    it('should return predict strategy when type is "predict"', () => {
      const strategy = factory.getStrategy('predict');
      
      expect(strategy).toBe(mockPredictStrategy);
      expect(strategy).toBeDefined();
    });

    it('should return optimize strategy when type is "optimize"', () => {
      const strategy = factory.getStrategy('optimize');
      
      expect(strategy).toBe(mockOptimizeStrategy);
      expect(strategy).toBeDefined();
    });

    it('should throw BadRequestException for unknown strategy type', () => {
      expect(() => factory.getStrategy('unknown' as any)).toThrow(
        BadRequestException
      );
    });

    it('should throw error message with available strategies', () => {
      try {
        factory.getStrategy('invalid' as any);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toContain('Unknown strategy type: invalid');
        expect(error.message).toContain('Available:');
        expect(error.message).toContain('create');
        expect(error.message).toContain('predict');
        expect(error.message).toContain('optimize');
      }
    });

    it('should handle empty string as unknown strategy', () => {
      expect(() => factory.getStrategy('' as any)).toThrow(
        BadRequestException
      );
    });

    it('should handle case-sensitive strategy types', () => {
      // Should fail because it's case-sensitive
      expect(() => factory.getStrategy('CREATE' as any)).toThrow(
        BadRequestException
      );
      expect(() => factory.getStrategy('Create' as any)).toThrow(
        BadRequestException
      );
    });

    it('should return same instance on multiple calls', () => {
      const strategy1 = factory.getStrategy('create');
      const strategy2 = factory.getStrategy('create');
      
      expect(strategy1).toBe(strategy2);
    });
  });

  describe('getAvailableStrategies', () => {
    it('should return all available strategy types', () => {
      const strategies = factory.getAvailableStrategies();
      
      expect(strategies).toEqual(['create', 'predict', 'optimize']);
      expect(strategies).toHaveLength(3);
    });

    it('should return array of strings', () => {
      const strategies = factory.getAvailableStrategies();
      
      expect(Array.isArray(strategies)).toBe(true);
      strategies.forEach((strategy) => {
        expect(typeof strategy).toBe('string');
      });
    });

    it('should return strategies in consistent order', () => {
      const strategies1 = factory.getAvailableStrategies();
      const strategies2 = factory.getAvailableStrategies();
      
      expect(strategies1).toEqual(strategies2);
    });

    it('should include create strategy', () => {
      const strategies = factory.getAvailableStrategies();
      
      expect(strategies).toContain('create');
    });

    it('should include predict strategy', () => {
      const strategies = factory.getAvailableStrategies();
      
      expect(strategies).toContain('predict');
    });

    it('should include optimize strategy', () => {
      const strategies = factory.getAvailableStrategies();
      
      expect(strategies).toContain('optimize');
    });
  });

  describe('hasStrategy', () => {
    it('should return true for valid "create" strategy', () => {
      expect(factory.hasStrategy('create')).toBe(true);
    });

    it('should return true for valid "predict" strategy', () => {
      expect(factory.hasStrategy('predict')).toBe(true);
    });

    it('should return true for valid "optimize" strategy', () => {
      expect(factory.hasStrategy('optimize')).toBe(true);
    });

    it('should return false for invalid strategy type', () => {
      expect(factory.hasStrategy('invalid')).toBe(false);
      expect(factory.hasStrategy('unknown')).toBe(false);
      expect(factory.hasStrategy('delete')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(factory.hasStrategy('')).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(factory.hasStrategy(undefined as any)).toBe(false);
    });

    it('should return false for null', () => {
      expect(factory.hasStrategy(null as any)).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(factory.hasStrategy('CREATE')).toBe(false);
      expect(factory.hasStrategy('Create')).toBe(false);
      expect(factory.hasStrategy('PREDICT')).toBe(false);
    });

    it('should work as type guard', () => {
      const input: string = 'create';
      
      if (factory.hasStrategy(input)) {
        // TypeScript should narrow the type here
        const strategy = factory.getStrategy(input as any);
        expect(strategy).toBeDefined();
      }
    });
  });

  describe('Strategy integration', () => {
    it('should allow strategies to be called after retrieval', async () => {
      const strategy = factory.getStrategy('create');
      const mockContext = { userInput: 'Test input' };
      const mockResult = { action: 'create', project: {} };
      
      (strategy.execute as jest.Mock).mockResolvedValue(mockResult);
      
      const result = await strategy.execute(mockContext);
      
      expect(strategy.execute).toHaveBeenCalledWith(mockContext);
      expect(result).toEqual(mockResult);
    });

    it('should maintain strategy state between calls', () => {
      const strategy1 = factory.getStrategy('create');
      const strategy2 = factory.getStrategy('create');
      
      // Should be the same instance
      expect(strategy1).toBe(strategy2);
      
      // Calling a method on one should affect the other
      (strategy1.getPrompt as jest.Mock).mockReturnValue('MODIFIED_PROMPT');
      
      expect(strategy2.getPrompt()).toBe('MODIFIED_PROMPT');
    });

    it('should keep different strategies separate', () => {
      const createStrategy = factory.getStrategy('create');
      const predictStrategy = factory.getStrategy('predict');
      
      expect(createStrategy).not.toBe(predictStrategy);
      expect(createStrategy.getPrompt()).toBe('CREATE_PROMPT');
      expect(predictStrategy.getPrompt()).toBe('PREDICT_PROMPT');
    });
  });

  describe('Error handling', () => {
    it('should provide helpful error message', () => {
      try {
        factory.getStrategy('nonexistent' as any);
      } catch (error) {
        expect(error.message).toContain('nonexistent');
        expect(error.message).toContain('create');
        expect(error.message).toContain('predict');
        expect(error.message).toContain('optimize');
      }
    });

    it('should throw consistent error type', () => {
      const invalidTypes = ['invalid', 'wrong', 'bad', ''];
      
      invalidTypes.forEach((type) => {
        expect(() => factory.getStrategy(type as any)).toThrow(
          BadRequestException
        );
      });
    });
  });

  describe('Factory pattern benefits', () => {
    it('should encapsulate strategy creation logic', () => {
      // User doesn't need to know about strategy constructors
      const strategy = factory.getStrategy('create');
      
      expect(strategy).toBeDefined();
      expect(strategy.execute).toBeDefined();
    });

    it('should allow easy addition of new strategies in future', () => {
      // This test verifies the current structure supports extension
      const availableStrategies = factory.getAvailableStrategies();
      
      expect(availableStrategies.length).toBeGreaterThanOrEqual(3);
    });

    it('should provide centralized strategy access', () => {
      // All strategies accessible through single factory
      expect(factory.getStrategy('create')).toBeDefined();
      expect(factory.getStrategy('predict')).toBeDefined();
      expect(factory.getStrategy('optimize')).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle rapid successive calls', () => {
      const results = Array.from({ length: 100 }, () =>
        factory.getStrategy('create')
      );
      
      // All should be the same instance
      const first = results[0];
      results.forEach((result) => {
        expect(result).toBe(first);
      });
    });

    it('should handle all strategy types in sequence', () => {
      const create = factory.getStrategy('create');
      const predict = factory.getStrategy('predict');
      const optimize = factory.getStrategy('optimize');
      
      expect(create).not.toBe(predict);
      expect(predict).not.toBe(optimize);
      expect(create).not.toBe(optimize);
    });

    it('should handle hasStrategy checks before getStrategy', () => {
      const type = 'create';
      
      if (factory.hasStrategy(type)) {
        const strategy = factory.getStrategy(type);
        expect(strategy).toBeDefined();
      } else {
        fail('Should have found the strategy');
      }
    });
  });
});