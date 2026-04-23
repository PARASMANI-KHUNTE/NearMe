import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import { LocationService } from './location.service';
import { Location } from './location.model';
import { FriendService } from '../friends/friend.service';
import { ILocation } from './location.model';

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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error updating location',
      });
    }
  }

  static async getNearbyUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user._id.toString();
      const { lat, lng, radius } = req.query;

      console.log('--- NEARBY REQUEST ---', { userId, lat, lng, radius });

      if (!lat || !lng) {
        res.status(400).json({ success: false, message: 'lat and lng query parameters are required' });
        return;
      }

      const coordinates: [number, number] = [parseFloat(lng as string), parseFloat(lat as string)];
      const radiusMeters = radius ? parseInt(radius as string) : 1000;

      console.log('Querying locations near:', coordinates, 'radius:', radiusMeters);

      const locations = await LocationService.getNearbyUsers(coordinates, radiusMeters);

      console.log('Found locations:', locations.length, locations.map(l => l.userId.toString()));

      // Map to client-friendly format (exclude the requesting user)
      const nearbyUsers = locations
        .filter(loc => loc.userId.toString() !== userId)
        .map(loc => ({
          id: loc.userId.toString(),
        }));

      console.log('Returning nearby:', nearbyUsers);

      res.status(200).json({
        success: true,
        data: nearbyUsers,
      });
    } catch (error: any) {
      console.error('getNearbyUsers error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching nearby users',
      });
    }
  }

  static async getFriendsLocationStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user._id.toString();
      
      // Get user's friends
      const friends = await FriendService.listFriends(userId);
      console.log('Friends for user:', friends.map(f => ({ id: f._id.toString(), name: f.name })));
      
      if (friends.length === 0) {
        res.status(200).json({ success: true, data: [] });
        return;
      }

      const friendIds = friends.map(f => f._id.toString());
      console.log('Friend IDs:', friendIds);

      // Get locations for all friends
      const locations = await Location.find({ 
        userId: { $in: friendIds },
      });
      console.log('Found locations:', locations.length, locations.map(l => ({ userId: l.userId.toString(), expiresAt: l.expiresAt })));

      // Map to response
      const locationStatus = friends.map(friend => {
        const loc = locations.find(l => l.userId.toString() === friend._id.toString());
        const isNearby = loc && loc.expiresAt && loc.expiresAt > new Date();
        console.log(`Friend ${friend.name}: loc=${!!loc}, expired=${loc ? loc.expiresAt <= new Date() : 'N/A'}`);
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
      console.error('getFriendsLocationStatus error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error fetching friends location status',
      });
    }
  }
}
