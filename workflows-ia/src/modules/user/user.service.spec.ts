import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UserService', () => {
  let service: UserService;
  let mockUserRepository: any;

  beforeEach(async () => {
    // Mock User Repository
    mockUserRepository = {
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should call seedUsers on module initialization', async () => {
      const seedUsersSpy = jest.spyOn(service as any, 'seedUsers');
      mockUserRepository.count.mockResolvedValue(0);
      mockUserRepository.create.mockImplementation((data) => data);
      mockUserRepository.save.mockResolvedValue({});

      await service.onModuleInit();

      expect(seedUsersSpy).toHaveBeenCalled();
    });
  });

  describe('seedUsers (private method)', () => {
    let consoleLogSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should seed initial users when database is empty', async () => {
      mockUserRepository.count.mockResolvedValue(0);
      mockUserRepository.create.mockImplementation((data) => data);
      mockUserRepository.save.mockResolvedValue({});

      await service.onModuleInit();

      expect(mockUserRepository.count).toHaveBeenCalled();
      expect(mockUserRepository.create).toHaveBeenCalledTimes(2);
      expect(mockUserRepository.save).toHaveBeenCalledTimes(2);
      expect(consoleLogSpy).toHaveBeenCalledWith('No users found. Seeding initial users...');
    });

    it('should create admin user with correct data', async () => {
      mockUserRepository.count.mockResolvedValue(0);
      mockUserRepository.create.mockImplementation((data) => data);
      mockUserRepository.save.mockResolvedValue({});

      await service.onModuleInit();

      const adminUserCall = mockUserRepository.create.mock.calls[0][0];
      expect(adminUserCall.name).toBe('admin');
      expect(adminUserCall.email).toBe('admin@workflows-ia.com');
      expect(adminUserCall.fullName).toBe('Administrator');
      expect(adminUserCall.password).toBe('admin123');
      expect(adminUserCall.lastLogin).toBeNull();
      expect(adminUserCall.token).toBe('');
    });

    it('should create developer user with correct data', async () => {
      mockUserRepository.count.mockResolvedValue(0);
      mockUserRepository.create.mockImplementation((data) => data);
      mockUserRepository.save.mockResolvedValue({});

      await service.onModuleInit();

      const developerUserCall = mockUserRepository.create.mock.calls[1][0];
      expect(developerUserCall.name).toBe('developer');
      expect(developerUserCall.email).toBe('developer@workflows-ia.com');
      expect(developerUserCall.fullName).toBe('Developer User');
      expect(developerUserCall.password).toBe('dev123');
      expect(developerUserCall.lastLogin).toBeNull();
      expect(developerUserCall.token).toBe('');
    });

    it('should set createdAt timestamp for seeded users', async () => {
      mockUserRepository.count.mockResolvedValue(0);
      mockUserRepository.create.mockImplementation((data) => data);
      mockUserRepository.save.mockResolvedValue({});

      await service.onModuleInit();

      const adminUserCall = mockUserRepository.create.mock.calls[0][0];
      expect(adminUserCall.createdAt).toBeDefined();
      expect(typeof adminUserCall.createdAt).toBe('string');
    });

    it('should skip seeding if users already exist', async () => {
      mockUserRepository.count.mockResolvedValue(5);

      await service.onModuleInit();

      expect(mockUserRepository.count).toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('Found 5 existing users. Skipping seeding.');
    });

    it('should log success message after seeding', async () => {
      mockUserRepository.count.mockResolvedValue(0);
      mockUserRepository.create.mockImplementation((data) => data);
      mockUserRepository.save.mockResolvedValue({});

      await service.onModuleInit();

      expect(consoleLogSpy).toHaveBeenCalledWith('Initial users seeded successfully!');
    });

    it('should log each user creation', async () => {
      mockUserRepository.count.mockResolvedValue(0);
      mockUserRepository.create.mockImplementation((data) => data);
      mockUserRepository.save.mockResolvedValue({});

      await service.onModuleInit();

      expect(consoleLogSpy).toHaveBeenCalledWith('Created user: admin (admin@workflows-ia.com)');
      expect(consoleLogSpy).toHaveBeenCalledWith('Created user: developer (developer@workflows-ia.com)');
    });

    it('should handle errors during seeding gracefully', async () => {
      const error = new Error('Database connection failed');
      mockUserRepository.count.mockRejectedValue(error);

      await service.onModuleInit();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error seeding users:', error);
    });

    it('should handle errors during user creation', async () => {
      const error = new Error('Failed to create user');
      mockUserRepository.count.mockResolvedValue(0);
      mockUserRepository.create.mockImplementation((data) => data);
      mockUserRepository.save.mockRejectedValue(error);

      await service.onModuleInit();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error seeding users:', error);
    });

    it('should not throw error if seeding fails', async () => {
      mockUserRepository.count.mockRejectedValue(new Error('DB Error'));

      await expect(service.onModuleInit()).resolves.not.toThrow();
    });

    it('should seed users in correct order', async () => {
      mockUserRepository.count.mockResolvedValue(0);
      mockUserRepository.create.mockImplementation((data) => data);
      mockUserRepository.save.mockResolvedValue({});

      await service.onModuleInit();

      const firstUserCall = mockUserRepository.create.mock.calls[0][0];
      const secondUserCall = mockUserRepository.create.mock.calls[1][0];

      expect(firstUserCall.name).toBe('admin');
      expect(secondUserCall.name).toBe('developer');
    });
  });

  describe('create', () => {
    it('should return placeholder message', () => {
      const createDto: CreateUserDto = {};

      const result = service.create(createDto);

      expect(result).toBe('This action adds a new user');
    });

    it('should accept CreateUserDto parameter', () => {
      const createDto: CreateUserDto = {};

      expect(() => service.create(createDto)).not.toThrow();
    });
  });

  describe('findAll', () => {
    it('should return placeholder message', () => {
      const result = service.findAll();

      expect(result).toBe('This action returns all user');
    });

    it('should not require parameters', () => {
      expect(() => service.findAll()).not.toThrow();
    });
  });

  describe('findOne', () => {
    it('should return placeholder message with id', () => {
      const id = 1;

      const result = service.findOne(id);

      expect(result).toBe('This action returns a #1 user');
    });

    it('should handle different id values', () => {
      expect(service.findOne(1)).toBe('This action returns a #1 user');
      expect(service.findOne(999)).toBe('This action returns a #999 user');
      expect(service.findOne(0)).toBe('This action returns a #0 user');
    });

    it('should accept numeric id parameter', () => {
      expect(() => service.findOne(123)).not.toThrow();
    });
  });

  describe('update', () => {
    it('should return placeholder message with id', () => {
      const id = 1;
      const updateDto: UpdateUserDto = {};

      const result = service.update(id, updateDto);

      expect(result).toBe('This action updates a #1 user');
    });

    it('should handle different id values', () => {
      const updateDto: UpdateUserDto = {};

      expect(service.update(1, updateDto)).toBe('This action updates a #1 user');
      expect(service.update(456, updateDto)).toBe('This action updates a #456 user');
    });

    it('should accept UpdateUserDto parameter', () => {
      const updateDto: UpdateUserDto = {};

      expect(() => service.update(1, updateDto)).not.toThrow();
    });
  });

  describe('remove', () => {
    it('should return placeholder message with id', () => {
      const id = 1;

      const result = service.remove(id);

      expect(result).toBe('This action removes a #1 user');
    });

    it('should handle different id values', () => {
      expect(service.remove(1)).toBe('This action removes a #1 user');
      expect(service.remove(789)).toBe('This action removes a #789 user');
    });

    it('should accept numeric id parameter', () => {
      expect(() => service.remove(999)).not.toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle negative id values', () => {
      expect(service.findOne(-1)).toBe('This action returns a #-1 user');
      expect(service.update(-5, {})).toBe('This action updates a #-5 user');
      expect(service.remove(-10)).toBe('This action removes a #-10 user');
    });

    it('should handle very large id values', () => {
      const largeId = 999999999;
      expect(service.findOne(largeId)).toContain(`#${largeId}`);
    });

    it('should handle empty UpdateUserDto', () => {
      const emptyDto: UpdateUserDto = {};
      expect(() => service.update(1, emptyDto)).not.toThrow();
    });

    it('should handle empty CreateUserDto', () => {
      const emptyDto: CreateUserDto = {};
      expect(() => service.create(emptyDto)).not.toThrow();
    });
  });

  describe('Integration scenarios', () => {
    it('should initialize service and seed users on startup', async () => {
      mockUserRepository.count.mockResolvedValue(0);
      mockUserRepository.create.mockImplementation((data) => data);
      mockUserRepository.save.mockResolvedValue({});

      await service.onModuleInit();

      expect(mockUserRepository.count).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple initialization calls', async () => {
      mockUserRepository.count.mockResolvedValue(2);

      await service.onModuleInit();
      await service.onModuleInit();

      expect(mockUserRepository.count).toHaveBeenCalledTimes(2);
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('Database interaction', () => {
    it('should use user repository for counting', async () => {
      mockUserRepository.count.mockResolvedValue(0);
      mockUserRepository.create.mockImplementation((data) => data);
      mockUserRepository.save.mockResolvedValue({});

      await service.onModuleInit();

      expect(mockUserRepository.count).toHaveBeenCalledWith();
    });

    it('should use repository create method', async () => {
      mockUserRepository.count.mockResolvedValue(0);
      mockUserRepository.create.mockImplementation((data) => data);
      mockUserRepository.save.mockResolvedValue({});

      await service.onModuleInit();

      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.any(String),
          email: expect.any(String),
        })
      );
    });

    it('should use repository save method', async () => {
      mockUserRepository.count.mockResolvedValue(0);
      const mockUser = { id: '1', name: 'admin' };
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      await service.onModuleInit();

      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('Seeding data validation', () => {
    it('should seed users with valid email format', async () => {
      mockUserRepository.count.mockResolvedValue(0);
      mockUserRepository.create.mockImplementation((data) => data);
      mockUserRepository.save.mockResolvedValue({});

      await service.onModuleInit();

      const adminCall = mockUserRepository.create.mock.calls[0][0];
      const devCall = mockUserRepository.create.mock.calls[1][0];

      expect(adminCall.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(devCall.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    it('should seed users with non-empty passwords', async () => {
      mockUserRepository.count.mockResolvedValue(0);
      mockUserRepository.create.mockImplementation((data) => data);
      mockUserRepository.save.mockResolvedValue({});

      await service.onModuleInit();

      const adminCall = mockUserRepository.create.mock.calls[0][0];
      const devCall = mockUserRepository.create.mock.calls[1][0];

      expect(adminCall.password).toBeTruthy();
      expect(adminCall.password.length).toBeGreaterThan(0);
      expect(devCall.password).toBeTruthy();
      expect(devCall.password.length).toBeGreaterThan(0);
    });

    it('should seed users with proper initial state', async () => {
      mockUserRepository.count.mockResolvedValue(0);
      mockUserRepository.create.mockImplementation((data) => data);
      mockUserRepository.save.mockResolvedValue({});

      await service.onModuleInit();

      const adminCall = mockUserRepository.create.mock.calls[0][0];

      expect(adminCall.lastLogin).toBeNull();
      expect(adminCall.token).toBe('');
      expect(adminCall.createdAt).toBeDefined();
    });

    it('should seed exactly 2 users', async () => {
      mockUserRepository.count.mockResolvedValue(0);
      mockUserRepository.create.mockImplementation((data) => data);
      mockUserRepository.save.mockResolvedValue({});

      await service.onModuleInit();

      expect(mockUserRepository.create).toHaveBeenCalledTimes(2);
      expect(mockUserRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should seed users with unique emails', async () => {
      mockUserRepository.count.mockResolvedValue(0);
      mockUserRepository.create.mockImplementation((data) => data);
      mockUserRepository.save.mockResolvedValue({});

      await service.onModuleInit();

      const adminEmail = mockUserRepository.create.mock.calls[0][0].email;
      const devEmail = mockUserRepository.create.mock.calls[1][0].email;

      expect(adminEmail).not.toBe(devEmail);
    });

    it('should seed users with unique names', async () => {
      mockUserRepository.count.mockResolvedValue(0);
      mockUserRepository.create.mockImplementation((data) => data);
      mockUserRepository.save.mockResolvedValue({});

      await service.onModuleInit();

      const adminName = mockUserRepository.create.mock.calls[0][0].name;
      const devName = mockUserRepository.create.mock.calls[1][0].name;

      expect(adminName).not.toBe(devName);
    });
  });
});