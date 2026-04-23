import { Location } from '../location/location.model';
import { FriendService } from '../friends/friend.service';
import { NotificationService } from '../notifications/notification.service';
import { User } from '../users/user.model';
import { getRedis } from '../../shared/redis/connection';
import { logger } from '../../shared/logger/logger';

const NOTIFICATION_COOLDOWN_SECONDS = 600; // 10 minutes

export class ProximityService {
  /**
   * Called whenever a user updates their location.
   * Finds nearby friends and triggers proximity alerts with spam prevention.
   */
  static async handleLocationUpdate(userId: string, coordinates: [number, number]): Promise<void> {
    const user = await User.findById(userId).select('settings');
    if (!user || !user.settings?.locationSharingEnabled) {
      logger.debug({ userId }, 'Proximity skipped — location sharing disabled');
      return;
    }

    const userRadius = user.settings?.radius || 5000;
    const friends = await FriendService.listFriends(userId);
    if (friends.length === 0) return;

    const friendIds = friends.map((f) => f._id.toString());
    const friendsMap = new Map(friends.map((f) => [f._id.toString(), f]));

    // Query nearby friend locations using $near
    const nearbyLocations = await Location.find({
      userId: { $in: friendIds },
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates },
          $maxDistance: userRadius,
        },
      },
    });

    for (const loc of nearbyLocations) {
      const friendId = loc.userId.toString();
      const friend = friendsMap.get(friendId);
      if (!friend || !friend.settings?.locationSharingEnabled) continue;

      const friendRadius = friend.settings?.radius || 5000;
      const distance = ProximityService.calculateApproxDistance(
        coordinates,
        loc.location.coordinates as [number, number]
      );

      if (distance <= userRadius && distance <= friendRadius) {
        await ProximityService.triggerProximityAlert(userId, friendId, distance);
      }
    }
  }

  static async triggerProximityAlert(userA: string, userB: string, distance: number): Promise<void> {
    const redis = getRedis();
    // Deterministic key — same regardless of who triggered who
    const cooldownKey = `proximity:cooldown:${[userA, userB].sort().join('_')}`;

    // Atomic SET NX EX — only sets if key does NOT exist (cooldown not active)
    const acquired = await redis.set(cooldownKey, '1', {
      EX: NOTIFICATION_COOLDOWN_SECONDS,
      NX: true,
    });

    if (!acquired) {
      logger.debug({ userA, userB }, 'Proximity alert skipped — cooldown active');
      return;
    }

    // Round to nearest 100m for privacy
    const approxDistance = Math.round(distance / 100) * 100;

    logger.info({ userA, userB, approxDistance }, 'Proximity alert triggered');

    await Promise.all([
      NotificationService.createAndEmit(
        userA,
        'proximity_alert',
        `A friend is nearby (~${approxDistance}m away)`,
        { friendId: userB, approxDistance },
        userB
      ),
      NotificationService.createAndEmit(
        userB,
        'proximity_alert',
        `A friend is nearby (~${approxDistance}m away)`,
        { friendId: userA, approxDistance },
        userA
      ),
    ]);
  }

  /**
   * Haversine formula — approximate distance between two [lng, lat] points in meters.
   */
  static calculateApproxDistance(coords1: [number, number], coords2: [number, number]): number {
    const R = 6371e3;
    const [lon1, lat1] = coords1;
    const [lon2, lat2] = coords2;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }
}
