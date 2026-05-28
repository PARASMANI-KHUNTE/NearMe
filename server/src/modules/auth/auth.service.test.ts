// @ts-nocheck
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AuthService } from './auth.service';
import { User } from '../users/user.model';
import bcrypt from 'bcryptjs';

// Mock dependencies
jest.mock('../users/user.model');
jest.mock('bcryptjs');
jest.mock('google-auth-library');
jest.mock('../../shared/services/email.service', () => ({
  EmailService: {
    sendVerificationEmail: () => Promise.resolve(),
    sendPasswordResetEmail: () => Promise.resolve(),
  },
}));
jest.mock('../../shared/redis/connection', () => {
  const mRedis = {
    set: jest.fn(() => Promise.resolve('OK')),
    get: jest.fn(() => Promise.resolve(null)),
    del: jest.fn(() => Promise.resolve(1)),
  };
  return { redisClient: mRedis };
});

describe('AuthService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('register', () => {
    test('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const mockUser = {
        _id: 'user123',
        email: userData.email,
        name: userData.name,
        uniqueId: 'ABC12345',
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (User.create as jest.Mock).mockResolvedValue({
        _id: mockUser._id,
        toObject: () => mockUser,
      });

      const result = await AuthService.register(userData);

      expect(result.user).toEqual(mockUser);
      expect(result.token).toBeDefined();
      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(User.create).toHaveBeenCalled();
    });

    test('should throw error if user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
      };

      (User.findOne as jest.Mock).mockResolvedValue({ _id: 'existing' });

      await expect(AuthService.register(userData)).rejects.toThrow(
        'User with this email already exists'
      );
    });

    test('should generate unique ID for new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      (User.findOne as jest.Mock)
        .mockResolvedValueOnce(null) // Email check
        .mockResolvedValueOnce(null) // Unique ID check
        .mockResolvedValueOnce(null); // Second unique ID check
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (User.create as jest.Mock).mockResolvedValue({
        _id: 'user123',
        toObject: () => ({
          _id: 'user123',
          email: userData.email,
          name: userData.name,
          uniqueId: 'ABC12345',
        }),
      });

      const result = await AuthService.register(userData);

      expect(result.user.uniqueId).toBeDefined();
      expect(result.user.uniqueId).toHaveLength(8);
    });
  });

  describe('login', () => {
    test('should login user with valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      const mockUser = {
        _id: 'user123',
        email,
        password: 'hashedPassword',
        name: 'Test User',
        toObject: () => ({
          _id: 'user123',
          email,
          name: 'Test User',
        }),
      };

      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await AuthService.login(email, password);

      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(bcrypt.compare).toHaveBeenCalledWith(password, 'hashedPassword');
    });

    test('should throw error for invalid email', async () => {
      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(AuthService.login('invalid@example.com', 'password')).rejects.toThrow(
        'Invalid email or password'
      );
    });

    test('should throw error for invalid password', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: 'hashedPassword',
        toObject: () => ({
          _id: 'user123',
          email: 'test@example.com',
        }),
      };

      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(AuthService.login('test@example.com', 'wrongpassword')).rejects.toThrow(
        'Invalid email or password'
      );
    });
  });

  describe('verifyGoogleTokenAndLogin', () => {
    test('should login with valid Google token', async () => {
      const mockPayload = {
        sub: 'google123',
        email: 'google@example.com',
        name: 'Google User',
        picture: 'https://example.com/picture.jpg',
      };

      const mockUser = {
        _id: 'user123',
        googleId: 'google123',
        email: mockPayload.email,
        name: mockPayload.name,
        picture: mockPayload.picture,
        isEmailVerified: true,
      };

      const mockTicket = {
        getPayload: () => mockPayload,
      };

      const { OAuth2Client } = require('google-auth-library');
      OAuth2Client.prototype.verifyIdToken = jest.fn().mockResolvedValue(mockTicket);

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await AuthService.verifyGoogleTokenAndLogin('valid-token');

      expect(result.user).toEqual(mockUser);
      expect(result.token).toBeDefined();
    });

    test('should update existing user picture and googleId from Google login', async () => {
      const mockPayload = {
        sub: 'google123',
        email: 'google@example.com',
        name: 'Google User',
        picture: 'https://example.com/new-picture.jpg',
      };

      const save = jest.fn().mockResolvedValue(undefined);
      const mockUser = {
        _id: 'user123',
        googleId: undefined,
        email: mockPayload.email,
        name: 'Old Name',
        picture: undefined,
        save,
        toObject: () => ({
          _id: 'user123',
          googleId: mockPayload.sub,
          email: mockPayload.email,
          name: mockPayload.name,
          picture: mockPayload.picture,
        }),
      };

      const mockTicket = {
        getPayload: () => mockPayload,
      };

      const { OAuth2Client } = require('google-auth-library');
      OAuth2Client.prototype.verifyIdToken = jest.fn().mockResolvedValue(mockTicket);

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await AuthService.verifyGoogleTokenAndLogin('valid-token');

      expect(mockUser.googleId).toBe(mockPayload.sub);
      expect(mockUser.name).toBe(mockPayload.name);
      expect(mockUser.picture).toBe(mockPayload.picture);
      expect(save).toHaveBeenCalled();
      expect(result.user.picture).toBe(mockPayload.picture);
    });

    test('should create new user for Google login if not exists', async () => {
      const mockPayload = {
        sub: 'google123',
        email: 'newgoogle@example.com',
        name: 'New Google User',
        picture: 'https://example.com/picture.jpg',
      };

      const mockNewUser = {
        _id: 'user456',
        googleId: 'google123',
        email: mockPayload.email,
        name: mockPayload.name,
        picture: mockPayload.picture,
        uniqueId: 'XYZ98765',
      };

      const mockTicket = {
        getPayload: () => mockPayload,
      };

      const { OAuth2Client } = require('google-auth-library');
      OAuth2Client.prototype.verifyIdToken = jest.fn().mockResolvedValue(mockTicket);

      (User.findOne as jest.Mock)
        .mockResolvedValueOnce(null) // User doesn't exist
        .mockResolvedValueOnce(null); // Unique ID doesn't exist
      (User.create as jest.Mock).mockResolvedValue(mockNewUser);

      const result = await AuthService.verifyGoogleTokenAndLogin('valid-token');

      expect(result.user).toEqual(mockNewUser);
      expect(result.token).toBeDefined();
      expect(User.create).toHaveBeenCalled();
    });

    test('should throw error for invalid Google token', async () => {
      const { OAuth2Client } = require('google-auth-library');
      OAuth2Client.prototype.verifyIdToken = jest.fn().mockRejectedValue(
        new Error('Invalid token')
      );

      await expect(AuthService.verifyGoogleTokenAndLogin('invalid-token')).rejects.toThrow();
    });
  });

  describe('generateToken', () => {
    test('should generate valid JWT token', () => {
      const userId = 'user123';
      const token = (AuthService as any).generateToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('email verification', () => {
    describe('verifyEmail', () => {
      test('should verify email successfully with correct code', async () => {
        const email = 'test@example.com';
        const code = '123456';
        
        const save = jest.fn().mockResolvedValue(undefined);
        const mockUser = {
          _id: 'user123',
          email,
          name: 'Test User',
          isEmailVerified: false,
          emailVerificationToken: code,
          emailVerificationExpires: new Date(Date.now() + 10000),
          save,
          toObject: function() { return this; }
        };

        (User.findOne as jest.Mock).mockReturnValue({
          select: jest.fn().mockResolvedValue(mockUser),
        });

        const result = await AuthService.verifyEmail(email, code);
        
        expect(result.isEmailVerified).toBe(true);
        expect(result.emailVerificationToken).toBeUndefined();
        expect(result.emailVerificationExpires).toBeUndefined();
        expect(save).toHaveBeenCalled();
      });

      test('should throw error if user does not exist', async () => {
        (User.findOne as jest.Mock).mockReturnValue({
          select: jest.fn().mockResolvedValue(null),
        });

        await expect(AuthService.verifyEmail('nonexistent@example.com', '123456')).rejects.toThrow('User not found');
      });

      test('should throw error if email already verified', async () => {
        const mockUser = {
          _id: 'user123',
          email: 'test@example.com',
          isEmailVerified: true,
          toObject: function() { return this; }
        };

        (User.findOne as jest.Mock).mockReturnValue({
          select: jest.fn().mockResolvedValue(mockUser),
        });

        await expect(AuthService.verifyEmail('test@example.com', '123456')).rejects.toThrow('Email is already verified');
      });

      test('should throw error if verification code is incorrect', async () => {
        const mockUser = {
          _id: 'user123',
          email: 'test@example.com',
          isEmailVerified: false,
          emailVerificationToken: '123456',
          emailVerificationExpires: new Date(Date.now() + 10000),
          toObject: function() { return this; }
        };

        (User.findOne as jest.Mock).mockReturnValue({
          select: jest.fn().mockResolvedValue(mockUser),
        });

        await expect(AuthService.verifyEmail('test@example.com', '654321')).rejects.toThrow('Invalid verification code');
      });

      test('should throw error if verification code has expired', async () => {
        const mockUser = {
          _id: 'user123',
          email: 'test@example.com',
          isEmailVerified: false,
          emailVerificationToken: '123456',
          emailVerificationExpires: new Date(Date.now() - 10000),
          toObject: function() { return this; }
        };

        (User.findOne as jest.Mock).mockReturnValue({
          select: jest.fn().mockResolvedValue(mockUser),
        });

        await expect(AuthService.verifyEmail('test@example.com', '123456')).rejects.toThrow('Verification code has expired');
      });
    });

    describe('resendVerificationCode', () => {
      test('should resend verification code successfully', async () => {
        const email = 'test@example.com';
        const save = jest.fn().mockResolvedValue(undefined);
        const mockUser = {
          _id: 'user123',
          email,
          name: 'Test User',
          isEmailVerified: false,
          save
        };

        (User.findOne as jest.Mock).mockResolvedValue(mockUser);

        await AuthService.resendVerificationCode(email);
        
        expect(mockUser.emailVerificationToken).toBeDefined();
        expect(mockUser.emailVerificationToken).toHaveLength(6);
        expect(mockUser.emailVerificationExpires).toBeDefined();
        expect(save).toHaveBeenCalled();
      });

      test('should throw error if user not found', async () => {
        (User.findOne as jest.Mock).mockResolvedValue(null);

        await expect(AuthService.resendVerificationCode('nonexistent@example.com')).rejects.toThrow('User not found');
      });

      test('should throw error if already verified', async () => {
        const mockUser = {
          _id: 'user123',
          email: 'test@example.com',
          isEmailVerified: true
        };

        (User.findOne as jest.Mock).mockResolvedValue(mockUser);

        await expect(AuthService.resendVerificationCode('test@example.com')).rejects.toThrow('Email is already verified');
      });
    });
  });

  describe('token revocation blacklist redesign', () => {
    test('should blacklist token with remaining validity time on logout', async () => {
      const { redisClient } = require('../../shared/redis/connection');
      const token = (AuthService as any).generateToken('user123');
      
      await AuthService.logout(token);
      
      expect(redisClient.set).toHaveBeenCalledWith(
        expect.stringContaining('blacklist:'),
        '1',
        expect.objectContaining({ EX: expect.any(Number) })
      );
    });

    test('should identify blacklisted token', async () => {
      const { redisClient } = require('../../shared/redis/connection');
      redisClient.get.mockResolvedValueOnce('1');

      const isBlacklisted = await AuthService.isTokenBlacklisted('some-revoked-token');
      expect(isBlacklisted).toBe(true);
      expect(redisClient.get).toHaveBeenCalledWith('blacklist:some-revoked-token');
    });

    test('should return false if token is not blacklisted', async () => {
      const { redisClient } = require('../../shared/redis/connection');
      redisClient.get.mockResolvedValueOnce(null);

      const isBlacklisted = await AuthService.isTokenBlacklisted('some-valid-token');
      expect(isBlacklisted).toBe(false);
    });
  });
});
