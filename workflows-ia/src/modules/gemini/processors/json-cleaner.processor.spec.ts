import { Test, TestingModule } from '@nestjs/testing';
import { JsonCleanerProcessor } from './json-cleaner.processor';
import { BadRequestException } from '@nestjs/common';

describe('JsonCleanerProcessor', () => {
  let processor: JsonCleanerProcessor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JsonCleanerProcessor],
    }).compile();

    processor = module.get<JsonCleanerProcessor>(JsonCleanerProcessor);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('handle - Basic cleaning', () => {
    it('should remove markdown code blocks with json', () => {
      const input = '```json\n{"name": "test"}\n```';
      const result = processor['handle'](input);
      
      expect(result).not.toContain('```');
      expect(result).toContain('"name"');
      expect(result).toContain('"test"');
    });

    it('should remove markdown code blocks without language', () => {
      const input = '```\n{"name": "test"}\n```';
      const result = processor['handle'](input);
      
      expect(result).not.toContain('```');
      expect(result).toContain('{"name": "test"}');
    });

    it('should trim whitespace', () => {
      const input = '   \n  {"name": "test"}  \n  ';
      const result = processor['handle'](input);
      
      expect(result).toBe('{"name": "test"}');
    });

    it('should normalize line endings', () => {
      const input = '{"name":\r\n"test"}';
      const result = processor['handle'](input);
      
      expect(result).not.toContain('\r\n');
      expect(result).toContain('\n');
    });
  });

  describe('handle - Quote handling', () => {
    it('should convert curly double quotes to straight quotes', () => {
      const input = '{"name": "test"}';
      const result = processor['handle'](input);
      
      expect(result).toBe('{"name": "test"}');
    });

    it('should convert single quotes to double quotes for values', () => {
      const input = "{'name': 'test'}";
      const result = processor['handle'](input);
      
      // Should convert keys and values to double quotes
      expect(result).toContain('"name"');
      expect(result).toContain('"test"');
    });

    it('should handle mixed quotes', () => {
      const input = `{"name": 'test', "age": '25'}`;
      const result = processor['handle'](input);
      
      expect(result).toContain('"name"');
      expect(result).toContain('"test"');
      expect(result).toContain('"age"');
    });
  });

  describe('handle - Trailing commas', () => {
    it('should remove trailing comma before closing brace', () => {
      const input = '{"name": "test",}';
      const result = processor['handle'](input);
      
      expect(result).toBe('{"name": "test"}');
    });

    it('should remove trailing comma before closing bracket', () => {
      const input = '{"items": [1, 2, 3,]}';
      const result = processor['handle'](input);
      
      expect(result).toContain('[1, 2, 3]');
    });

    it('should remove multiple trailing commas', () => {
      const input = '{"a": 1, "b": {"c": 2,},}';
      const result = processor['handle'](input);
      
      expect(result).not.toContain(',}');
    });
  });

  describe('handle - JSON extraction', () => {
    it('should extract balanced JSON from text', () => {
      const input = 'Here is some text {"name": "test"} and more text';
      const result = processor['handle'](input);
      
      expect(result).toContain('{"name": "test"}');
    });

    it('should extract nested JSON correctly', () => {
      const input = 'Text before {"project": {"name": "test", "tasks": []}} text after';
      const result = processor['handle'](input);
      
      expect(result).toContain('"project"');
      expect(result).toContain('"tasks"');
    });

    it('should handle deeply nested structures', () => {
      const input = '{"a": {"b": {"c": {"d": "value"}}}}';
      const result = processor['handle'](input);
      
      expect(result).toContain('"d"');
      expect(result).toContain('"value"');
    });
  });

  describe('handle - Special values', () => {
    it('should convert NaN to null', () => {
      const input = '{"value": NaN}';
      const result = processor['handle'](input);
      
      expect(result).toContain('null');
      expect(result).not.toContain('NaN');
    });

    it('should convert Infinity to null', () => {
      const input = '{"value": Infinity}';
      const result = processor['handle'](input);
      
      expect(result).toContain('null');
      expect(result).not.toContain('Infinity');
    });

    it('should convert -Infinity to null', () => {
      const input = '{"value": -Infinity}';
      const result = processor['handle'](input);
      
      expect(result).toContain('null');
      expect(result).not.toContain('-Infinity');
    });
  });

  describe('handle - Comments removal', () => {
    it('should remove single-line comments', () => {
      const input = `{
        "name": "test" // this is a comment
      }`;
      const result = processor['handle'](input);
      
      expect(result).not.toContain('//');
      expect(result).not.toContain('this is a comment');
      expect(result).toContain('"name"');
    });

    it('should remove multi-line comments', () => {
      const input = `{
        /* this is a 
           multi-line comment */
        "name": "test"
      }`;
      const result = processor['handle'](input);
      
      expect(result).not.toContain('/*');
      expect(result).not.toContain('multi-line comment');
      expect(result).toContain('"name"');
    });
  });

  describe('handle - Error cases', () => {
    it('should throw error for empty string', () => {
      expect(() => processor['handle']('')).toThrow(BadRequestException);
      expect(() => processor['handle']('')).toThrow('Respuesta vacía');
    });

    it('should throw error for null input', () => {
      expect(() => processor['handle'](null as any)).toThrow(BadRequestException);
    });

    it('should throw error for undefined input', () => {
      expect(() => processor['handle'](undefined as any)).toThrow(BadRequestException);
    });

    it('should throw error for non-string input', () => {
      expect(() => processor['handle'](123 as any)).toThrow(BadRequestException);
      expect(() => processor['handle']({} as any)).toThrow(BadRequestException);
    });
  });

  describe('handle - Complex real-world cases', () => {
    it('should clean Gemini response with markdown', () => {
      const input = `Here is the result:
\`\`\`json
{
  "project": {
    "name": "E-commerce Platform",
    "priority": "high",
    "tasks": [
      {"name": "Setup DB", "sprint": 1,}
    ],
  }
}
\`\`\``;
      
      const result = processor['handle'](input);
      
      expect(result).not.toContain('```');
      expect(result).not.toContain(',}');
      expect(result).toContain('"E-commerce Platform"');
    });

    it('should handle unquoted keys', () => {
      const input = '{name: "test", value: 123}';
      const result = processor['handle'](input);
      
      expect(result).toContain('"name"');
      expect(result).toContain('"value"');
    });

    it('should preserve strings with quotes inside', () => {
      const input = '{"description": "This is a \\"quoted\\" word"}';
      const result = processor['handle'](input);
      
      expect(result).toContain('description');
      expect(result).toContain('quoted');
    });

    it('should handle newlines inside string values', () => {
      const input = `{
        "description": "Line 1
        Line 2
        Line 3"
      }`;
      const result = processor['handle'](input);
      
      expect(result).toContain('description');
      // Newlines inside strings should be collapsed (may include multiple spaces)
      expect(result).toContain('Line 1');
      expect(result).toContain('Line 2');
      expect(result).toContain('Line 3');
      expect(result).not.toContain('\n"'); // No newlines should remain before closing quote
    });
  });

  describe('process - Chain of Responsibility', () => {
    it('should call process and return result when no next processor', async () => {
      const input = '{"name": "test"}';
      const result = await processor.process(input);
      
      expect(result).toContain('"name"');
      expect(result).toContain('"test"');
    });

    it('should pass result to next processor if set', async () => {
      const mockNextProcessor = {
        process: jest.fn().mockResolvedValue({ parsed: true }),
        setNext: jest.fn(),
      };
      
      processor.setNext(mockNextProcessor);
      
      const input = '{"name": "test"}';
      const result = await processor.process(input);
      
      expect(mockNextProcessor.process).toHaveBeenCalled();
      expect(result).toEqual({ parsed: true });
    });
  });
});