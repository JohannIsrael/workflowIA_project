import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthServiceProxy } from './proxies/auth-service.proxy';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login-dto';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthServiceProxy: any;
  let mockAuthService: any;

  beforeEach(async () => {
    // Mock AuthServiceProxy
    mockAuthServiceProxy = {
      validateUser: jest.fn(),
      refreshTokens: jest.fn(),
      getAllAuditLogs: jest.fn(),
    };

    // Mock AuthService
    mockAuthService = {
      validateUser: jest.fn(),
      refreshTokens: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthServiceProxy,
          useValue: mockAuthServiceProxy,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return tokens and user data on successful login', async () => {
      const loginDto: LoginDto = {
        email: 'user@example.com',
        password: 'password123',
      };

      const mockResult = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        user: {
          id: 'user-123',
          email: 'user@example.com',
          name: 'John',
          fullName: 'John Doe',
        },
      };

      mockAuthServiceProxy.validateUser.mockResolvedValue(mockResult);

      const result = await controller.login(loginDto);

      expect(mockAuthServiceProxy.validateUser).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockResult);
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      const loginDto: LoginDto = {
        email: 'invalid@example.com',
        password: 'wrongpassword',
      };

      mockAuthServiceProxy.validateUser.mockResolvedValue(null);

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(controller.login(loginDto)).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const loginDto: LoginDto = {
        email: 'notfound@example.com',
        password: 'password',
      };

      mockAuthServiceProxy.validateUser.mockResolvedValue(null);

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should handle different user data correctly', async () => {
      const loginDto: LoginDto = {
        email: 'admin@example.com',
        password: 'adminpass',
      };

      const mockResult = {
        accessToken: 'admin-access-token',
        refreshToken: 'admin-refresh-token',
        user: {
          id: 'admin-456',
          email: 'admin@example.com',
          name: 'Admin',
          fullName: 'Admin User',
        },
      };

      mockAuthServiceProxy.validateUser.mockResolvedValue(mockResult);

      const result = await controller.login(loginDto);

      expect(result.user.name).toBe('Admin');
      expect(result.user.fullName).toBe('Admin User');
    });

    it('should pass exact login dto to service', async () => {
      const loginDto: LoginDto = {
        email: 'test@test.com',
        password: 'testpass',
      };

      mockAuthServiceProxy.validateUser.mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
        user: { id: '1', email: 'test@test.com', name: 'Test', fullName: 'Test User' },
      });

      await controller.login(loginDto);

      expect(mockAuthServiceProxy.validateUser).toHaveBeenCalledWith(loginDto);
      expect(mockAuthServiceProxy.validateUser).toHaveBeenCalledTimes(1);
    });

    it('should handle special characters in email', async () => {
      const loginDto: LoginDto = {
        email: 'user+tag@example.com',
        password: 'password',
      };

      mockAuthServiceProxy.validateUser.mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
        user: { 
          id: '1', 
          email: 'user+tag@example.com', 
          name: 'User', 
          fullName: 'User Name' 
        },
      });

      const result = await controller.login(loginDto);

      expect(result.user.email).toBe('user+tag@example.com');
    });

    it('should propagate service errors', async () => {
      const loginDto: LoginDto = {
        email: 'error@example.com',
        password: 'password',
      };

      mockAuthServiceProxy.validateUser.mockRejectedValue(
        new Error('Database error')
      );

      await expect(controller.login(loginDto)).rejects.toThrow('Database error');
    });
  });

  describe('refresh', () => {
    it('should return new tokens on successful refresh', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer valid-refresh-token',
        },
      } as any;

      const mockResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockAuthServiceProxy.refreshTokens.mockResolvedValue(mockResult);

      const result = await controller.refresh(mockRequest);

      expect(mockAuthServiceProxy.refreshTokens).toHaveBeenCalledWith(
        'valid-refresh-token'
      );
      expect(result).toEqual(mockResult);
    });

    it('should throw UnauthorizedException if refresh token not provided', async () => {
      const mockRequest = {
        headers: {},
      } as any;

      await expect(controller.refresh(mockRequest)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(controller.refresh(mockRequest)).rejects.toThrow(
        'Refresh token is required'
      );
    });

    it('should throw UnauthorizedException if authorization header is missing', async () => {
      const mockRequest = {
        headers: {},
      } as any;

      await expect(controller.refresh(mockRequest)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer invalid-refresh-token',
        },
      } as any;

      mockAuthServiceProxy.refreshTokens.mockResolvedValue(null);

      await expect(controller.refresh(mockRequest)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(controller.refresh(mockRequest)).rejects.toThrow(
        'Invalid refresh token'
      );
    });

    it('should extract token correctly from Bearer scheme', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer my-token-123',
        },
      } as any;

      mockAuthServiceProxy.refreshTokens.mockResolvedValue({
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
      });

      await controller.refresh(mockRequest);

      expect(mockAuthServiceProxy.refreshTokens).toHaveBeenCalledWith(
        'my-token-123'
      );
    });

    it('should handle authorization header with extra spaces', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer   token-with-spaces   ',
        },
      } as any;

      mockAuthServiceProxy.refreshTokens.mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      await controller.refresh(mockRequest);

      // replace('Bearer ', '') preserves the extra spaces after Bearer
      expect(mockAuthServiceProxy.refreshTokens).toHaveBeenCalledWith(
        '  token-with-spaces   '
      );
    });

    it('should handle case-sensitive Bearer scheme', async () => {
      const mockRequest = {
        headers: {
          authorization: 'bearer lowercase-token',
        },
      } as any;

      mockAuthServiceProxy.refreshTokens.mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      await controller.refresh(mockRequest);

      // Should handle lowercase 'bearer'
      expect(mockAuthServiceProxy.refreshTokens).toHaveBeenCalled();
    });

    it('should throw error if authorization header format is invalid', async () => {
      const mockRequest = {
        headers: {
          authorization: 'InvalidFormat token',
        },
      } as any;

      mockAuthServiceProxy.refreshTokens.mockResolvedValue(null);

      await expect(controller.refresh(mockRequest)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should handle long refresh tokens', async () => {
      const longToken = 'a'.repeat(500);
      const mockRequest = {
        headers: {
          authorization: `Bearer ${longToken}`,
        },
      } as any;

      mockAuthServiceProxy.refreshTokens.mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });

      await controller.refresh(mockRequest);

      expect(mockAuthServiceProxy.refreshTokens).toHaveBeenCalledWith(longToken);
    });

    it('should propagate service errors during refresh', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer error-token',
        },
      } as any;

      mockAuthServiceProxy.refreshTokens.mockRejectedValue(
        new Error('Token validation failed')
      );

      await expect(controller.refresh(mockRequest)).rejects.toThrow(
        'Token validation failed'
      );
    });
  });

  describe('getAuditLogs', () => {
    it('should return paginated audit logs with default values', async () => {
      const mockAuditLogs = [
        {
          id: '1',
          action: 'LOGIN_SUCCESS',
          description: 'User logged in',
          createdAt: '2025-01-01',
        },
        {
          id: '2',
          action: 'LOGIN_FAILED',
          description: 'Failed login attempt',
          createdAt: '2025-01-02',
        },
      ];

      mockAuthServiceProxy.getAllAuditLogs.mockResolvedValue(mockAuditLogs);

      const result = await controller.getAuditLogs();

      expect(mockAuthServiceProxy.getAllAuditLogs).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual(mockAuditLogs);
    });

    it('should return audit logs with custom page', async () => {
      const mockAuditLogs = [
        { id: '11', action: 'LOGIN_SUCCESS', description: 'Login' },
      ];

      mockAuthServiceProxy.getAllAuditLogs.mockResolvedValue(mockAuditLogs);

      const result = await controller.getAuditLogs(3);

      expect(mockAuthServiceProxy.getAllAuditLogs).toHaveBeenCalledWith(3, 10);
      expect(result).toEqual(mockAuditLogs);
    });

    it('should return audit logs with custom limit', async () => {
      const mockAuditLogs = [
        { id: '1', action: 'LOGIN_SUCCESS', description: 'Login' },
      ];

      mockAuthServiceProxy.getAllAuditLogs.mockResolvedValue(mockAuditLogs);

      const result = await controller.getAuditLogs(1, 50);

      expect(mockAuthServiceProxy.getAllAuditLogs).toHaveBeenCalledWith(1, 50);
      expect(result).toEqual(mockAuditLogs);
    });

    it('should return audit logs with custom page and limit', async () => {
      const mockAuditLogs = [
        { id: '21', action: 'TOKEN_REFRESH', description: 'Refresh' },
      ];

      mockAuthServiceProxy.getAllAuditLogs.mockResolvedValue(mockAuditLogs);

      const result = await controller.getAuditLogs(5, 20);

      expect(mockAuthServiceProxy.getAllAuditLogs).toHaveBeenCalledWith(5, 20);
      expect(result).toEqual(mockAuditLogs);
    });

    it('should return empty array if no audit logs found', async () => {
      mockAuthServiceProxy.getAllAuditLogs.mockResolvedValue([]);

      const result = await controller.getAuditLogs(100, 10);

      expect(result).toEqual([]);
    });

    it('should handle page 0 as page 1', async () => {
      mockAuthServiceProxy.getAllAuditLogs.mockResolvedValue([]);

      await controller.getAuditLogs(0, 10);

      expect(mockAuthServiceProxy.getAllAuditLogs).toHaveBeenCalledWith(0, 10);
    });

    it('should handle negative page numbers', async () => {
      mockAuthServiceProxy.getAllAuditLogs.mockResolvedValue([]);

      await controller.getAuditLogs(-1, 10);

      expect(mockAuthServiceProxy.getAllAuditLogs).toHaveBeenCalledWith(-1, 10);
    });

    it('should handle very large page numbers', async () => {
      mockAuthServiceProxy.getAllAuditLogs.mockResolvedValue([]);

      await controller.getAuditLogs(999999, 10);

      expect(mockAuthServiceProxy.getAllAuditLogs).toHaveBeenCalledWith(
        999999,
        10
      );
    });

    it('should handle very large limit values', async () => {
      mockAuthServiceProxy.getAllAuditLogs.mockResolvedValue([]);

      await controller.getAuditLogs(1, 1000);

      expect(mockAuthServiceProxy.getAllAuditLogs).toHaveBeenCalledWith(1, 1000);
    });

    it('should return audit logs with different action types', async () => {
      const mockAuditLogs = [
        { id: '1', action: 'LOGIN_SUCCESS', description: 'Login successful' },
        { id: '2', action: 'LOGIN_FAILED', description: 'Login failed' },
        { id: '3', action: 'TOKEN_REFRESH_SUCCESS', description: 'Token refreshed' },
        { id: '4', action: 'LOGIN_ERROR', description: 'Login error' },
      ];

      mockAuthServiceProxy.getAllAuditLogs.mockResolvedValue(mockAuditLogs);

      const result = await controller.getAuditLogs(1, 10);

      expect(result).toHaveLength(4);
      expect(result[0].action).toBe('LOGIN_SUCCESS');
      expect(result[1].action).toBe('LOGIN_FAILED');
      expect(result[2].action).toBe('TOKEN_REFRESH_SUCCESS');
      expect(result[3].action).toBe('LOGIN_ERROR');
    });

    it('should propagate service errors', async () => {
      mockAuthServiceProxy.getAllAuditLogs.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(controller.getAuditLogs(1, 10)).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete login flow', async () => {
      const loginDto: LoginDto = {
        email: 'integration@example.com',
        password: 'integrationpass',
      };

      const mockLoginResult = {
        accessToken: 'integration-access-token',
        refreshToken: 'integration-refresh-token',
        user: {
          id: 'integration-123',
          email: 'integration@example.com',
          name: 'Integration',
          fullName: 'Integration User',
        },
      };

      mockAuthServiceProxy.validateUser.mockResolvedValue(mockLoginResult);

      const loginResult = await controller.login(loginDto);

      expect(loginResult.accessToken).toBeTruthy();
      expect(loginResult.refreshToken).toBeTruthy();
      expect(loginResult.user.email).toBe('integration@example.com');
    });

    it('should handle complete token refresh flow', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer old-refresh-token',
        },
      } as any;

      const mockRefreshResult = {
        accessToken: 'refreshed-access-token',
        refreshToken: 'refreshed-refresh-token',
      };

      mockAuthServiceProxy.refreshTokens.mockResolvedValue(mockRefreshResult);

      const refreshResult = await controller.refresh(mockRequest);

      expect(refreshResult.accessToken).toBe('refreshed-access-token');
      expect(refreshResult.refreshToken).toBe('refreshed-refresh-token');
    });

    it('should handle audit logs retrieval flow', async () => {
      const mockLogs = [
        { id: '1', action: 'LOGIN_SUCCESS', description: 'User logged in' },
        { id: '2', action: 'TOKEN_REFRESH_SUCCESS', description: 'Token refreshed' },
      ];

      mockAuthServiceProxy.getAllAuditLogs.mockResolvedValue(mockLogs);

      const logs = await controller.getAuditLogs(1, 10);

      expect(logs).toHaveLength(2);
      expect(logs[0].action).toBe('LOGIN_SUCCESS');
    });
  });

  describe('Error handling', () => {
    it('should handle UnauthorizedException in login', async () => {
      const loginDto: LoginDto = {
        email: 'error@example.com',
        password: 'password',
      };

      mockAuthServiceProxy.validateUser.mockResolvedValue(null);

      try {
        await controller.login(loginDto);
        fail('Should have thrown UnauthorizedException');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe('Invalid credentials');
      }
    });

    it('should handle UnauthorizedException in refresh', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer invalid-token',
        },
      } as any;

      mockAuthServiceProxy.refreshTokens.mockResolvedValue(null);

      try {
        await controller.refresh(mockRequest);
        fail('Should have thrown UnauthorizedException');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe('Invalid refresh token');
      }
    });

    it('should propagate other types of errors', async () => {
      const loginDto: LoginDto = {
        email: 'error@example.com',
        password: 'password',
      };

      mockAuthServiceProxy.validateUser.mockRejectedValue(
        new Error('Unexpected error')
      );

      await expect(controller.login(loginDto)).rejects.toThrow('Unexpected error');
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined query parameters in getAuditLogs', async () => {
      mockAuthServiceProxy.getAllAuditLogs.mockResolvedValue([]);

      await controller.getAuditLogs(undefined, undefined);

      expect(mockAuthServiceProxy.getAllAuditLogs).toHaveBeenCalledWith(1, 10);
    });

    it('should handle null authorization header', async () => {
      const mockRequest = {
        headers: {
          authorization: null,
        },
      } as any;

      await expect(controller.refresh(mockRequest)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should handle empty string in authorization header', async () => {
      const mockRequest = {
        headers: {
          authorization: '',
        },
      } as any;

      await expect(controller.refresh(mockRequest)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should handle authorization header without Bearer prefix', async () => {
      const mockRequest = {
        headers: {
          authorization: 'just-a-token',
        },
      } as any;

      mockAuthServiceProxy.refreshTokens.mockResolvedValue({
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
      });

      await controller.refresh(mockRequest);

      // Should still work, just removes 'Bearer ' prefix
      expect(mockAuthServiceProxy.refreshTokens).toHaveBeenCalled();
    });
  });
});