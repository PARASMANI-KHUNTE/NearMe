import { Location } from '../location/location.model';
import { FriendService } from '../friends/friend.service';
import { FriendRequest } from '../friends/friend-request.model';
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
    if (!user || !user.settings?.locationSharingEnabled || user.settings?.invisibleMode) {
      logger.debug({ userId }, 'Proximity skipped - sharing disabled or invisible mode on');
      return;
    }

    const userRadius = user.settings?.radius || 5000;
    const friends = await FriendService.listFriends(userId);
    if (friends.length === 0) return;

    const visibleFriends = friends.filter(
      (friend) => friend.settings?.locationSharingEnabled && !friend.settings?.invisibleMode
    );
    if (visibleFriends.length === 0) return;

    const friendIds = visibleFriends.map((friend) => friend._id.toString());
    const friendsMap = new Map(visibleFriends.map((friend) => [friend._id.toString(), friend]));

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
      if (!friend) continue;

      const hasMutualConsent = await ProximityService.hasProximityConsent(userId, friendId);
      if (!hasMutualConsent) {
        logger.debug({ userId, friendId }, 'Proximity skipped - mutual consent missing');
        continue;
      }

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

  private static async hasProximityConsent(userA: string, userB: string): Promise<boolean> {
    const request = await FriendRequest.findOne({
      $or: [
        { requesterId: userA, recipientId: userB },
        { requesterId: userB, recipientId: userA },
      ],
      status: 'accepted',
    });

    if (!request) return false;
    return request.requesterProximityConsent && request.recipientProximityConsent;
  }

  static async triggerProximityAlert(userA: string, userB: string, distance: number): Promise<void> {
    const redis = getRedis();
    // Deterministic key, same regardless of who triggered who.
    const cooldownKey = `proximity:cooldown:${[userA, userB].sort().join('_')}`;

    // Atomic SET NX EX only sets if key does not exist.
    const acquired = await redis.set(cooldownKey, '1', {
      EX: NOTIFICATION_COOLDOWN_SECONDS,
      NX: true,
    });

    if (!acquired) {
      logger.debug({ userA, userB }, 'Proximity alert skipped - cooldown active');
      return;
    }

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
   * Haversine formula for approximate distance between two [lng, lat] points in meters.
   */
  static calculateApproxDistance(coords1: [number, number], coords2: [number, number]): number {
    const R = 6371e3;
    const [lon1, lat1] = coords1;
    const [lon2, lat2] = coords2;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }
}
