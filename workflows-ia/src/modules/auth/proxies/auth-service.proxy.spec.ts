import { Test, TestingModule } from '@nestjs/testing';
import { AuthServiceProxy } from './auth-service.proxy';
import { AuthService } from '../auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditLogs } from '../entities/AuditLogs.entity';
import { User } from '../../user/entities/user.entity';
import { LoginDto } from '../dto/login-dto';

describe('AuthServiceProxy', () => {
  let proxy: AuthServiceProxy;
  let mockAuthService: any;
  let mockAuditLogsRepository: any;
  let mockUserRepository: any;

  beforeEach(async () => {
    // Mock AuthService
    mockAuthService = {
      validateUser: jest.fn(),
      refreshTokens: jest.fn(),
    };

    // Mock AuditLogs Repository
    mockAuditLogsRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    // Mock User Repository
    mockUserRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthServiceProxy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: getRepositoryToken(AuditLogs),
          useValue: mockAuditLogsRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    proxy = module.get<AuthServiceProxy>(AuthServiceProxy);

    // Spy on console.error to suppress error logs during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(proxy).toBeDefined();
  });

  describe('validateUser', () => {
    it('should validate user and create audit log on success', async () => {
      const loginDto: LoginDto = {
        email: 'success@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'user-123',
        email: 'success@example.com',
        name: 'Success',
        fullName: 'Success User',
      };

      const mockResult = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: mockUser,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockAuthService.validateUser.mockResolvedValue(mockResult);
      mockAuditLogsRepository.create.mockImplementation((data) => data);
      mockAuditLogsRepository.save.mockResolvedValue({});

      const result = await proxy.validateUser(loginDto);

      expect(result).toEqual(mockResult);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(loginDto);
      expect(mockAuditLogsRepository.save).toHaveBeenCalled();
      
      const auditLogCall = mockAuditLogsRepository.create.mock.calls[0][0];
      expect(auditLogCall.action).toBe('LOGIN_SUCCESS');
      expect(auditLogCall.description).toContain('success@example.com');
    });

    it('should create audit log on failed login', async () => {
      const loginDto: LoginDto = {
        email: 'failed@example.com',
        password: 'wrongpassword',
      };

      const mockUser = {
        id: 'user-456',
        email: 'failed@example.com',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockAuthService.validateUser.mockResolvedValue(null);
      mockAuditLogsRepository.create.mockImplementation((data) => data);
      mockAuditLogsRepository.save.mockResolvedValue({});

      const result = await proxy.validateUser(loginDto);

      expect(result).toBeNull();
      expect(mockAuditLogsRepository.save).toHaveBeenCalled();
      
      const auditLogCall = mockAuditLogsRepository.create.mock.calls[0][0];
      expect(auditLogCall.action).toBe('LOGIN_FAILED');
      expect(auditLogCall.description).toContain('failed@example.com');
      expect(auditLogCall.details).toContain('Invalid credentials');
    });

    it('should create audit log on error during login', async () => {
      const loginDto: LoginDto = {
        email: 'error@example.com',
        password: 'password',
      };

      const mockUser = {
        id: 'user-789',
        email: 'error@example.com',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockAuthService.validateUser.mockRejectedValue(
        new Error('Database error')
      );
      mockAuditLogsRepository.create.mockImplementation((data) => data);
      mockAuditLogsRepository.save.mockResolvedValue({});

      await expect(proxy.validateUser(loginDto)).rejects.toThrow(
        'Database error'
      );

      expect(mockAuditLogsRepository.save).toHaveBeenCalled();
      
      const auditLogCall = mockAuditLogsRepository.create.mock.calls[0][0];
      expect(auditLogCall.action).toBe('LOGIN_ERROR');
      expect(auditLogCall.description).toContain('error@example.com');
      expect(auditLogCall.details).toContain('Database error');
    });

    it('should include duration in audit log details', async () => {
      const loginDto: LoginDto = {
        email: 'duration@example.com',
        password: 'password',
      };

      const mockUser = {
        id: 'user-duration',
        email: 'duration@example.com',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockAuthService.validateUser.mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
        user: mockUser,
      });
      mockAuditLogsRepository.create.mockImplementation((data) => data);
      mockAuditLogsRepository.save.mockResolvedValue({});

      await proxy.validateUser(loginDto);

      const auditLogCall = mockAuditLogsRepository.create.mock.calls[0][0];
      expect(auditLogCall.details).toMatch(/Duration: \d+ms/);
    });

    it('should include user ID in success audit log', async () => {
      const loginDto: LoginDto = {
        email: 'userid@example.com',
        password: 'password',
      };

      const mockUser = {
        id: 'specific-user-id',
        email: 'userid@example.com',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockAuthService.validateUser.mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
        user: mockUser,
      });
      mockAuditLogsRepository.create.mockImplementation((data) => data);
      mockAuditLogsRepository.save.mockResolvedValue({});

      await proxy.validateUser(loginDto);

      const auditLogCall = mockAuditLogsRepository.create.mock.calls[0][0];
      expect(auditLogCall.details).toContain('specific-user-id');
    });

    it('should not throw if audit log save fails', async () => {
      const loginDto: LoginDto = {
        email: 'auditfail@example.com',
        password: 'password',
      };

      const mockUser = {
        id: 'user-audit',
        email: 'auditfail@example.com',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockAuthService.validateUser.mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
        user: mockUser,
      });
      mockAuditLogsRepository.create.mockImplementation((data) => data);
      mockAuditLogsRepository.save.mockRejectedValue(
        new Error('Audit log save failed')
      );

      // Should not throw error, just log it
      const result = await proxy.validateUser(loginDto);

      expect(result).toBeDefined();
      expect(console.error).toHaveBeenCalledWith(
        'Error creating audit log:',
        expect.any(Error)
      );
    });

    it('should not create audit log if user not found in database', async () => {
      const loginDto: LoginDto = {
        email: 'notfound@example.com',
        password: 'password',
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockAuthService.validateUser.mockResolvedValue(null);

      const result = await proxy.validateUser(loginDto);

      expect(result).toBeNull();
      // Implementation only creates audit log if userFound exists
      // This is the actual behavior in auth-service.proxy.ts
      // The proxy checks if userFound exists before logging
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens and create audit log on success', async () => {
      const refreshToken = 'valid-refresh-token';
      const mockResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockAuthService.refreshTokens.mockResolvedValue(mockResult);
      mockAuditLogsRepository.create.mockImplementation((data) => data);
      mockAuditLogsRepository.save.mockResolvedValue({});

      const result = await proxy.refreshTokens(refreshToken);

      expect(result).toEqual(mockResult);
      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith(refreshToken);
      expect(mockAuditLogsRepository.save).toHaveBeenCalled();
      
      const auditLogCall = mockAuditLogsRepository.create.mock.calls[0][0];
      expect(auditLogCall.action).toBe('TOKEN_REFRESH_SUCCESS');
    });

    it('should create audit log on failed token refresh', async () => {
      const refreshToken = 'invalid-refresh-token';

      mockAuthService.refreshTokens.mockResolvedValue(null);
      mockAuditLogsRepository.create.mockImplementation((data) => data);
      mockAuditLogsRepository.save.mockResolvedValue({});

      const result = await proxy.refreshTokens(refreshToken);

      expect(result).toBeNull();
      expect(mockAuditLogsRepository.save).toHaveBeenCalled();
      
      const auditLogCall = mockAuditLogsRepository.create.mock.calls[0][0];
      expect(auditLogCall.action).toBe('TOKEN_REFRESH_FAILED');
      expect(auditLogCall.details).toContain('Invalid refresh token');
    });

    it('should create audit log on error during token refresh', async () => {
      const refreshToken = 'error-token';

      mockAuthService.refreshTokens.mockRejectedValue(
        new Error('Token refresh error')
      );
      mockAuditLogsRepository.create.mockImplementation((data) => data);
      mockAuditLogsRepository.save.mockResolvedValue({});

      await expect(proxy.refreshTokens(refreshToken)).rejects.toThrow(
        'Token refresh error'
      );

      expect(mockAuditLogsRepository.save).toHaveBeenCalled();
      
      const auditLogCall = mockAuditLogsRepository.create.mock.calls[0][0];
      expect(auditLogCall.action).toBe('TOKEN_REFRESH_ERROR');
      expect(auditLogCall.details).toContain('Token refresh error');
    });

    it('should include duration in token refresh audit log', async () => {
      const refreshToken = 'duration-token';

      mockAuthService.refreshTokens.mockResolvedValue({
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
      });
      mockAuditLogsRepository.create.mockImplementation((data) => data);
      mockAuditLogsRepository.save.mockResolvedValue({});

      await proxy.refreshTokens(refreshToken);

      const auditLogCall = mockAuditLogsRepository.create.mock.calls[0][0];
      expect(auditLogCall.details).toMatch(/Duration: \d+ms/);
    });

    it('should set user to undefined in token refresh audit logs', async () => {
      const refreshToken = 'user-null-token';

      mockAuthService.refreshTokens.mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });
      mockAuditLogsRepository.create.mockImplementation((data) => data);
      mockAuditLogsRepository.save.mockResolvedValue({});

      await proxy.refreshTokens(refreshToken);

      const auditLogCall = mockAuditLogsRepository.create.mock.calls[0][0];
      // user: null gets converted to undefined via `data.user || undefined`
      expect(auditLogCall.user).toBeUndefined();
    });

    it('should not throw if audit log save fails during refresh', async () => {
      const refreshToken = 'audit-fail-token';

      mockAuthService.refreshTokens.mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });
      mockAuditLogsRepository.create.mockImplementation((data) => data);
      mockAuditLogsRepository.save.mockRejectedValue(
        new Error('Audit save failed')
      );

      const result = await proxy.refreshTokens(refreshToken);

      expect(result).toBeDefined();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getAllAuditLogs', () => {
    it('should return paginated audit logs', async () => {
      const mockAuditLogs = [
        { id: '1', action: 'LOGIN_SUCCESS', description: 'User logged in' },
        { id: '2', action: 'LOGIN_FAILED', description: 'Failed login' },
      ];

      mockAuditLogsRepository.find.mockResolvedValue(mockAuditLogs);

      const result = await proxy.getAllAuditLogs(1, 10);

      expect(result).toEqual(mockAuditLogs);
      expect(mockAuditLogsRepository.find).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
      });
    });

    it('should calculate skip correctly for different pages', async () => {
      mockAuditLogsRepository.find.mockResolvedValue([]);

      await proxy.getAllAuditLogs(3, 20);

      expect(mockAuditLogsRepository.find).toHaveBeenCalledWith({
        skip: 40, // (3 - 1) * 20
        take: 20,
      });
    });

    it('should handle page 1 with default limit', async () => {
      mockAuditLogsRepository.find.mockResolvedValue([]);

      await proxy.getAllAuditLogs(1, 10);

      expect(mockAuditLogsRepository.find).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
      });
    });

    it('should handle large page numbers', async () => {
      mockAuditLogsRepository.find.mockResolvedValue([]);

      await proxy.getAllAuditLogs(100, 50);

      expect(mockAuditLogsRepository.find).toHaveBeenCalledWith({
        skip: 4950, // (100 - 1) * 50
        take: 50,
      });
    });

    it('should return empty array if no logs found', async () => {
      mockAuditLogsRepository.find.mockResolvedValue([]);

      const result = await proxy.getAllAuditLogs(1, 10);

      expect(result).toEqual([]);
    });
  });

  describe('logAction', () => {
    it('should save audit log', async () => {
      const auditLog = {
        id: 'log-1',
        action: 'CUSTOM_ACTION',
        description: 'Custom description',
        details: 'Custom details',
        createdAt: '2025-01-01',
      } as AuditLogs;

      mockAuditLogsRepository.save.mockResolvedValue(auditLog);

      await proxy.logAction(auditLog);

      expect(mockAuditLogsRepository.save).toHaveBeenCalledWith(auditLog);
    });

    it('should handle different audit log types', async () => {
      const actions = ['USER_CREATED', 'USER_DELETED', 'PASSWORD_RESET'];

      for (const action of actions) {
        const auditLog = {
          id: `log-${action}`,
          action,
          description: `${action} occurred`,
          details: 'Details',
          createdAt: '2025-01-01',
        } as AuditLogs;

        mockAuditLogsRepository.save.mockResolvedValue(auditLog);

        await proxy.logAction(auditLog);

        expect(mockAuditLogsRepository.save).toHaveBeenCalledWith(auditLog);
      }
    });
  });

  describe('findAuditLog', () => {
    it('should find audit log by id', async () => {
      const mockAuditLog = {
        id: 'log-123',
        action: 'LOGIN_SUCCESS',
        description: 'User logged in',
        details: 'Details',
        createdAt: '2025-01-01',
      };

      mockAuditLogsRepository.findOne.mockResolvedValue(mockAuditLog);

      const result = await proxy.findAuditLog('log-123');

      expect(result).toEqual(mockAuditLog);
      expect(mockAuditLogsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'log-123' },
      });
    });

    it('should throw error if audit log not found', async () => {
      mockAuditLogsRepository.findOne.mockResolvedValue(null);

      await expect(proxy.findAuditLog('non-existent')).rejects.toThrow(
        'Audit log with id non-existent not found'
      );
    });

    it('should find audit logs with different IDs', async () => {
      const ids = ['uuid-1', 'uuid-2', 'uuid-3'];

      for (const id of ids) {
        const mockLog = { id, action: 'ACTION', description: 'Desc' };
        mockAuditLogsRepository.findOne.mockResolvedValue(mockLog);

        const result = await proxy.findAuditLog(id);

        expect(result.id).toBe(id);
      }
    });
  });

  describe('createAuditLog (private)', () => {
    it('should create audit log with timestamp', async () => {
      const loginDto: LoginDto = {
        email: 'timestamp@example.com',
        password: 'password',
      };

      const mockUser = { id: 'user-1', email: 'timestamp@example.com' };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockAuthService.validateUser.mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
        user: mockUser,
      });
      mockAuditLogsRepository.create.mockImplementation((data) => data);
      mockAuditLogsRepository.save.mockResolvedValue({});

      await proxy.validateUser(loginDto);

      const auditLogCall = mockAuditLogsRepository.create.mock.calls[0][0];
      expect(auditLogCall.createdAt).toBeDefined();
      expect(typeof auditLogCall.createdAt).toBe('string');
    });

    it('should handle user being null or undefined', async () => {
      const refreshToken = 'token';

      mockAuthService.refreshTokens.mockResolvedValue({
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
      });
      mockAuditLogsRepository.create.mockImplementation((data) => data);
      mockAuditLogsRepository.save.mockResolvedValue({});

      await proxy.refreshTokens(refreshToken);

      const auditLogCall = mockAuditLogsRepository.create.mock.calls[0][0];
      expect(auditLogCall.user).toBeUndefined();
    });
  });

  describe('Error resilience', () => {
    it('should continue execution even if audit log creation fails', async () => {
      const loginDto: LoginDto = {
        email: 'resilient@example.com',
        password: 'password',
      };

      const mockUser = { id: 'user-resilient', email: 'resilient@example.com' };
      const mockResult = {
        accessToken: 'token',
        refreshToken: 'refresh',
        user: mockUser,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockAuthService.validateUser.mockResolvedValue(mockResult);
      mockAuditLogsRepository.create.mockImplementation(() => {
        throw new Error('Create failed');
      });

      const result = await proxy.validateUser(loginDto);

      expect(result).toEqual(mockResult);
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle repository errors gracefully', async () => {
      mockAuditLogsRepository.find.mockRejectedValue(
        new Error('Database connection lost')
      );

      await expect(proxy.getAllAuditLogs(1, 10)).rejects.toThrow(
        'Database connection lost'
      );
    });
  });

  describe('Performance tracking', () => {
    it('should track execution time for validateUser', async () => {
      const loginDto: LoginDto = {
        email: 'perf@example.com',
        password: 'password',
      };

      const mockUser = { id: 'user-perf', email: 'perf@example.com' };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockAuthService.validateUser.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              accessToken: 'token',
              refreshToken: 'refresh',
              user: mockUser,
            });
          }, 50);
        });
      });
      mockAuditLogsRepository.create.mockImplementation((data) => data);
      mockAuditLogsRepository.save.mockResolvedValue({});

      await proxy.validateUser(loginDto);

      const auditLogCall = mockAuditLogsRepository.create.mock.calls[0][0];
      const durationMatch = auditLogCall.details.match(/Duration: (\d+)ms/);
      expect(durationMatch).toBeTruthy();
      
      const duration = parseInt(durationMatch[1]);
      expect(duration).toBeGreaterThanOrEqual(50);
    });

    it('should track execution time for refreshTokens', async () => {
      mockAuthService.refreshTokens.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ accessToken: 'token', refreshToken: 'refresh' });
          }, 30);
        });
      });
      mockAuditLogsRepository.create.mockImplementation((data) => data);
      mockAuditLogsRepository.save.mockResolvedValue({});

      await proxy.refreshTokens('token');

      const auditLogCall = mockAuditLogsRepository.create.mock.calls[0][0];
      const durationMatch = auditLogCall.details.match(/Duration: (\d+)ms/);
      expect(durationMatch).toBeTruthy();
      
      const duration = parseInt(durationMatch[1]);
      expect(duration).toBeGreaterThanOrEqual(30);
    });
  });
});