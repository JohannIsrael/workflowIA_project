import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { AuditLogs } from './entities/AuditLogs.entity';
import { LoginDto } from './dto/login-dto';
import * as jwt from 'jsonwebtoken';

// Mock jwt module
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let service: AuthService;
  let mockJwtService: any;
  let mockConfigService: any;
  let mockUserRepository: any;
  let mockAuditLogsRepository: any;

  beforeEach(async () => {
    // Mock JwtService
    mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    // Mock ConfigService
    mockConfigService = {
      get: jest.fn(),
    };

    // Mock User Repository
    mockUserRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    // Mock AuditLogs Repository
    mockAuditLogsRepository = {
      save: jest.fn(),
      create: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(AuditLogs),
          useValue: mockAuditLogsRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Default config values
    mockConfigService.get.mockImplementation((key: string) => {
      const configs: { [key: string]: string } = {
        JWT_ACCESS_SECRET: 'test-access-secret',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
      };
      return configs[key];
    });

    // Default jwt.sign mock
    (jwt.sign as jest.Mock).mockImplementation((payload, secret, options) => {
      return `mocked-token-${options.expiresIn}`;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return null if user not found', async () => {
      const loginDto: LoginDto = {
        email: 'notfound@example.com',
        password: 'password123',
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser(loginDto);

      expect(result).toBeNull();
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'notfound@example.com' },
      });
    });

    it('should return null if password is incorrect', async () => {
      const loginDto: LoginDto = {
        email: 'user@example.com',
        password: 'wrongpassword',
      };

      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        password: 'correctpassword',
        name: 'John',
        fullName: 'John Doe',
        createdAt: '2025-01-01',
        lastLogin: '2025-01-15',
        token: 'user-token',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser(loginDto);

      expect(result).toBeNull();
    });

    it('should return tokens and user data if credentials are valid', async () => {
      const loginDto: LoginDto = {
        email: 'user@example.com',
        password: 'correctpassword',
      };

      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        password: 'correctpassword',
        name: 'John',
        fullName: 'John Doe',
        createdAt: '2025-01-01T00:00:00Z',
        lastLogin: '2025-01-15T10:30:00Z',
        token: 'user-token',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser(loginDto);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mocked-token-1h');
      expect(result.refreshToken).toBe('mocked-token-7d');
      expect(result.user).toEqual({
        id: 'user-123',
        email: 'user@example.com',
        name: 'John',
        fullName: 'John Doe',
      });
    });

    it('should generate access token with correct payload', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password',
      };

      const mockUser = {
        id: 'user-456',
        email: 'test@example.com',
        password: 'password',
        name: 'Test',
        fullName: 'Test User',
        createdAt: '2025-01-01',
        lastLogin: '2025-01-15',
        token: 'test-token',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await service.validateUser(loginDto);

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          sub: 'user-456',
          email: 'test@example.com',
          name: 'Test',
          fullName: 'Test User',
          createdAt: '2025-01-01',
          lastLogin: '2025-01-15',
          token: 'test-token',
        },
        'test-access-secret',
        { expiresIn: '1h' }
      );
    });

    it('should generate refresh token with correct payload', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password',
      };

      const mockUser = {
        id: 'user-789',
        email: 'test@example.com',
        password: 'password',
        name: 'Refresh',
        fullName: 'Refresh User',
        createdAt: '2025-01-01',
        lastLogin: '2025-01-15',
        token: 'refresh-token',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await service.validateUser(loginDto);

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'user-789',
          email: 'test@example.com',
        }),
        'test-refresh-secret',
        { expiresIn: '7d' }
      );
    });

    it('should not include password in returned user object', async () => {
      const loginDto: LoginDto = {
        email: 'secure@example.com',
        password: 'securepass',
      };

      const mockUser = {
        id: 'secure-123',
        email: 'secure@example.com',
        password: 'securepass',
        name: 'Secure',
        fullName: 'Secure User',
        createdAt: '2025-01-01',
        lastLogin: '2025-01-15',
        token: 'secure-token',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser(loginDto);

      expect(result.user).not.toHaveProperty('password');
    });

    it('should handle user with special characters in data', async () => {
      const loginDto: LoginDto = {
        email: "special+chars@example.com",
        password: 'pass@123!',
      };

      const mockUser = {
        id: 'special-user',
        email: "special+chars@example.com",
        password: 'pass@123!',
        name: "O'Brien",
        fullName: 'John O\'Brien-Smith',
        createdAt: '2025-01-01',
        lastLogin: '2025-01-15',
        token: 'special-token',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser(loginDto);

      expect(result).toBeDefined();
      expect(result.user.name).toBe("O'Brien");
      expect(result.user.fullName).toBe('John O\'Brien-Smith');
    });
  });

  describe('refreshTokens', () => {
    it('should return null if refresh token is not provided', async () => {
      const result = await service.refreshTokens('');

      expect(result).toBeNull();
    });

    it('should return null if refresh token is null', async () => {
      const result = await service.refreshTokens(null as any);

      expect(result).toBeNull();
    });

    it('should return null if refresh token is undefined', async () => {
      const result = await service.refreshTokens(undefined as any);

      expect(result).toBeNull();
    });

    it('should return null if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.refreshTokens('valid-refresh-token');

      expect(result).toBeNull();
    });

    it('should generate new access and refresh tokens if valid', async () => {
      const mockUser = {
        id: 'user-refresh',
        email: 'user@example.com',
        name: 'Refresh',
        fullName: 'Refresh User',
        createdAt: '2025-01-01',
        lastLogin: '2025-01-15',
        token: 'user-token',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.refreshTokens('valid-refresh-token');

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mocked-token-1h');
      expect(result.refreshToken).toBe('mocked-token-7d');
    });

    it('should generate new tokens with correct payload', async () => {
      const mockUser = {
        id: 'user-payload',
        email: 'user@example.com',
        name: 'Payload',
        fullName: 'Payload User',
        createdAt: '2025-01-01',
        lastLogin: '2025-01-15',
        token: 'payload-token',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await service.refreshTokens('refresh-token');

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          sub: 'user-payload',
          email: 'user@example.com',
          name: 'Payload',
          fullName: 'Payload User',
          createdAt: '2025-01-01',
          lastLogin: '2025-01-15',
          token: 'payload-token',
        },
        'test-access-secret',
        { expiresIn: '1h' }
      );
    });

    it('should query user by hardcoded email', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: '1',
        email: 'user@example.com',
        name: 'User',
        fullName: 'Full User',
        createdAt: '2025-01-01',
        lastLogin: '2025-01-15',
        token: 'token',
      });

      await service.refreshTokens('any-token');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
      });
    });
  });

  describe('generateAccessToken (private)', () => {
    it('should throw error if JWT_ACCESS_SECRET is not defined', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password',
      };

      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'password',
        name: 'Test',
        fullName: 'Test User',
        createdAt: '2025-01-01',
        lastLogin: '2025-01-15',
        token: 'token',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.validateUser(loginDto)).rejects.toThrow(
        'JWT_ACCESS_SECRET environment variable is not defined'
      );
    });

    it('should use JWT_ACCESS_SECRET from config', async () => {
      mockConfigService.get.mockReturnValue('custom-access-secret');

      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password',
      };

      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'password',
        name: 'Test',
        fullName: 'Test User',
        createdAt: '2025-01-01',
        lastLogin: '2025-01-15',
        token: 'token',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await service.validateUser(loginDto);

      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_ACCESS_SECRET');
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        'custom-access-secret',
        { expiresIn: '1h' }
      );
    });

    it('should generate token with 1 hour expiration', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password',
      };

      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'password',
        name: 'Test',
        fullName: 'Test User',
        createdAt: '2025-01-01',
        lastLogin: '2025-01-15',
        token: 'token',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await service.validateUser(loginDto);

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        { expiresIn: '1h' }
      );
    });
  });

  describe('generateRefreshToken (private)', () => {
    it('should throw error if JWT_REFRESH_SECRET is not defined', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'JWT_ACCESS_SECRET') return 'access-secret';
        if (key === 'JWT_REFRESH_SECRET') return undefined;
        return null;
      });

      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password',
      };

      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'password',
        name: 'Test',
        fullName: 'Test User',
        createdAt: '2025-01-01',
        lastLogin: '2025-01-15',
        token: 'token',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.validateUser(loginDto)).rejects.toThrow(
        'JWT_REFRESH_SECRET environment variable is not defined'
      );
    });

    it('should use JWT_REFRESH_SECRET from config', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'JWT_ACCESS_SECRET') return 'access-secret';
        if (key === 'JWT_REFRESH_SECRET') return 'custom-refresh-secret';
        return null;
      });

      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password',
      };

      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'password',
        name: 'Test',
        fullName: 'Test User',
        createdAt: '2025-01-01',
        lastLogin: '2025-01-15',
        token: 'token',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await service.validateUser(loginDto);

      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_REFRESH_SECRET');
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        'custom-refresh-secret',
        { expiresIn: '7d' }
      );
    });

    it('should generate token with 7 days expiration', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password',
      };

      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'password',
        name: 'Test',
        fullName: 'Test User',
        createdAt: '2025-01-01',
        lastLogin: '2025-01-15',
        token: 'token',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await service.validateUser(loginDto);

      const refreshTokenCall = (jwt.sign as jest.Mock).mock.calls.find(
        call => call[2].expiresIn === '7d'
      );

      expect(refreshTokenCall).toBeDefined();
      expect(refreshTokenCall[2]).toEqual({ expiresIn: '7d' });
    });
  });

  describe('Edge cases', () => {
    it('should handle case-sensitive email comparison', async () => {
      const loginDto: LoginDto = {
        email: 'User@Example.COM',
        password: 'password',
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser(loginDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'User@Example.COM' },
      });
      expect(result).toBeNull();
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(1000);
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: longPassword,
      };

      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'differentpassword',
        name: 'Test',
        fullName: 'Test User',
        createdAt: '2025-01-01',
        lastLogin: '2025-01-15',
        token: 'token',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser(loginDto);

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password',
      };

      mockUserRepository.findOne.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(service.validateUser(loginDto)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle JWT signing errors', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password',
      };

      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'password',
        name: 'Test',
        fullName: 'Test User',
        createdAt: '2025-01-01',
        lastLogin: '2025-01-15',
        token: 'token',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockImplementation(() => {
        throw new Error('JWT signing failed');
      });

      await expect(service.validateUser(loginDto)).rejects.toThrow(
        'JWT signing failed'
      );
    });
  });

  describe('Integration scenarios', () => {
    it('should complete full login flow successfully', async () => {
      const loginDto: LoginDto = {
        email: 'integration@example.com',
        password: 'integrationpass',
      };

      const mockUser = {
        id: 'integration-user',
        email: 'integration@example.com',
        password: 'integrationpass',
        name: 'Integration',
        fullName: 'Integration User',
        createdAt: '2025-01-01T00:00:00Z',
        lastLogin: '2025-01-15T10:30:00Z',
        token: 'integration-token',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser(loginDto);

      expect(result).toBeDefined();
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe('integration-user');
      expect(result.user.email).toBe('integration@example.com');
    });

    it('should complete full token refresh flow successfully', async () => {
      const mockUser = {
        id: 'refresh-user',
        email: 'user@example.com',
        name: 'Refresh',
        fullName: 'Refresh User',
        createdAt: '2025-01-01',
        lastLogin: '2025-01-15',
        token: 'refresh-token',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.refreshTokens('old-refresh-token');

      expect(result).toBeDefined();
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
      expect(result.accessToken).not.toBe(result.refreshToken);
    });
  });
});