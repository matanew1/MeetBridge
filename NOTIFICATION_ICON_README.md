# Notification Icon Setup

## Why you see Expo Go icon in notifications

When using **Expo Go**, all notifications will show the Expo Go icon because you're running inside the Expo Go app. This is expected behavior.

## How to see your custom icon

You need to build a **standalone app** (development build or production build) using EAS Build.

### Option 1: Development Build (Recommended for testing)

```bash
# Install EAS CLI if you haven't
npm install -g eas-cli

# Build for Android
eas build --profile development --platform android

# Build for iOS
eas build --profile development --platform ios
```

### Option 2: Preview/Production Build

```bash
# Preview build
eas build --profile preview --platform android
eas build --profile preview --platform ios

# Production build
eas build --profile production --platform android
eas build --profile production --platform ios
```

## Notification Icon Requirements

### Android

- Icon should be a **white silhouette** on transparent background
- Format: PNG
- Size: 96x96 pixels (for xxxhdpi)
- The icon is already configured in `app.json`:
  - `notification.icon`: "./assets/images/icon.png"
  - `android.notification.icon`: Uses the same icon
  - `android.notification.color`: "#FF69B4" (pink tint)

### iOS

- Uses the app icon automatically
- No additional configuration needed

## Current Configuration (Already Done ✅)

```json
{
  "notification": {
    "icon": "./assets/images/icon.png",
    "color": "#FF69B4"
  },
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "./assets/images/icon.png",
      "backgroundColor": "#FF6B9D"
    }
  },
  "plugins": [
    [
      "expo-notifications",
      {
        "icon": "./assets/images/icon.png",
        "color": "#FF69B4",
        "sounds": ["./assets/audios/message.mp3"]
      }
    ]
  ]
}
```

## What happens in Expo Go vs Standalone

| Feature             | Expo Go      | Standalone Build |
| ------------------- | ------------ | ---------------- |
| Notification Icon   | Expo Go icon | Your custom icon |
| Custom Sounds       | May not work | Works            |
| Background Location | Limited      | Full support     |
| App Name            | Expo Go      | MeetBridge       |

## Summary

**The notification icon configuration is correct!** You just need to build a standalone app to see it. While testing with Expo Go, the Expo icon is expected.
