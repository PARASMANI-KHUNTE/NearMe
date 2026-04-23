# Google OAuth Configuration Guide

## Prerequisites
- Google Account
- Google Cloud Console access
- Your app's package name and domains

## Step 1: Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing "NearMe" project
3. Enable required APIs:
   - **Google+ API** (for Google Sign-In)
   - **People API** (optional, for user profile data)

## Step 2: Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type
3. Fill app information:
   - **App name:** NearMe
   - **User support email:** Your email
   - **Developer contact information:** Your email
4. Add scopes (optional but recommended):
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
5. Add test users if needed
6. Save and continue

## Step 3: Create OAuth Client IDs

### For Web App
1. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
2. Choose **Web application**
3. Name: "NearMe Web"
4. Authorized JavaScript origins:
   - `http://localhost:5173` (development)
   - `https://your-production-domain.com` (production)
5. Authorized redirect URIs:
   - `http://localhost:5173` (development)
   - `https://your-production-domain.com` (production)
6. Create → Copy the Client ID

### For Android App
1. Create new OAuth client ID → **Android**
2. Name: "NearMe Android"
3. Package name: `com.parasmani.nearme` (from your app.json)
4. SHA-1 certificate fingerprint:
   - For development: Get from Expo: `expo fetch:android:hashes`
   - For production: From your keystore
5. Create → Copy the Client ID

### For iOS App
1. Create new OAuth client ID → **iOS**
2. Name: "NearMe iOS"
3. Bundle ID: `com.parasmani.nearme` (or your iOS bundle ID)
4. App Store ID (optional)
5. Team ID (optional)
6. Create → Copy the Client ID

## Step 4: Update Your Code

### Web App (`web/src/services/googleAuthService.ts`)
```typescript
private static clientId = 'YOUR_WEB_CLIENT_ID_HERE';
```

### Mobile App (`mobile/app.json`)
```json
{
  "ios": {
    "clientId": "YOUR_IOS_CLIENT_ID_HERE"
  },
  "android": {
    "clientId": "YOUR_ANDROID_CLIENT_ID_HERE"
  }
}
```

### Mobile App (`mobile/src/screens/auth/LoginScreen.tsx`)
```typescript
const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
  clientId: Platform.OS === 'ios'
    ? 'YOUR_IOS_CLIENT_ID_HERE'
    : 'YOUR_ANDROID_CLIENT_ID_HERE',
});
```

## Step 5: Download Config Files

### For Android
- Download `google-services.json` from Firebase Console (if using Firebase) OR
- The OAuth client ID is sufficient for expo-auth-session

### For iOS
- Download `GoogleService-Info.plist` if needed

## Step 6: Test Configuration

### Web App
1. Run `npm run dev`
2. Try Google login
3. Check browser console for errors

### Mobile App
1. Run `expo start`
2. Test Google login on device
3. Check Expo logs for errors

## Troubleshooting

### Common Issues
1. **"redirect_uri_mismatch"**
   - Check authorized redirect URIs match exactly
   - For web: Include port numbers if needed

2. **"invalid_client"**
   - Verify client ID is correct
   - Check if OAuth consent screen is published

3. **"access_denied"**
   - User must grant permissions
   - Check if test users are added

4. **Mobile SHA-1 Issues**
   - Use `expo fetch:android:hashes` for correct fingerprint
   - Update when switching keystores

### Publishing App
1. Before publishing, go to OAuth consent screen
2. Change to "Production" status
3. Add privacy policy and terms of service URLs
4. Submit for verification if needed

## Security Notes
- Never commit client IDs to version control
- Use environment variables for production
- Regularly rotate credentials if compromised
- Monitor OAuth usage in Cloud Console

## Support
- [Google Sign-In for Web](https://developers.google.com/identity/sign-in/web/sign-in)
- [Expo Auth Session](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Google Cloud Console Help](https://cloud.google.com/support)