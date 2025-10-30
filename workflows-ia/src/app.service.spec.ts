import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHello', () => {
    it('should return an object with message property', () => {
      const result = service.getHello();

      expect(result).toHaveProperty('message');
      expect(typeof result).toBe('object');
    });

    it('should return "Hello World!" message', () => {
      const result = service.getHello();

      expect(result).toEqual({ message: 'Hello World!' });
    });

    it('should return consistent result on multiple calls', () => {
      const result1 = service.getHello();
      const result2 = service.getHello();

      expect(result1).toEqual(result2);
    });

    it('should return object with string message value', () => {
      const result = service.getHello();

      expect(typeof result.message).toBe('string');
    });

    it('should return exact message text', () => {
      const result = service.getHello();

      expect(result.message).toBe('Hello World!');
    });

    it('should not return null or undefined', () => {
      const result = service.getHello();

      expect(result).not.toBeNull();
      expect(result).not.toBeUndefined();
    });

    it('should return object with exactly one property', () => {
      const result = service.getHello();
      const keys = Object.keys(result);

      expect(keys).toHaveLength(1);
      expect(keys[0]).toBe('message');
    });

    it('should return a new object reference each time', () => {
      const result1 = service.getHello();
      const result2 = service.getHello();

      // Valores iguales pero referencias diferentes
      expect(result1).toEqual(result2);
      expect(result1).not.toBe(result2);
    });
  });

  describe('Service structure', () => {
    it('should have getHello method', () => {
      expect(service.getHello).toBeDefined();
      expect(typeof service.getHello).toBe('function');
    });

    it('should be decorated with @Injectable', () => {
      expect(service).toBeInstanceOf(AppService);
    });

    it('should not require parameters', () => {
      expect(() => service.getHello()).not.toThrow();
    });

    it('should have exactly one public method', () => {
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(service))
        .filter(name => name !== 'constructor' && typeof service[name] === 'function');

      expect(methods).toContain('getHello');
    });
  });

  describe('Return value properties', () => {
    it('should return plain object (not instance)', () => {
      const result = service.getHello();

      expect(result.constructor).toBe(Object);
    });

    it('should return serializable object', () => {
      const result = service.getHello();
      const serialized = JSON.stringify(result);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toEqual(result);
    });

    it('should not include additional properties', () => {
      const result = service.getHello();

      expect(Object.keys(result)).toEqual(['message']);
    });

    it('should return immutable-like result', () => {
      const result = service.getHello();
      const originalMessage = result.message;

      // Intentar modificar (aunque JS permite esto)
      result.message = 'Changed';

      // Llamar de nuevo para obtener resultado fresco
      const newResult = service.getHello();

      expect(newResult.message).toBe(originalMessage);
      expect(newResult.message).not.toBe('Changed');
    });
  });

  describe('Edge cases', () => {
    it('should work after multiple instantiations', async () => {
      const module1 = await Test.createTestingModule({
        providers: [AppService],
      }).compile();

      const module2 = await Test.createTestingModule({
        providers: [AppService],
      }).compile();

      const service1 = module1.get<AppService>(AppService);
      const service2 = module2.get<AppService>(AppService);

      expect(service1.getHello()).toEqual(service2.getHello());
    });

    it('should handle rapid successive calls', () => {
      const results = [];
      for (let i = 0; i < 100; i++) {
        results.push(service.getHello());
      }

      // Todos deberían tener el mismo valor
      results.forEach(result => {
        expect(result).toEqual({ message: 'Hello World!' });
      });
    });

    it('should not mutate internal state', () => {
      const result1 = service.getHello();
      result1.message = 'Modified';

      const result2 = service.getHello();

      expect(result2.message).toBe('Hello World!');
    });
  });

  describe('Type safety', () => {
    it('should return object matching expected interface', () => {
      const result = service.getHello();

      interface ExpectedResponse {
        message: string;
      }

      const isValidResponse = (obj: any): obj is ExpectedResponse => {
        return obj && typeof obj.message === 'string';
      };

      expect(isValidResponse(result)).toBe(true);
    });

    it('should not return array', () => {
      const result = service.getHello();

      expect(Array.isArray(result)).toBe(false);
    });

    it('should not return primitive', () => {
      const result = service.getHello();

      expect(typeof result).toBe('object');
      expect(result).not.toBeNull();
    });
  });

  describe('Message content', () => {
    it('should include "Hello" in message', () => {
      const result = service.getHello();

      expect(result.message).toContain('Hello');
    });

    it('should include "World" in message', () => {
      const result = service.getHello();

      expect(result.message).toContain('World');
    });

    it('should have exclamation mark in message', () => {
      const result = service.getHello();

      expect(result.message).toContain('!');
    });

    it('should have correct capitalization', () => {
      const result = service.getHello();

      expect(result.message).toMatch(/^Hello/);
      expect(result.message).toMatch(/World/);
    });

    it('should not have extra whitespace', () => {
      const result = service.getHello();

      expect(result.message).not.toMatch(/\s{2,}/);
      expect(result.message.trim()).toBe(result.message);
    });
  });

  describe('Performance', () => {
    it('should execute quickly', () => {
      const start = Date.now();
      service.getHello();
      const end = Date.now();

      expect(end - start).toBeLessThan(10); // Menos de 10ms
    });

    it('should handle concurrent calls', async () => {
      const promises = Array(10).fill(null).map(() => 
        Promise.resolve(service.getHello())
      );

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result).toEqual({ message: 'Hello World!' });
      });
    });
  });

  describe('Integration with NestJS', () => {
    it('should be injectable', async () => {
      const module = await Test.createTestingModule({
        providers: [AppService],
      }).compile();

      const injectedService = module.get<AppService>(AppService);

      expect(injectedService).toBeDefined();
      expect(injectedService).toBeInstanceOf(AppService);
    });

    it('should work in application context', async () => {
      const module = await Test.createTestingModule({
        providers: [AppService],
      }).compile();

      const app = module.createNestApplication();
      await app.init();

      const service = app.get<AppService>(AppService);
      const result = service.getHello();

      expect(result).toEqual({ message: 'Hello World!' });

      await app.close();
    });
  });
});