import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import { LocationService } from './location.service';
import { Location } from './location.model';
import { FriendService } from '../friends/friend.service';
import { ProximityService } from '../proximity/proximity.service';

const APPROX_LOCATION_PRECISION = 3;
const APPROX_LOCATION_METERS = 150;

type PopulatedLocationUser = {
  _id: { toString(): string };
  name?: string;
  picture?: string;
};

const roundCoordinateForPrivacy = (value: number): number =>
  Number(value.toFixed(APPROX_LOCATION_PRECISION));

const roundDistanceForPrivacy = (meters: number): number =>
  Math.max(100, Math.round(meters / 100) * 100);

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export class LocationController {
  static async updateLocation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user._id.toString();
      const { longitude, latitude } = req.body;

      if (longitude === undefined || latitude === undefined) {
        res.status(400).json({ success: false, message: 'longitude and latitude are required' });
        return;
      }

      const location = await LocationService.updateLocation(userId, [longitude, latitude]);

      res.status(200).json({
        success: true,
        data: location,
        message: 'Location updated successfully',
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: getErrorMessage(error, 'Error updating location'),
      });
    }
  }

  static async getNearbyUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user._id.toString();
      const { lat, lng, radius } = req.query;

      if (!lat || !lng) {
        res.status(400).json({ success: false, message: 'lat and lng query parameters are required' });
        return;
      }

      const coordinates: [number, number] = [parseFloat(lng as string), parseFloat(lat as string)];
      
      // Validate coordinates
      if (isNaN(coordinates[0]) || isNaN(coordinates[1])) {
        res.status(400).json({ success: false, message: 'Invalid coordinates' });
        return;
      }

      // Radius: 1 meter to 5km (5000 meters)
      const MIN_RADIUS = 1;
      const MAX_RADIUS = 5000;
      let radiusMeters = radius ? parseInt(radius as string) : 1000;
      
      // Clamp radius to valid range
      radiusMeters = Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, radiusMeters));

      // Get user's friends
      const friends = await FriendService.listFriends(userId);
      const visibleFriends = friends.filter(
        f => f.settings?.locationSharingEnabled && !f.settings?.invisibleMode
      );
      const friendIds = visibleFriends.map(f => f._id.toString());

      if (friendIds.length === 0) {
        res.status(200).json({ success: true, data: [] });
        return;
      }

      // Get nearby users - ONLY friends (privacy fix)
      const locations = await LocationService.getNearbyFriends(coordinates, radiusMeters, friendIds);

      // Map to client-friendly format
      const nearbyUsers = locations
        .filter(loc => Boolean(loc.userId))
        .map(loc => {
          const friend = loc.userId as unknown as PopulatedLocationUser;
          const friendCoordinates = loc.location.coordinates as [number, number];
          const distance = ProximityService.calculateApproxDistance(coordinates, friendCoordinates);

          return {
            id: friend._id.toString(),
            name: friend.name,
            picture: friend.picture,
            longitude: roundCoordinateForPrivacy(friendCoordinates[0]),
            latitude: roundCoordinateForPrivacy(friendCoordinates[1]),
            distance: roundDistanceForPrivacy(distance),
            approximate: true,
            precisionMeters: APPROX_LOCATION_METERS,
          };
        });

      res.status(200).json({
        success: true,
        data: nearbyUsers,
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: getErrorMessage(error, 'Error fetching nearby users'),
      });
    }
  }

  static async getFriendsLocationStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user._id.toString();
      
      // Get user's friends
      const friends = await FriendService.listFriends(userId);
      
      if (friends.length === 0) {
        res.status(200).json({ success: true, data: [] });
        return;
      }

      const friendIds = friends.map(f => f._id.toString());

      // Get locations for all friends
      const locations = await Location.find({ 
        userId: { $in: friendIds },
      });

      // Map to response
      const locationStatus = friends.map(friend => {
        const loc = locations.find(l => l.userId.toString() === friend._id.toString());
        const isVisible = friend.settings?.locationSharingEnabled && !friend.settings?.invisibleMode;
        const isNearby = isVisible && loc && loc.expiresAt && loc.expiresAt > new Date();
        return {
          id: friend._id.toString(),
          name: friend.name,
          picture: friend.picture,
          status: isNearby ? 'nearby' : 'offline',
        };
      });

      res.status(200).json({
        success: true,
        data: locationStatus,
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: getErrorMessage(error, 'Error fetching friends location status'),
      });
    }
  }
}
