import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockUserService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    onModuleInit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with CreateUserDto', () => {
      const createDto: CreateUserDto = {};
      const expectedResult = 'This action adds a new user';

      mockUserService.create.mockReturnValue(expectedResult);

      const result = controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toBe(expectedResult);
    });

    it('should return the result from service', () => {
      const createDto: CreateUserDto = {};
      const serviceResponse = 'This action adds a new user';

      mockUserService.create.mockReturnValue(serviceResponse);

      const result = controller.create(createDto);

      expect(result).toBe(serviceResponse);
    });

    it('should handle empty CreateUserDto', () => {
      const emptyDto: CreateUserDto = {};

      mockUserService.create.mockReturnValue('This action adds a new user');

      expect(() => controller.create(emptyDto)).not.toThrow();
    });

    it('should pass DTO to service without modification', () => {
      const createDto: CreateUserDto = {};

      controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll', () => {
      const expectedResult = 'This action returns all user';

      mockUserService.findAll.mockReturnValue(expectedResult);

      const result = controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toBe(expectedResult);
    });

    it('should return the result from service', () => {
      const serviceResponse = 'This action returns all user';

      mockUserService.findAll.mockReturnValue(serviceResponse);

      const result = controller.findAll();

      expect(result).toBe(serviceResponse);
    });

    it('should not require parameters', () => {
      mockUserService.findAll.mockReturnValue('This action returns all user');

      expect(() => controller.findAll()).not.toThrow();
    });

    it('should call service.findAll only once', () => {
      mockUserService.findAll.mockReturnValue('This action returns all user');

      controller.findAll();

      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with numeric id', () => {
      const id = '1';
      const expectedResult = 'This action returns a #1 user';

      mockUserService.findOne.mockReturnValue(expectedResult);

      const result = controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toBe(expectedResult);
    });

    it('should convert string id to number', () => {
      const id = '42';

      mockUserService.findOne.mockReturnValue('This action returns a #42 user');

      controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(42);
    });

    it('should handle different id values', () => {
      mockUserService.findOne.mockImplementation((id) => `This action returns a #${id} user`);

      expect(controller.findOne('1')).toBe('This action returns a #1 user');
      expect(controller.findOne('999')).toBe('This action returns a #999 user');
      expect(controller.findOne('0')).toBe('This action returns a #0 user');
    });

    it('should return the result from service', () => {
      const id = '123';
      const serviceResponse = 'This action returns a #123 user';

      mockUserService.findOne.mockReturnValue(serviceResponse);

      const result = controller.findOne(id);

      expect(result).toBe(serviceResponse);
    });

    it('should handle negative id strings', () => {
      const id = '-1';

      mockUserService.findOne.mockReturnValue('This action returns a #-1 user');

      controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(-1);
    });

    it('should convert numeric strings correctly', () => {
      mockUserService.findOne.mockReturnValue('result');

      controller.findOne('100');
      expect(service.findOne).toHaveBeenCalledWith(100);

      controller.findOne('0');
      expect(service.findOne).toHaveBeenCalledWith(0);
    });
  });

  describe('update', () => {
    it('should call service.update with numeric id and UpdateUserDto', () => {
      const id = '1';
      const updateDto: UpdateUserDto = {};
      const expectedResult = 'This action updates a #1 user';

      mockUserService.update.mockReturnValue(expectedResult);

      const result = controller.update(id, updateDto);

      expect(service.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toBe(expectedResult);
    });

    it('should convert string id to number', () => {
      const id = '42';
      const updateDto: UpdateUserDto = {};

      mockUserService.update.mockReturnValue('This action updates a #42 user');

      controller.update(id, updateDto);

      expect(service.update).toHaveBeenCalledWith(42, updateDto);
    });

    it('should handle different id values', () => {
      const updateDto: UpdateUserDto = {};
      mockUserService.update.mockImplementation((id) => `This action updates a #${id} user`);

      expect(controller.update('1', updateDto)).toBe('This action updates a #1 user');
      expect(controller.update('456', updateDto)).toBe('This action updates a #456 user');
    });

    it('should return the result from service', () => {
      const id = '789';
      const updateDto: UpdateUserDto = {};
      const serviceResponse = 'This action updates a #789 user';

      mockUserService.update.mockReturnValue(serviceResponse);

      const result = controller.update(id, updateDto);

      expect(result).toBe(serviceResponse);
    });

    it('should handle empty UpdateUserDto', () => {
      const id = '1';
      const emptyDto: UpdateUserDto = {};

      mockUserService.update.mockReturnValue('This action updates a #1 user');

      expect(() => controller.update(id, emptyDto)).not.toThrow();
    });

    it('should pass both parameters to service', () => {
      const id = '50';
      const updateDto: UpdateUserDto = {};

      mockUserService.update.mockReturnValue('result');

      controller.update(id, updateDto);

      expect(service.update).toHaveBeenCalledWith(50, updateDto);
      expect(service.update).toHaveBeenCalledTimes(1);
    });

    it('should handle negative id strings', () => {
      const id = '-5';
      const updateDto: UpdateUserDto = {};

      mockUserService.update.mockReturnValue('result');

      controller.update(id, updateDto);

      expect(service.update).toHaveBeenCalledWith(-5, updateDto);
    });
  });

  describe('remove', () => {
    it('should call service.remove with numeric id', () => {
      const id = '1';
      const expectedResult = 'This action removes a #1 user';

      mockUserService.remove.mockReturnValue(expectedResult);

      const result = controller.remove(id);

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toBe(expectedResult);
    });

    it('should convert string id to number', () => {
      const id = '42';

      mockUserService.remove.mockReturnValue('This action removes a #42 user');

      controller.remove(id);

      expect(service.remove).toHaveBeenCalledWith(42);
    });

    it('should handle different id values', () => {
      mockUserService.remove.mockImplementation((id) => `This action removes a #${id} user`);

      expect(controller.remove('1')).toBe('This action removes a #1 user');
      expect(controller.remove('789')).toBe('This action removes a #789 user');
    });

    it('should return the result from service', () => {
      const id = '999';
      const serviceResponse = 'This action removes a #999 user';

      mockUserService.remove.mockReturnValue(serviceResponse);

      const result = controller.remove(id);

      expect(result).toBe(serviceResponse);
    });

    it('should handle negative id strings', () => {
      const id = '-10';

      mockUserService.remove.mockReturnValue('result');

      controller.remove(id);

      expect(service.remove).toHaveBeenCalledWith(-10);
    });

    it('should call service.remove only once', () => {
      const id = '100';

      mockUserService.remove.mockReturnValue('result');

      controller.remove(id);

      expect(service.remove).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle very large numeric id strings', () => {
      const largeId = '999999999';

      mockUserService.findOne.mockReturnValue('result');

      controller.findOne(largeId);

      expect(service.findOne).toHaveBeenCalledWith(999999999);
    });

    it('should handle zero as id', () => {
      mockUserService.findOne.mockReturnValue('result');
      mockUserService.update.mockReturnValue('result');
      mockUserService.remove.mockReturnValue('result');

      controller.findOne('0');
      expect(service.findOne).toHaveBeenCalledWith(0);

      controller.update('0', {});
      expect(service.update).toHaveBeenCalledWith(0, {});

      controller.remove('0');
      expect(service.remove).toHaveBeenCalledWith(0);
    });

    it('should handle string id conversion for all methods', () => {
      mockUserService.findOne.mockReturnValue('result');
      mockUserService.update.mockReturnValue('result');
      mockUserService.remove.mockReturnValue('result');

      controller.findOne('123');
      expect(service.findOne).toHaveBeenCalledWith(123);

      controller.update('456', {});
      expect(service.update).toHaveBeenCalledWith(456, {});

      controller.remove('789');
      expect(service.remove).toHaveBeenCalledWith(789);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete CRUD workflow through controller', () => {
      const createDto: CreateUserDto = {};
      const updateDto: UpdateUserDto = {};

      // Create
      mockUserService.create.mockReturnValue('This action adds a new user');
      controller.create(createDto);
      expect(service.create).toHaveBeenCalledWith(createDto);

      // FindAll
      mockUserService.findAll.mockReturnValue('This action returns all user');
      controller.findAll();
      expect(service.findAll).toHaveBeenCalled();

      // FindOne
      mockUserService.findOne.mockReturnValue('This action returns a #1 user');
      controller.findOne('1');
      expect(service.findOne).toHaveBeenCalledWith(1);

      // Update
      mockUserService.update.mockReturnValue('This action updates a #1 user');
      controller.update('1', updateDto);
      expect(service.update).toHaveBeenCalledWith(1, updateDto);

      // Remove
      mockUserService.remove.mockReturnValue('This action removes a #1 user');
      controller.remove('1');
      expect(service.remove).toHaveBeenCalledWith(1);

      // Verify all methods were called
      expect(service.create).toHaveBeenCalled();
      expect(service.findAll).toHaveBeenCalled();
      expect(service.findOne).toHaveBeenCalled();
      expect(service.update).toHaveBeenCalled();
      expect(service.remove).toHaveBeenCalled();
    });

    it('should delegate all operations to service', () => {
      mockUserService.create.mockReturnValue('created');
      mockUserService.findAll.mockReturnValue('all');
      mockUserService.findOne.mockReturnValue('one');
      mockUserService.update.mockReturnValue('updated');
      mockUserService.remove.mockReturnValue('removed');

      expect(controller.create({})).toBe('created');
      expect(controller.findAll()).toBe('all');
      expect(controller.findOne('1')).toBe('one');
      expect(controller.update('1', {})).toBe('updated');
      expect(controller.remove('1')).toBe('removed');
    });
  });

  describe('Service method invocation', () => {
    it('should only invoke service methods without additional logic', () => {
      mockUserService.create.mockReturnValue('result');

      const createDto: CreateUserDto = {};
      controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });

    it('should pass through service responses unchanged', () => {
      const responses = [
        'This action adds a new user',
        'This action returns all user',
        'This action returns a #1 user',
        'This action updates a #1 user',
        'This action removes a #1 user',
      ];

      mockUserService.create.mockReturnValue(responses[0]);
      mockUserService.findAll.mockReturnValue(responses[1]);
      mockUserService.findOne.mockReturnValue(responses[2]);
      mockUserService.update.mockReturnValue(responses[3]);
      mockUserService.remove.mockReturnValue(responses[4]);

      expect(controller.create({})).toBe(responses[0]);
      expect(controller.findAll()).toBe(responses[1]);
      expect(controller.findOne('1')).toBe(responses[2]);
      expect(controller.update('1', {})).toBe(responses[3]);
      expect(controller.remove('1')).toBe(responses[4]);
    });
  });

  describe('Parameter handling', () => {
    it('should correctly convert id parameter in all applicable methods', () => {
      const id = '42';

      mockUserService.findOne.mockReturnValue('result');
      mockUserService.update.mockReturnValue('result');
      mockUserService.remove.mockReturnValue('result');

      controller.findOne(id);
      controller.update(id, {});
      controller.remove(id);

      expect(service.findOne).toHaveBeenCalledWith(42);
      expect(service.update).toHaveBeenCalledWith(42, {});
      expect(service.remove).toHaveBeenCalledWith(42);
    });

    it('should handle DTO parameters correctly', () => {
      const createDto: CreateUserDto = {};
      const updateDto: UpdateUserDto = {};

      mockUserService.create.mockReturnValue('result');
      mockUserService.update.mockReturnValue('result');

      controller.create(createDto);
      controller.update('1', updateDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(service.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('HTTP method correspondence', () => {
    it('should map POST to create method', () => {
      mockUserService.create.mockReturnValue('created');

      const result = controller.create({});

      expect(result).toBe('created');
      expect(service.create).toHaveBeenCalled();
    });

    it('should map GET to findAll method', () => {
      mockUserService.findAll.mockReturnValue('all users');

      const result = controller.findAll();

      expect(result).toBe('all users');
      expect(service.findAll).toHaveBeenCalled();
    });

    it('should map GET :id to findOne method', () => {
      mockUserService.findOne.mockReturnValue('one user');

      const result = controller.findOne('1');

      expect(result).toBe('one user');
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should map PATCH :id to update method', () => {
      mockUserService.update.mockReturnValue('updated');

      const result = controller.update('1', {});

      expect(result).toBe('updated');
      expect(service.update).toHaveBeenCalledWith(1, {});
    });

    it('should map DELETE :id to remove method', () => {
      mockUserService.remove.mockReturnValue('removed');

      const result = controller.remove('1');

      expect(result).toBe('removed');
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});