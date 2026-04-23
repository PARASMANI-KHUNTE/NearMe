import { User, IUser } from './user.model';

export class UserService {
  static async getProfile(userId: string): Promise<IUser | null> {
    return User.findById(userId).select('-__v');
  }

  static async updateSettings(
    userId: string,
    settings: { radius?: number; locationSharingEnabled?: boolean }
  ): Promise<IUser | null> {
    const updateData: any = {};
    if (settings.radius !== undefined) updateData['settings.radius'] = settings.radius;
    if (settings.locationSharingEnabled !== undefined)
      updateData['settings.locationSharingEnabled'] = settings.locationSharingEnabled;

    return User.findByIdAndUpdate(userId, { $set: updateData }, { new: true }).select('-__v');
  }

  static async searchUsers(query: string): Promise<IUser[]> {
    return User.find({ name: { $regex: query, $options: 'i' } })
      .select('name picture uniqueId')
      .limit(10);
  }
}
