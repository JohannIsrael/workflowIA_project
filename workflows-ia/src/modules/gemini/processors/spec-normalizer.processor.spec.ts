import { Test, TestingModule } from '@nestjs/testing';
import { SpecNormalizerProcessor } from './spec-normalizer.processor';
import { BadRequestException } from '@nestjs/common';

describe('SpecNormalizerProcessor', () => {
  let processor: SpecNormalizerProcessor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SpecNormalizerProcessor],
    }).compile();

    processor = module.get<SpecNormalizerProcessor>(SpecNormalizerProcessor);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('handle - Single project normalization', () => {
    it('should normalize single project object', () => {
      const input = {
        name: 'Test Project',
        priority: 'high',
        backtech: 'NestJS',
        fronttech: 'React',
        tasks: [
          { name: 'Task 1', description: 'Description 1' }
        ]
      };

      const result = processor['handle'](input);

      expect(result.isSingle).toBe(true);
      expect(result.projects).toHaveLength(1);
      expect(result.projects[0].name).toBe('Test Project');
      expect(result.projects[0].tasks).toHaveLength(1);
    });

    it('should normalize project wrapped in "project" key', () => {
      const input = {
        project: {
          name: 'Test Project',
          tasks: []
        }
      };

      const result = processor['handle'](input);

      expect(result.isSingle).toBe(true);
      expect(result.projects).toHaveLength(1);
      expect(result.projects[0].name).toBe('Test Project');
    });

    it('should normalize project with alternative field names', () => {
      const input = {
        projectName: 'Test Project',
        backTech: 'Express',
        frontTech: 'Vue',
        cloud_tech: 'AWS',
        sprints_quantity: 5,
        Tasks: [
          { taskName: 'Setup', description: 'Initial setup' }
        ]
      };

      const result = processor['handle'](input);

      expect(result.projects[0].name).toBe('Test Project');
      expect(result.projects[0].backtech).toBe('Express');
      expect(result.projects[0].fronttech).toBe('Vue');
      expect(result.projects[0].cloudTech).toBe('AWS');
      expect(result.projects[0].sprintsQuantity).toBe(5);
      expect(result.projects[0].tasks[0].name).toBe('Setup');
    });
  });

  describe('handle - Multiple projects normalization', () => {
    it('should normalize array of projects', () => {
      const input = {
        projects: [
          { name: 'Project 1', tasks: [] },
          { name: 'Project 2', tasks: [] }
        ]
      };

      const result = processor['handle'](input);

      expect(result.isSingle).toBe(false);
      expect(result.projects).toHaveLength(2);
      expect(result.projects[0].name).toBe('Project 1');
      expect(result.projects[1].name).toBe('Project 2');
    });

    it('should normalize multiple projects with different structures', () => {
      const input = {
        projects: [
          { 
            projectName: 'Project 1', 
            backTech: 'NestJS',
            Tasks: [{ taskName: 'Task 1' }]
          },
          { 
            name: 'Project 2',
            backtech: 'Express',
            tasks: [{ name: 'Task 2' }]
          }
        ]
      };

      const result = processor['handle'](input);

      expect(result.projects).toHaveLength(2);
      expect(result.projects[0].name).toBe('Project 1');
      expect(result.projects[0].backtech).toBe('NestJS');
      expect(result.projects[1].name).toBe('Project 2');
      expect(result.projects[1].backtech).toBe('Express');
    });
  });

  describe('handle - Field normalization', () => {
    it('should normalize priority as string', () => {
      const input = {
        name: 'Test',
        priority: 1,
        tasks: []
      };

      const result = processor['handle'](input);

      expect(result.projects[0].priority).toBe('1');
      expect(typeof result.projects[0].priority).toBe('string');
    });

    it('should normalize endDate as string', () => {
      const input = {
        name: 'Test',
        endDate: 20251231,
        tasks: []
      };

      const result = processor['handle'](input);

      expect(result.projects[0].endDate).toBe('20251231');
      expect(typeof result.projects[0].endDate).toBe('string');
    });

    it('should handle null values correctly', () => {
      const input = {
        name: 'Test',
        priority: null,
        backtech: null,
        endDate: null,
        tasks: []
      };

      const result = processor['handle'](input);

      expect(result.projects[0].priority).toBeNull();
      expect(result.projects[0].backtech).toBeUndefined();
      expect(result.projects[0].endDate).toBeNull();
    });

    it('should handle undefined values correctly', () => {
      const input = {
        name: 'Test',
        tasks: []
      };

      const result = processor['handle'](input);

      expect(result.projects[0].priority).toBeUndefined();
      expect(result.projects[0].backtech).toBeUndefined();
    });
  });

  describe('handle - Task normalization', () => {
    it('should normalize task with alternative field names', () => {
      const input = {
        name: 'Project',
        tasks: [
          {
            taskName: 'Task 1',
            description: 'Description',
            assigned_to: 'John',
            sprint: 1
          }
        ]
      };

      const result = processor['handle'](input);

      const task = result.projects[0].tasks[0];
      expect(task.name).toBe('Task 1');
      expect(task.description).toBe('Description');
      expect(task.assignedTo).toBe('John');
      expect(task.sprint).toBe(1);
    });

    it('should normalize task name from title field', () => {
      const input = {
        name: 'Project',
        tasks: [
          { title: 'Task Title', description: 'Desc' }
        ]
      };

      const result = processor['handle'](input);

      expect(result.projects[0].tasks[0].name).toBe('Task Title');
    });

    it('should convert sprint to number', () => {
      const input = {
        name: 'Project',
        tasks: [
          { name: 'Task 1', sprint: '2' },
          { name: 'Task 2', sprint: 3 }
        ]
      };

      const result = processor['handle'](input);

      expect(result.projects[0].tasks[0].sprint).toBe(2);
      expect(typeof result.projects[0].tasks[0].sprint).toBe('number');
      expect(result.projects[0].tasks[1].sprint).toBe(3);
    });

    it('should convert invalid sprint to null', () => {
      const input = {
        name: 'Project',
        tasks: [
          { name: 'Task 1', sprint: '' },
          { name: 'Task 2', sprint: null },
          { name: 'Task 3', sprint: 'invalid' },
          { name: 'Task 4', sprint: NaN }
        ]
      };

      const result = processor['handle'](input);

      expect(result.projects[0].tasks[0].sprint).toBeNull();
      expect(result.projects[0].tasks[1].sprint).toBeNull();
      expect(result.projects[0].tasks[2].sprint).toBeNull();
      expect(result.projects[0].tasks[3].sprint).toBeNull();
    });

    it('should handle tasks as empty array if missing', () => {
      const input = {
        name: 'Project'
      };

      const result = processor['handle'](input);

      expect(result.projects[0].tasks).toEqual([]);
    });

    it('should handle Tasks vs tasks field', () => {
      const input1 = { name: 'P1', Tasks: [{ name: 'T1' }] };
      const input2 = { name: 'P2', tasks: [{ name: 'T2' }] };

      const result1 = processor['handle'](input1);
      const result2 = processor['handle'](input2);

      expect(result1.projects[0].tasks[0].name).toBe('T1');
      expect(result2.projects[0].tasks[0].name).toBe('T2');
    });
  });

  describe('handle - Description handling', () => {
    it('should handle simple string description', () => {
      const input = {
        name: 'Project',
        tasks: [
          { name: 'Task', description: 'Simple description' }
        ]
      };

      const result = processor['handle'](input);

      expect(result.projects[0].tasks[0].description).toBe('Simple description');
    });

    it('should convert array description to bullet points', () => {
      const input = {
        name: 'Project',
        tasks: [
          { 
            name: 'Task', 
            description: ['Step 1', 'Step 2', 'Step 3']
          }
        ]
      };

      const result = processor['handle'](input);

      expect(result.projects[0].tasks[0].description).toContain('Step 1');
      expect(result.projects[0].tasks[0].description).toContain('Step 2');
      expect(result.projects[0].tasks[0].description).toContain('•');
    });

    it('should extract description from object with long field', () => {
      const input = {
        name: 'Project',
        tasks: [
          { 
            name: 'Task', 
            description: { long: 'Long description text' }
          }
        ]
      };

      const result = processor['handle'](input);

      expect(result.projects[0].tasks[0].description).toBe('Long description text');
    });

    it('should extract description from object with full field', () => {
      const input = {
        name: 'Project',
        tasks: [
          { 
            name: 'Task', 
            description: { full: 'Full description' }
          }
        ]
      };

      const result = processor['handle'](input);

      expect(result.projects[0].tasks[0].description).toBe('Full description');
    });

    it('should handle null description', () => {
      const input = {
        name: 'Project',
        tasks: [
          { name: 'Task', description: null }
        ]
      };

      const result = processor['handle'](input);

      expect(result.projects[0].tasks[0].description).toBeNull();
    });

    it('should truncate very long descriptions', () => {
      const longText = 'A'.repeat(5000);
      const input = {
        name: 'Project',
        tasks: [
          { name: 'Task', description: longText }
        ]
      };

      const result = processor['handle'](input);

      expect(result.projects[0].tasks[0].description?.length).toBeLessThanOrEqual(4000);
    });

    it('should collapse multiple whitespaces in description', () => {
      const input = {
        name: 'Project',
        tasks: [
          { name: 'Task', description: 'Text   with    multiple     spaces' }
        ]
      };

      const result = processor['handle'](input);

      expect(result.projects[0].tasks[0].description).toBe('Text with multiple spaces');
    });
  });

  describe('handle - Validation', () => {
    it('should throw error if project name is missing', () => {
      const input = {
        priority: 'high',
        tasks: []
      };

      expect(() => processor['handle'](input)).toThrow(BadRequestException);
      expect(() => processor['handle'](input)).toThrow('"name" es obligatorio');
    });

    it('should throw error if task name is missing', () => {
      const input = {
        name: 'Project',
        tasks: [
          { description: 'Task without name' }
        ]
      };

      expect(() => processor['handle'](input)).toThrow(BadRequestException);
      expect(() => processor['handle'](input)).toThrow('"name" es obligatorio');
    });

    it('should throw error for multiple projects with missing names', () => {
      const input = {
        projects: [
          { name: 'Project 1', tasks: [] },
          { priority: 'high', tasks: [] }
        ]
      };

      expect(() => processor['handle'](input)).toThrow(BadRequestException);
      expect(() => processor['handle'](input)).toThrow('Proyecto #2');
    });

    it('should throw error for task without name in specific project', () => {
      const input = {
        projects: [
          { 
            name: 'Project 1', 
            tasks: [
              { name: 'Valid Task' },
              { description: 'No name' }
            ]
          }
        ]
      };

      expect(() => processor['handle'](input)).toThrow(BadRequestException);
      expect(() => processor['handle'](input)).toThrow('Proyecto #1');
      expect(() => processor['handle'](input)).toThrow('tarea #2');
    });

    it('should throw error for unrecognized structure', () => {
      const input = null;

      expect(() => processor['handle'](input)).toThrow(BadRequestException);
      expect(() => processor['handle'](input)).toThrow('Estructura no reconocida');
    });

    it('should throw error for array without projects key', () => {
      const input = [];

      expect(() => processor['handle'](input)).toThrow(BadRequestException);
    });
  });

  describe('handle - Edge cases', () => {
    it('should handle empty tasks array', () => {
      const input = {
        name: 'Project',
        tasks: []
      };

      const result = processor['handle'](input);

      expect(result.projects[0].tasks).toEqual([]);
    });

    it('should handle project with all optional fields', () => {
      const input = {
        name: 'Minimal Project',
        priority: 'low',
        backtech: 'Node',
        fronttech: 'React',
        cloudTech: 'AWS',
        sprintsQuantity: 3,
        endDate: '2025-12-31',
        tasks: []
      };

      const result = processor['handle'](input);

      const project = result.projects[0];
      expect(project.name).toBe('Minimal Project');
      expect(project.priority).toBe('low');
      expect(project.backtech).toBe('Node');
      expect(project.fronttech).toBe('React');
      expect(project.cloudTech).toBe('AWS');
      expect(project.sprintsQuantity).toBe(3);
      expect(project.endDate).toBe('2025-12-31');
    });

    it('should preserve original data not defined in schema', () => {
      const input = {
        name: 'Project',
        customField: 'custom value',
        tasks: []
      };

      const result = processor['handle'](input);

      // Custom fields should be preserved
      expect((result.projects[0] as any).customField).toBe('custom value');
    });
  });

  describe('process - Chain of Responsibility', () => {
    it('should process and return normalized result when no next processor', async () => {
      const input = {
        name: 'Test Project',
        tasks: [{ name: 'Task 1' }]
      };

      const result = await processor.process(input);

      expect(result.isSingle).toBe(true);
      expect(result.projects).toHaveLength(1);
    });

    it('should pass normalized result to next processor if set', async () => {
      const mockNextProcessor = {
        process: jest.fn().mockResolvedValue({ persisted: true }),
        setNext: jest.fn(),
      };

      processor.setNext(mockNextProcessor);

      const input = { name: 'Test', tasks: [] };
      const result = await processor.process(input);

      expect(mockNextProcessor.process).toHaveBeenCalled();
      const calledWith = mockNextProcessor.process.mock.calls[0][0];
      expect(calledWith.isSingle).toBe(true);
      expect(calledWith.projects).toBeDefined();
      expect(result).toEqual({ persisted: true });
    });
  });
});