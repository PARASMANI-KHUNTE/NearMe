import { User, IUser } from './user.model';

export class UserService {
  static async getProfile(userId: string): Promise<IUser | null> {
    return User.findById(userId).select('-__v');
  }

  static async updateSettings(
    userId: string,
    settings: {
      radius?: number;
      locationSharingEnabled?: boolean;
      shareLocation?: boolean;
      invisibleMode?: boolean;
    }
  ): Promise<IUser | null> {
    const updateData: Record<string, any> = {};
    if (settings.radius !== undefined) {
      // Clamp radius to 1m - 5km
      const clampedRadius = Math.max(1, Math.min(5000, settings.radius));
      updateData['settings.radius'] = clampedRadius;
    }
    const locationSharingEnabled = settings.locationSharingEnabled ?? settings.shareLocation;
    if (locationSharingEnabled !== undefined) {
      updateData['settings.locationSharingEnabled'] = locationSharingEnabled;
    }
    if (settings.invisibleMode !== undefined) {
      updateData['settings.invisibleMode'] = settings.invisibleMode;
    }

    return User.findByIdAndUpdate(userId, { $set: updateData }, { new: true }).select('-__v');
  }

  static async searchUsers(query: string): Promise<IUser[]> {
    // Escape regex special chars to prevent injection, then do safe prefix match
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return User.find({
      uniqueId: { $regex: `^${escapedQuery}`, $options: 'i' },
    })
      .select('name email picture uniqueId')
      .limit(20);
  }
}
