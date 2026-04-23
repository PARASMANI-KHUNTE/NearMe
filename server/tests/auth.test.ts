import { AuthService } from '../src/modules/auth/auth.service';
import { User } from '../src/modules/users/user.model';
import mongoose from 'mongoose';
import { OAuth2Client } from 'google-auth-library';

// Mock google auth
jest.mock('google-auth-library');

describe('Auth Service', () => {
  it('should verify google token and return user and jwt', async () => {
    // Setup mock return
    OAuth2Client.prototype.verifyIdToken = jest.fn().mockResolvedValue({
      getPayload: () => ({ sub: '123', email: 'test@test.com', name: 'Test' }),
    });
    
    // Mock user model
    User.findOne = jest.fn().mockResolvedValue(null) as any;
    User.create = jest.fn().mockResolvedValue({ _id: new mongoose.Types.ObjectId(), googleId: '123' }) as any;

    const result = await AuthService.verifyGoogleTokenAndLogin('dummy_token');
    
    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('token');
  });
});
