import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import { LocationService } from './location.service';

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
    console.log('--- FETCHING NEARBY USERS ---', req.query);
    try {
      const { lat, lng, radius } = req.query;

      if (!lat || !lng) {
        res.status(400).json({ success: false, message: 'lat and lng query parameters are required' });
        return;
      }

      const coordinates: [number, number] = [parseFloat(lng as string), parseFloat(lat as string)];
      const radiusMeters = radius ? parseInt(radius as string) : 1000;

      const locations = await LocationService.getNearbyUsers(coordinates, radiusMeters);

      res.status(200).json({
        success: true,
        data: locations,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching nearby users',
      });
    }
  }
}
