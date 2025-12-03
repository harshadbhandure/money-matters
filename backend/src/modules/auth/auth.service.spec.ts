import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RefreshTokenService } from '../refresh-token/refresh-token.service';
import { User } from '../user/user.entity';
import { RefreshToken } from '../refresh-token/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let refreshTokenService: RefreshTokenService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
        //   type: 'sqlite',
        //   database: ':memory:',
        //   entities: [User, RefreshToken],
        //   synchronize: true,
        //   dropSchema: true,
          type: 'sqlite',
            database: 'sqlite.db',
            entities: [__dirname + '/modules/**/*.entity{.ts,.js}'],
            migrations: [__dirname + '/migrations/*{.ts,.js}'],
            synchronize: true,
            logging: true,
        }),
        TypeOrmModule.forFeature([User, RefreshToken]),
      ],
      providers: [
        AuthService,
        UsersService,
        RefreshTokenService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn((payload, options) => {
              return `mock-token-${payload.sub}`;
            }),
            verify: jest.fn((token, options) => {
              if (token.startsWith('invalid')) {
                throw new Error('Invalid token');
              }
              return {
                sub: 'user-id-123',
                email: 'test@example.com',
                name: 'Test User',
              };
            }),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    refreshTokenService = module.get<RefreshTokenService>(
      RefreshTokenService,
    );
  });

  afterAll(async () => {
    await module.close();
  });

  afterEach(async () => {
    // Clean up database after each test
    const userRepo = module.get('UserRepository');
    const refreshTokenRepo = module.get('RefreshTokenRepository');
    if (userRepo) await userRepo.clear();
    if (refreshTokenRepo) await refreshTokenRepo.clear();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      const result = await authService.register(registerDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toMatchObject({
        email: registerDto.email,
        name: registerDto.name,
      });
      expect(result.user).toHaveProperty('id');
    });

    it('should throw ConflictException when email already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      };

      await authService.register(registerDto);

      await expect(authService.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should hash the password', async () => {
      const registerDto: RegisterDto = {
        email: 'hashtest@example.com',
        password: 'password123',
        name: 'Hash Test',
      };

      await authService.register(registerDto);

      const user = await usersService.findByEmail(registerDto.email);
      expect(user.passwordHash).not.toBe(registerDto.password);
      expect(user.passwordHash).toMatch(/^\$2[aby]\$/); // bcrypt hash format
    });

    it('should create a refresh token in the database', async () => {
      const registerDto: RegisterDto = {
        email: 'tokentest@example.com',
        password: 'password123',
        name: 'Token Test',
      };

      const result = await authService.register(registerDto);
      const tokens = await refreshTokenService.findByUserId(result.user.id);

      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens[0].userId).toBe(result.user.id);
    });
  });

  describe('login', () => {
    const testUser = {
      email: 'login@example.com',
      password: 'password123',
      name: 'Login User',
    };

    beforeEach(async () => {
      await authService.register(testUser);
    });

    it('should successfully login with valid credentials', async () => {
      const loginDto: LoginDto = {
        email: testUser.email,
        password: testUser.password,
      };

      const result = await authService.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(testUser.email);
    });

    it('should throw UnauthorizedException with invalid email', async () => {
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException with invalid password', async () => {
      const loginDto: LoginDto = {
        email: testUser.email,
        password: 'wrongpassword',
      };

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should create a new refresh token on login', async () => {
      const loginDto: LoginDto = {
        email: testUser.email,
        password: testUser.password,
      };

      const user = await usersService.findByEmail(testUser.email);
      const tokensBefore = await refreshTokenService.findByUserId(user.id);
      const countBefore = tokensBefore.length;

      await authService.login(loginDto);

      const tokensAfter = await refreshTokenService.findByUserId(user.id);
      expect(tokensAfter.length).toBe(countBefore + 1);
    });
  });

  describe('refresh', () => {
    let validRefreshToken: string;
    let userId: string;

    beforeEach(async () => {
      const registerDto: RegisterDto = {
        email: 'refresh@example.com',
        password: 'password123',
        name: 'Refresh User',
      };

      const result = await authService.register(registerDto);
      validRefreshToken = result.refreshToken;
      userId = result.user.id;
    });

    it('should successfully refresh tokens with valid refresh token', async () => {
      const result = await authService.refresh(validRefreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.refreshToken).not.toBe(validRefreshToken); // Should be a new token
    });

    it('should throw UnauthorizedException with invalid token', async () => {
      await expect(
        authService.refresh('invalid-token-123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should revoke old refresh token after successful refresh', async () => {
      const tokensBefore = await refreshTokenService.findByUserId(userId);
      const countBefore = tokensBefore.length;

      await authService.refresh(validRefreshToken);

      // Wait a bit for async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      const tokensAfter = await refreshTokenService.findByUserId(userId);
      // Old token should be revoked, new one added, so count should remain same
      expect(tokensAfter.length).toBe(countBefore);
    });
  });

  describe('logout', () => {
    let validRefreshToken: string;
    let userId: string;

    beforeEach(async () => {
      const registerDto: RegisterDto = {
        email: 'logout@example.com',
        password: 'password123',
        name: 'Logout User',
      };

      const result = await authService.register(registerDto);
      validRefreshToken = result.refreshToken;
      userId = result.user.id;
    });

    it('should successfully logout and revoke refresh token', async () => {
      await authService.logout(userId, validRefreshToken);

      const tokens = await refreshTokenService.findByUserId(userId);
      expect(tokens.length).toBe(0);
    });

    it('should throw BadRequestException with invalid token', async () => {
      await expect(
        authService.logout(userId, 'invalid-token'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when token does not match user', async () => {
      const anotherUser = await authService.register({
        email: 'another@example.com',
        password: 'password123',
        name: 'Another User',
      });

      await expect(
        authService.logout(anotherUser.user.id, validRefreshToken),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('logoutAll', () => {
    let userId: string;

    beforeEach(async () => {
      const registerDto: RegisterDto = {
        email: 'logoutall@example.com',
        password: 'password123',
        name: 'Logout All User',
      };

      const result = await authService.register(registerDto);
      userId = result.user.id;

      // Login multiple times to create multiple refresh tokens
      await authService.login({
        email: registerDto.email,
        password: registerDto.password,
      });
      await authService.login({
        email: registerDto.email,
        password: registerDto.password,
      });
    });

    it('should revoke all refresh tokens for a user', async () => {
      const tokensBefore = await refreshTokenService.findByUserId(userId);
      expect(tokensBefore.length).toBeGreaterThan(1);

      await authService.logoutAll(userId);

      const tokensAfter = await refreshTokenService.findByUserId(userId);
      expect(tokensAfter.length).toBe(0);
    });
  });

  describe('validateUser', () => {
    it('should return user when user exists', async () => {
      const registerDto: RegisterDto = {
        email: 'validate@example.com',
        password: 'password123',
        name: 'Validate User',
      };

      const result = await authService.register(registerDto);
      const user = await authService.validateUser(result.user.id);

      expect(user).toBeDefined();
      expect(user.id).toBe(result.user.id);
      expect(user.email).toBe(registerDto.email);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      await expect(
        authService.validateUser('non-existent-id'),
      ).rejects.toThrow();
    });
  });
});
