import { Test, TestingModule } from '@nestjs/testing';
import { JsonParserProcessor } from './json-parser.processor';
import { BadRequestException } from '@nestjs/common';

describe('JsonParserProcessor', () => {
  let processor: JsonParserProcessor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JsonParserProcessor],
    }).compile();

    processor = module.get<JsonParserProcessor>(JsonParserProcessor);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('handle - Valid JSON parsing', () => {
    it('should parse simple JSON object', () => {
      const input = '{"name": "test"}';
      const result = processor['handle'](input);
      
      expect(result).toEqual({ name: 'test' });
      expect(result.name).toBe('test');
    });

    it('should parse JSON with multiple properties', () => {
      const input = '{"name": "test", "age": 25, "active": true}';
      const result = processor['handle'](input);
      
      expect(result).toEqual({ 
        name: 'test', 
        age: 25, 
        active: true 
      });
    });

    it('should parse JSON array', () => {
      const input = '[1, 2, 3, 4, 5]';
      const result = processor['handle'](input);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should parse nested JSON objects', () => {
      const input = '{"project": {"name": "test", "priority": "high"}}';
      const result = processor['handle'](input);
      
      expect(result.project).toBeDefined();
      expect(result.project.name).toBe('test');
      expect(result.project.priority).toBe('high');
    });

    it('should parse JSON with arrays', () => {
      const input = '{"tasks": [{"name": "Task 1"}, {"name": "Task 2"}]}';
      const result = processor['handle'](input);
      
      expect(Array.isArray(result.tasks)).toBe(true);
      expect(result.tasks).toHaveLength(2);
      expect(result.tasks[0].name).toBe('Task 1');
    });

    it('should parse null values correctly', () => {
      const input = '{"value": null, "name": "test"}';
      const result = processor['handle'](input);
      
      expect(result.value).toBeNull();
      expect(result.name).toBe('test');
    });

    it('should parse boolean values correctly', () => {
      const input = '{"isActive": true, "isDeleted": false}';
      const result = processor['handle'](input);
      
      expect(result.isActive).toBe(true);
      expect(result.isDeleted).toBe(false);
    });

    it('should parse numbers correctly', () => {
      const input = '{"integer": 42, "float": 3.14, "negative": -10}';
      const result = processor['handle'](input);
      
      expect(result.integer).toBe(42);
      expect(result.float).toBe(3.14);
      expect(result.negative).toBe(-10);
    });

    it('should parse empty object', () => {
      const input = '{}';
      const result = processor['handle'](input);
      
      expect(result).toEqual({});
      expect(Object.keys(result)).toHaveLength(0);
    });

    it('should parse empty array', () => {
      const input = '[]';
      const result = processor['handle'](input);
      
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('handle - Complex structures', () => {
    it('should parse project structure', () => {
      const input = JSON.stringify({
        project: {
          name: 'E-commerce Platform',
          priority: 'high',
          backtech: 'NestJS',
          fronttech: 'React',
          tasks: [
            { name: 'Setup DB', sprint: 1 },
            { name: 'Create API', sprint: 2 }
          ]
        }
      });
      
      const result = processor['handle'](input);
      
      expect(result.project).toBeDefined();
      expect(result.project.name).toBe('E-commerce Platform');
      expect(result.project.tasks).toHaveLength(2);
      expect(result.project.tasks[0].sprint).toBe(1);
    });

    it('should parse multiple projects structure', () => {
      const input = JSON.stringify({
        projects: [
          { name: 'Project 1', priority: 'high' },
          { name: 'Project 2', priority: 'medium' }
        ]
      });
      
      const result = processor['handle'](input);
      
      expect(result.projects).toHaveLength(2);
      expect(result.projects[0].name).toBe('Project 1');
      expect(result.projects[1].priority).toBe('medium');
    });

    it('should parse deeply nested structure', () => {
      const input = '{"a": {"b": {"c": {"d": {"e": "value"}}}}}';
      const result = processor['handle'](input);
      
      expect(result.a.b.c.d.e).toBe('value');
    });

    it('should parse structure with special characters in strings', () => {
      const input = '{"description": "Line with \\"quotes\\" and \\nnewlines"}';
      const result = processor['handle'](input);
      
      expect(result.description).toContain('quotes');
      expect(result.description).toContain('newlines');
    });

    it('should parse unicode characters', () => {
      const input = '{"emoji": "🚀", "chinese": "你好", "spanish": "señor"}';
      const result = processor['handle'](input);
      
      expect(result.emoji).toBe('🚀');
      expect(result.chinese).toBe('你好');
      expect(result.spanish).toBe('señor');
    });
  });

  describe('handle - Error cases', () => {
    it('should throw BadRequestException for invalid JSON', () => {
      const input = '{invalid json}';
      
      expect(() => processor['handle'](input)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for unclosed braces', () => {
      const input = '{"name": "test"';
      
      expect(() => processor['handle'](input)).toThrow(BadRequestException);
      expect(() => processor['handle'](input)).toThrow(/JSON inválido/);
    });

    it('should throw BadRequestException for missing quotes', () => {
      const input = '{name: test}';
      
      expect(() => processor['handle'](input)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for trailing comma', () => {
      const input = '{"name": "test",}';
      
      expect(() => processor['handle'](input)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for missing commas', () => {
      const input = '{"name": "test" "age": 25}';
      
      expect(() => processor['handle'](input)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException with position info when available', () => {
      const input = '{"name": "test", "invalid}';
      
      try {
        processor['handle'](input);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toContain('JSON inválido');
        // May contain position or context information
      }
    });

    it('should throw BadRequestException for empty string', () => {
      const input = '';
      
      expect(() => processor['handle'](input)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for only whitespace', () => {
      const input = '   \n  \t  ';
      
      expect(() => processor['handle'](input)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for malformed arrays', () => {
      const input = '[1, 2, 3,]';
      
      expect(() => processor['handle'](input)).toThrow(BadRequestException);
    });
  });

  describe('handle - Edge cases', () => {
    it('should parse JSON with whitespace', () => {
      const input = `
        {
          "name": "test",
          "value": 123
        }
      `;
      const result = processor['handle'](input);
      
      expect(result).toEqual({ name: 'test', value: 123 });
    });

    it('should parse single string value', () => {
      const input = '"just a string"';
      const result = processor['handle'](input);
      
      expect(result).toBe('just a string');
    });

    it('should parse single number value', () => {
      const input = '42';
      const result = processor['handle'](input);
      
      expect(result).toBe(42);
    });

    it('should parse single boolean value', () => {
      const input = 'true';
      const result = processor['handle'](input);
      
      expect(result).toBe(true);
    });

    it('should parse single null value', () => {
      const input = 'null';
      const result = processor['handle'](input);
      
      expect(result).toBeNull();
    });

    it('should handle large JSON objects', () => {
      const largeObject = {
        items: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          data: { value: i * 2 }
        }))
      };
      const input = JSON.stringify(largeObject);
      const result = processor['handle'](input);
      
      expect(result.items).toHaveLength(100);
      expect(result.items[50].id).toBe(50);
    });
  });

  describe('process - Chain of Responsibility', () => {
    it('should call process and return parsed result when no next processor', async () => {
      const input = '{"name": "test"}';
      const result = await processor.process(input);
      
      expect(result).toEqual({ name: 'test' });
    });

    it('should pass parsed result to next processor if set', async () => {
      const mockNextProcessor = {
        process: jest.fn().mockResolvedValue({ normalized: true }),
        setNext: jest.fn(),
      };
      
      processor.setNext(mockNextProcessor);
      
      const input = '{"name": "test"}';
      const result = await processor.process(input);
      
      expect(mockNextProcessor.process).toHaveBeenCalledWith({ name: 'test' });
      expect(result).toEqual({ normalized: true });
    });

    it('should handle errors and propagate them', async () => {
      const input = 'invalid json';
      
      await expect(processor.process(input)).rejects.toThrow(BadRequestException);
    });
  });
});