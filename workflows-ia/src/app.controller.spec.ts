import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  const mockAppService = {
    getHello: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(appController).toBeDefined();
  });

  describe('getHello', () => {
    it('should return message object from service', () => {
      const expectedResult = { message: 'Hello World!' };
      mockAppService.getHello.mockReturnValue(expectedResult);

      const result = appController.getHello();

      expect(result).toEqual(expectedResult);
      expect(appService.getHello).toHaveBeenCalled();
    });

    it('should call appService.getHello once', () => {
      mockAppService.getHello.mockReturnValue({ message: 'Hello World!' });

      appController.getHello();

      expect(appService.getHello).toHaveBeenCalledTimes(1);
    });

    it('should return object with message property', () => {
      const expectedResult = { message: 'Hello World!' };
      mockAppService.getHello.mockReturnValue(expectedResult);

      const result = appController.getHello();

      expect(result).toHaveProperty('message');
      expect(typeof result.message).toBe('string');
    });

    it('should delegate to service without modification', () => {
      const serviceResponse = { message: 'Hello World!' };
      mockAppService.getHello.mockReturnValue(serviceResponse);

      const controllerResponse = appController.getHello();

      expect(controllerResponse).toBe(serviceResponse);
    });

    it('should handle different service responses', () => {
      const customResponse = { message: 'Custom message' };
      mockAppService.getHello.mockReturnValue(customResponse);

      const result = appController.getHello();

      expect(result).toEqual(customResponse);
      expect(result.message).toBe('Custom message');
    });

    it('should not modify service response', () => {
      const originalResponse = { message: 'Hello World!' };
      mockAppService.getHello.mockReturnValue(originalResponse);

      const result = appController.getHello();

      expect(result).toStrictEqual(originalResponse);
    });
  });

  describe('Controller structure', () => {
    it('should have getHello method', () => {
      expect(appController.getHello).toBeDefined();
      expect(typeof appController.getHello).toBe('function');
    });

    it('should inject AppService', () => {
      expect(appService).toBeDefined();
    });

    it('should be decorated with @Controller', () => {
      const metadata = Reflect.getMetadata('path', AppController);
      expect(metadata).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should propagate service errors', () => {
      const error = new Error('Service error');
      mockAppService.getHello.mockImplementation(() => {
        throw error;
      });

      expect(() => appController.getHello()).toThrow('Service error');
    });

    it('should not catch service exceptions', () => {
      mockAppService.getHello.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      expect(() => appController.getHello()).toThrow();
    });
  });

  describe('Integration', () => {
    it('should work with real AppService', async () => {
      const moduleWithRealService: TestingModule = await Test.createTestingModule({
        controllers: [AppController],
        providers: [AppService],
      }).compile();

      const controller = moduleWithRealService.get<AppController>(AppController);
      const result = controller.getHello();

      expect(result).toEqual({ message: 'Hello World!' });
    });
  });

  describe('HTTP method mapping', () => {
    it('should map to GET request', () => {
      // Verificar que getHello está mapeado a GET
      const metadata = Reflect.getMetadata('method', appController.getHello);
      expect(metadata).toBeDefined();
    });

    it('should be accessible at root path', () => {
      const controllerPath = Reflect.getMetadata('path', AppController);
      expect(controllerPath).toBeDefined();
    });
  });

  describe('Response format', () => {
    it('should always return an object', () => {
      mockAppService.getHello.mockReturnValue({ message: 'Hello World!' });

      const result = appController.getHello();

      expect(typeof result).toBe('object');
      expect(result).not.toBeNull();
    });

    it('should return object with string message', () => {
      mockAppService.getHello.mockReturnValue({ message: 'Hello World!' });

      const result = appController.getHello();

      expect(typeof result.message).toBe('string');
    });
  });
});