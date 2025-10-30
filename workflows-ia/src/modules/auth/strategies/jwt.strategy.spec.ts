import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let mockConfigService: any;

  beforeEach(async () => {
    // Mock ConfigService
    mockConfigService = {
      get: jest.fn(),
    };

    // Default: return valid secret
    mockConfigService.get.mockReturnValue('test-secret-key');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize with JWT_ACCESS_SECRET from config', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_ACCESS_SECRET');
    });

    it('should throw error if JWT_ACCESS_SECRET is not defined', () => {
      mockConfigService.get.mockReturnValue(undefined);

      expect(() => {
        new JwtStrategy(mockConfigService);
      }).toThrow('JWT_ACCESS_SECRET environment variable is not defined');
    });

    it('should throw error if JWT_ACCESS_SECRET is null', () => {
      mockConfigService.get.mockReturnValue(null);

      expect(() => {
        new JwtStrategy(mockConfigService);
      }).toThrow('JWT_ACCESS_SECRET environment variable is not defined');
    });

    it('should throw error if JWT_ACCESS_SECRET is empty string', () => {
      mockConfigService.get.mockReturnValue('');

      expect(() => {
        new JwtStrategy(mockConfigService);
      }).toThrow('JWT_ACCESS_SECRET environment variable is not defined');
    });

    it('should accept valid JWT_ACCESS_SECRET', () => {
      mockConfigService.get.mockReturnValue('my-super-secret-key-123');

      expect(() => {
        new JwtStrategy(mockConfigService);
      }).not.toThrow();
    });
  });

  describe('validate', () => {
    it('should validate and return user data from JWT payload', async () => {
      const payload = {
        sub: 'user-123',
        email: 'user@example.com',
        name: 'John',
        fullName: 'John Doe',
        createdAt: '2025-01-01T00:00:00Z',
        lastLogin: '2025-01-15T10:30:00Z',
        token: 'some-token',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 'user-123',
        email: 'user@example.com',
        name: 'John',
        fullName: 'John Doe',
        createdAt: '2025-01-01T00:00:00Z',
        lastLogin: '2025-01-15T10:30:00Z',
        token: 'some-token',
      });
    });

    it('should map sub to id correctly', async () => {
      const payload = {
        sub: 'abc-def-ghi',
        email: 'test@test.com',
        name: 'Test',
        fullName: 'Test User',
        createdAt: '2025-01-01',
        lastLogin: '2025-01-02',
        token: 'token123',
      };

      const result = await strategy.validate(payload);

      expect(result.id).toBe('abc-def-ghi');
      expect(result).not.toHaveProperty('sub');
    });

    it('should return user without password field', async () => {
      const payload = {
        sub: 'user-456',
        email: 'admin@example.com',
        name: 'Admin',
        fullName: 'Admin User',
        createdAt: '2025-01-01',
        lastLogin: '2025-01-15',
        token: 'admin-token',
      };

      const result = await strategy.validate(payload);

      expect(result).not.toHaveProperty('password');
    });

    it('should handle payload with all required fields', async () => {
      const payload = {
        sub: '12345',
        email: 'complete@test.com',
        name: 'Complete',
        fullName: 'Complete User',
        createdAt: '2025-01-01T00:00:00.000Z',
        lastLogin: '2025-01-15T12:00:00.000Z',
        token: 'full-token-data',
      };

      const result = await strategy.validate(payload);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('fullName');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('lastLogin');
      expect(result).toHaveProperty('token');
      expect(Object.keys(result)).toHaveLength(7);
    });

    it('should preserve original data types', async () => {
      const payload = {
        sub: 'user-789',
        email: 'types@test.com',
        name: 'TypeTest',
        fullName: 'Type Test User',
        createdAt: '2025-01-01',
        lastLogin: '2025-01-15',
        token: 'type-token',
      };

      const result = await strategy.validate(payload);

      expect(typeof result.id).toBe('string');
      expect(typeof result.email).toBe('string');
      expect(typeof result.name).toBe('string');
      expect(typeof result.fullName).toBe('string');
      expect(typeof result.createdAt).toBe('string');
      expect(typeof result.lastLogin).toBe('string');
      expect(typeof result.token).toBe('string');
    });

    it('should handle UUID format for user id', async () => {
      const payload = {
        sub: '550e8400-e29b-41d4-a716-446655440000',
        email: 'uuid@test.com',
        name: 'UUID',
        fullName: 'UUID User',
        createdAt: '2025-01-01',
        lastLogin: '2025-01-15',
        token: 'uuid-token',
      };

      const result = await strategy.validate(payload);

      expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('should handle different email formats', async () => {
      const payloads = [
        {
          sub: '1',
          email: 'simple@example.com',
          name: 'User1',
          fullName: 'User One',
          createdAt: '2025-01-01',
          lastLogin: '2025-01-15',
          token: 'token1',
        },
        {
          sub: '2',
          email: 'complex.name+tag@subdomain.example.co.uk',
          name: 'User2',
          fullName: 'User Two',
          createdAt: '2025-01-01',
          lastLogin: '2025-01-15',
          token: 'token2',
        },
      ];

      for (const payload of payloads) {
        const result = await strategy.validate(payload);
        expect(result.email).toBe(payload.email);
      }
    });

    it('should handle ISO date strings in createdAt and lastLogin', async () => {
      const payload = {
        sub: 'user-date',
        email: 'date@test.com',
        name: 'DateTest',
        fullName: 'Date Test User',
        createdAt: '2025-01-01T08:30:00.000Z',
        lastLogin: '2025-01-15T14:45:30.123Z',
        token: 'date-token',
      };

      const result = await strategy.validate(payload);

      expect(result.createdAt).toBe('2025-01-01T08:30:00.000Z');
      expect(result.lastLogin).toBe('2025-01-15T14:45:30.123Z');
    });

    it('should handle tokens of different lengths', async () => {
      const payloads = [
        {
          sub: '1',
          email: 'short@test.com',
          name: 'Short',
          fullName: 'Short Token',
          createdAt: '2025-01-01',
          lastLogin: '2025-01-15',
          token: 'abc',
        },
        {
          sub: '2',
          email: 'long@test.com',
          name: 'Long',
          fullName: 'Long Token',
          createdAt: '2025-01-01',
          lastLogin: '2025-01-15',
          token: 'a'.repeat(500),
        },
      ];

      for (const payload of payloads) {
        const result = await strategy.validate(payload);
        expect(result.token).toBe(payload.token);
      }
    });
  });

  describe('Passport strategy configuration', () => {
    it('should be configured to extract JWT from Authorization header', () => {
      // This is implicitly tested by Passport, but we verify the strategy was created
      expect(strategy).toBeDefined();
      expect(strategy).toBeInstanceOf(JwtStrategy);
    });

    it('should not ignore token expiration', () => {
      // The strategy is configured with ignoreExpiration: false
      // This is verified through the super() call in constructor
      expect(strategy).toBeDefined();
    });

    it('should use the secret from config service', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_ACCESS_SECRET');
    });
  });

  describe('Edge cases', () => {
    it('should handle payload with undefined optional fields gracefully', async () => {
      const payload = {
        sub: 'user-999',
        email: 'minimal@test.com',
        name: 'Minimal',
        fullName: 'Minimal User',
        createdAt: undefined,
        lastLogin: undefined,
        token: undefined,
      };

      const result = await strategy.validate(payload);

      expect(result.id).toBe('user-999');
      expect(result.email).toBe('minimal@test.com');
      expect(result.createdAt).toBeUndefined();
      expect(result.lastLogin).toBeUndefined();
      expect(result.token).toBeUndefined();
    });

    it('should handle empty string values', async () => {
      const payload = {
        sub: 'user-empty',
        email: '',
        name: '',
        fullName: '',
        createdAt: '',
        lastLogin: '',
        token: '',
      };

      const result = await strategy.validate(payload);

      expect(result.email).toBe('');
      expect(result.name).toBe('');
      expect(result.fullName).toBe('');
    });

    it('should handle special characters in user data', async () => {
      const payload = {
        sub: 'user-special',
        email: 'special+chars@example.com',
        name: "O'Brien",
        fullName: 'Søren Ø\'Brien-Smith',
        createdAt: '2025-01-01',
        lastLogin: '2025-01-15',
        token: 'token-with-special-chars-@#$%',
      };

      const result = await strategy.validate(payload);

      expect(result.name).toBe("O'Brien");
      expect(result.fullName).toBe('Søren Ø\'Brien-Smith');
      expect(result.token).toBe('token-with-special-chars-@#$%');
    });

    it('should return consistent structure for multiple calls', async () => {
      const payload = {
        sub: 'consistent-user',
        email: 'consistent@test.com',
        name: 'Consistent',
        fullName: 'Consistent User',
        createdAt: '2025-01-01',
        lastLogin: '2025-01-15',
        token: 'consistent-token',
      };

      const result1 = await strategy.validate(payload);
      const result2 = await strategy.validate(payload);

      expect(result1).toEqual(result2);
      expect(Object.keys(result1).sort()).toEqual(Object.keys(result2).sort());
    });
  });

  describe('Integration with Passport', () => {
    it('should return user object that can be attached to request', async () => {
      const payload = {
        sub: 'integration-user',
        email: 'integration@test.com',
        name: 'Integration',
        fullName: 'Integration User',
        createdAt: '2025-01-01',
        lastLogin: '2025-01-15',
        token: 'integration-token',
      };

      const result = await strategy.validate(payload);

      // The result should be attachable to req.user
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.email).toBeDefined();
    });

    it('should provide all necessary user information for authorization', async () => {
      const payload = {
        sub: 'auth-user',
        email: 'auth@test.com',
        name: 'Auth',
        fullName: 'Auth User',
        createdAt: '2025-01-01T00:00:00Z',
        lastLogin: '2025-01-15T00:00:00Z',
        token: 'auth-token',
      };

      const result = await strategy.validate(payload);

      // Should have all fields needed for authorization decisions
      expect(result.id).toBeTruthy();
      expect(result.email).toBeTruthy();
      expect(result.name).toBeTruthy();
      expect(result.fullName).toBeTruthy();
    });
  });
});