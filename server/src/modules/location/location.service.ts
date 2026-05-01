import { Location, ILocation } from './location.model';
import { ProximityService } from '../proximity/proximity.service';
import { getRedis } from '../../shared/redis/connection';
import { logger } from '../../shared/logger/logger';

const MOVEMENT_THRESHOLD_METERS = 50;
const LOCATION_CACHE_TTL = 3600; // 1 hour, matching the Location TTL index

export class LocationService {
  /**
   * Updates or creates the user's current location.
   * - Checks Redis cache for last known coordinates
   * - Skips DB write + proximity if user hasn't moved > 50m
   * - Resets TTL expiry to 1 hour
   */
  static async updateLocation(userId: string, coordinates: [number, number]): Promise<ILocation | null> {
    const redis = getRedis();
    const cacheKey = `location:last:${userId}`;

    let cached: string | null = null;
    try {
      cached = await redis.get(cacheKey);
    } catch (err) {
      logger.warn({ err, userId }, 'Location cache read failed');
    }

    if (cached) {
      const lastLoc: [number, number] = JSON.parse(cached);
      const distanceMoved = ProximityService.calculateApproxDistance(lastLoc, coordinates);

      if (distanceMoved < MOVEMENT_THRESHOLD_METERS) {
        logger.debug({ userId, distanceMoved }, 'Location update skipped - movement below threshold');
        return null;
      }
    }

    // 2. Upsert location in MongoDB
    const expiresAt = new Date(Date.now() + LOCATION_CACHE_TTL * 1000);
    const locationRecord = await Location.findOneAndUpdate(
      { userId },
      { userId, location: { type: 'Point', coordinates }, expiresAt },
      { upsert: true, returnDocument: 'after' }
    );

    try {
      await redis.set(cacheKey, JSON.stringify(coordinates), { EX: LOCATION_CACHE_TTL });
    } catch (err) {
      logger.warn({ err, userId }, 'Location cache write failed');
    }

    logger.info({ userId, coordinates }, 'Location updated');

    // 4. Trigger proximity engine asynchronously (fire-and-forget)
    ProximityService.handleLocationUpdate(userId, coordinates).catch((err) => {
      logger.error({ err, userId }, 'Proximity engine error');
    });

    return locationRecord;
  }

  /**
   * Finding nearby friends within a radius (meters)
   * Only returns users who are friends with the requesting user
   */
  static async getNearbyFriends(coordinates: [number, number], radiusMeters: number, friendIds: string[]): Promise<ILocation[]> {
    return Location.find({
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
    }).populate({
      path: 'userId',
      select: 'name picture settings',
      match: {
        'settings.locationSharingEnabled': true,
        'settings.invisibleMode': { $ne: true },
      },
    });
  }
}
