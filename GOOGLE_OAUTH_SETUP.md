# 🔥 Quick Google OAuth Fix - Redirect URI Error

Your Firebase project `meetbridge-b5cdc` is already set up! You need to configure the redirect URIs in Google Cloud Console.

## Error: redirect_uri_mismatch

The error occurs because `http://localhost:8081` is not registered as an authorized redirect URI in your Google OAuth configuration.

## Step 1: Go to Google Cloud Console

1. Visit: https://console.cloud.google.com/apis/credentials
2. Select your project (should be linked to Firebase project `meetbridge-b5cdc`)
3. Find your OAuth 2.0 Client ID (should start with `331612362377-`)
4. Click on the client ID to edit it

## Quick Debug: Find Your Exact Redirect URI

To find the exact redirect URI your app is using, add this temporary code to see what URI is generated:

1. Open your Expo development server terminal
2. Look for the QR code and note the URL format (like `exp://10.0.0.3:8081` or `exp://hqafkk4-anonymous-8081.exp.direct`)
3. The redirect URI will be one of these formats:
   - For localhost web: `http://localhost:8081/auth`
   - For Expo proxy: `https://auth.expo.io/@anonymous/meetbridge` or `https://auth.expo.io/@matanew1/meetbridge`

## Step 2: Add Authorized Redirect URIs

Add these redirect URIs to the **Authorized redirect URIs** section:

```
http://localhost:8081/auth
http://localhost:8082/auth
https://auth.expo.io/@anonymous/meetbridge
https://auth.expo.io/@matanew1/meetbridge
```

**🔥 IMPORTANT**: Google OAuth only accepts HTTP/HTTPS URLs, not custom schemes like `exp://`.

The updated configuration will now generate HTTPS redirect URIs compatible with Google's requirements.

**Why these URIs?**

- `http://localhost:8081/auth` - For web development
- `https://auth.expo.io/@anonymous/meetbridge` - For Expo Go (anonymous)
- `https://auth.expo.io/@matanew1/meetbridge` - For your Expo account

**Note:** The mobile app will now use Expo's HTTPS proxy instead of custom schemes.

**Note:** The updated mobile configuration uses `useProxy: true` which generates Expo-compatible redirect URIs automatically.

## Step 3: Save and Wait

1. Click **Save** in Google Cloud Console
2. Wait 5-10 minutes for changes to propagate
3. Restart your Expo development server

## Step 4: Update Firebase Auth Domain (Important!)

1. Go to: https://console.firebase.google.com/project/meetbridge-b5cdc/authentication/settings
2. In **Authorized domains**, add:
   - `localhost`
   - `auth.expo.io`
   - Any other domains you plan to use

## Step 5: Test Again

After completing steps 1-4, try the Google sign-in again. The redirect URI error should be resolved.

## Step 1: Get Google Client ID

1. Go to: https://console.firebase.google.com/project/meetbridge-b5cdc/authentication/providers
2. Click on **Google** provider (if not enabled, enable it first)
3. Look for **Web client ID** - should look like: `331612362377-xxxxxxxxxx.apps.googleusercontent.com`
4. Copy this ID

## Step 2: Configure Authorized Domains

🚨 **IMPORTANT**: The error message mentions your domain needs to be authorized:

1. Go to Firebase Console: https://console.firebase.google.com/project/meetbridge-b5cdc/authentication/settings
2. Click on **Authorized domains** tab
3. Add these domains:
   - `localhost` (for local development)
   - `exp.host` (for Expo)
   - `*.exp.direct` (for Expo tunnels)
4. Click **Add domain** for each

## Step 3: Update .env File

Replace this line in your `.env` file:

```
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here.googleusercontent.com
```

With your actual Web client ID:

```
EXPO_PUBLIC_GOOGLE_CLIENT_ID=331612362377-xxxxxxxxxx.apps.googleusercontent.com
```

## Step 3: Restart App

1. Stop the current Expo server (Ctrl+C)
2. Run `npm start` again
3. Test Google login

That's it! The 400 error should be fixed.

## If Google Provider is Not Enabled:

1. Go to Firebase Console > Authentication > Sign-in method
2. Click **Add new provider**
3. Select **Google**
4. Enable it and copy the Web client ID
5. Follow steps above

## Common Issues:

- Make sure you're using the **Web** client ID, not Android/iOS client ID
- Don't include any quotes around the client ID in .env file
- Restart Expo server after changing .env file
