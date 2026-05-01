// @ts-nocheck
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { LocationService } from './location.service';
import { Location } from './location.model';
import { ProximityService } from '../proximity/proximity.service';
import { getRedis } from '../../shared/redis/connection';

// Mock dependencies
jest.mock('./location.model');
jest.mock('../proximity/proximity.service');
jest.mock('../../shared/redis/connection');
jest.mock('../../shared/logger/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('LocationService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('updateLocation', () => {
    test('should update location when movement exceeds threshold', async () => {
      const userId = 'user123';
      const coordinates: [number, number] = [-73.9857, 40.7484]; // NYC

      const mockRedis = {
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
      };

      const mockLocation = {
        _id: 'loc123',
        userId,
        location: {
          type: 'Point',
          coordinates,
        },
        expiresAt: new Date(Date.now() + 3600000),
      };

      (getRedis as jest.Mock).mockReturnValue(mockRedis);
      (Location.findOneAndUpdate as jest.Mock).mockResolvedValue(mockLocation);
      (ProximityService.handleLocationUpdate as jest.Mock).mockResolvedValue(undefined);

      const result = await LocationService.updateLocation(userId, coordinates);

      expect(result).toEqual(mockLocation);
      expect(Location.findOneAndUpdate).toHaveBeenCalled();
      expect(mockRedis.set).toHaveBeenCalled();
      expect(ProximityService.handleLocationUpdate).toHaveBeenCalledWith(userId, coordinates);
    });

    test('should skip update when movement below threshold', async () => {
      const userId = 'user123';
      const coordinates: [number, number] = [-73.9857, 40.7484];
      const lastCoordinates: [number, number] = [-73.9856, 40.7483]; // Very close

      const mockRedis = {
        get: jest.fn().mockResolvedValue(JSON.stringify(lastCoordinates)),
        set: jest.fn().mockResolvedValue('OK'),
      };

      (getRedis as jest.Mock).mockReturnValue(mockRedis);
      (ProximityService.calculateApproxDistance as jest.Mock).mockReturnValue(10);

      const result = await LocationService.updateLocation(userId, coordinates);

      expect(result).toBeNull();
      expect(Location.findOneAndUpdate).not.toHaveBeenCalled();
      expect(mockRedis.set).not.toHaveBeenCalled();
    });

    test('should handle Redis errors gracefully', async () => {
      const userId = 'user123';
      const coordinates: [number, number] = [-73.9857, 40.7484];

      const mockRedis = {
        get: jest.fn().mockRejectedValue(new Error('Redis error')),
        set: jest.fn().mockResolvedValue('OK'),
      };

      const mockLocation = {
        _id: 'loc123',
        userId,
        location: {
          type: 'Point',
          coordinates,
        },
        expiresAt: new Date(Date.now() + 3600000),
      };

      (getRedis as jest.Mock).mockReturnValue(mockRedis);
      (Location.findOneAndUpdate as jest.Mock).mockResolvedValue(mockLocation);
      (ProximityService.handleLocationUpdate as jest.Mock).mockResolvedValue(undefined);

      const result = await LocationService.updateLocation(userId, coordinates);

      expect(result).toEqual(mockLocation);
      expect(Location.findOneAndUpdate).toHaveBeenCalled();
    });
  });

  describe('getNearbyFriends', () => {
    test('should find visible friends within specified radius', async () => {
      const coordinates: [number, number] = [-73.9857, 40.7484];
      const radiusMeters = 1000;
      const friendIds = ['user1', 'user2'];

      const mockNearbyUsers = [
        {
          _id: 'user1',
          userId: 'user1',
          location: {
            type: 'Point',
            coordinates: [-73.9856, 40.7483],
          },
        },
        {
          _id: 'user2',
          userId: 'user2',
          location: {
            type: 'Point',
            coordinates: [-73.9858, 40.7485],
          },
        },
      ];

      (Location.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockNearbyUsers),
      } as any);

      const result = await LocationService.getNearbyFriends(coordinates, radiusMeters, friendIds);

      expect(result).toEqual(mockNearbyUsers);
      expect(Location.find).toHaveBeenCalledWith({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates,
            },
            $maxDistance: radiusMeters,
          },
        },
        userId: { $in: friendIds },
      });
    });

    test('should return empty array when no friends nearby', async () => {
      const coordinates: [number, number] = [-73.9857, 40.7484];
      const radiusMeters = 100;
      const friendIds = ['user1'];

      (Location.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue([]),
      } as any);

      const result = await LocationService.getNearbyFriends(coordinates, radiusMeters, friendIds);

      expect(result).toEqual([]);
    });
  });
});
