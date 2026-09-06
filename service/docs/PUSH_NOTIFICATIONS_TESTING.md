# Testing Push Notifications

Push notifications CANNOT be tested on the iOS Simulator — Apple
does not support APNs tokens in the simulator environment. Expo
push tokens will fail to register.

To test push notifications:
1. Use a physical iOS or Android device
2. Run via Expo Go for quick testing, OR
3. Build a development build (`eas build --profile development`)
   for full native module support

Android emulators DO support push notifications if Google Play
Services is installed on the AVD image.
