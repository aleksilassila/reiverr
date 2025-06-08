# Android TV App for Reiverr

This Android TV app packages the Reiverr frontend directly into the APK, similar to the Tizen implementation. The app loads the bundled frontend in a WebView and communicates with your Reiverr backend server.

## Quick Build Verification

To verify your build environment and create the APK in one step:

```bash
# From the project root
./android-tv/verify-build.sh
```

This script will:
- Check all prerequisites
- Build the frontend
- Build the APK
- Report the final APK size and location

## How to Build & Install

### Prerequisites
- Android SDK or Android Studio
- Android TV device or emulator
- Reiverr backend server running (see main README)

### Build Steps

1. **Build the Frontend for TV**
   ```bash
   # From the project root
   npm run build:androidtv
   ```

2. **Build the APK**
   ```bash
   # From the android-tv/ directory
   ./gradlew assembleDebug
   ```
   
   Or if you have Android Studio:
   - Open the `android-tv/` folder in Android Studio
   - Click "Build > Build Bundle(s) / APK(s) > Build APK(s)"

3. **Install on Android TV**
   - Transfer the APK to your Android TV (via USB, network, or ADB)
   - Enable "Install unknown apps" in TV settings
   - Install the APK using a file manager or via ADB:
     ```bash
     adb install android-tv/app/build/outputs/apk/debug/app-debug.apk
     ```

4. **Configure Backend Connection**
   - Launch "Reiverr" from your TV's app list
   - The app will prompt you to configure your backend server URL
   - Enter your Reiverr server address (e.g., `http://192.168.1.100:9494`)

## Features
- ✅ Bundled frontend (no external server dependency for UI)
- ✅ Android TV remote control support
- ✅ Landscape orientation optimized for TV
- ✅ Hardware back button support
- ✅ Leanback launcher compatibility

## Build Status
✅ **Successfully tested** - APK builds and packages correctly (~7.6MB)

## Notes
- The frontend is bundled into the APK, but you still need a separate Reiverr backend server for media sources and API functionality
- Your TV and the Reiverr backend server should be on the same network (unless your server is publicly accessible)
- The app uses WebView to display the Reiverr interface, providing full compatibility with the web version
- For advanced features (deep linking, better remote control integration), further development is welcome

## Technical Details
- **Min SDK Version**: API 21 (Android 5.0)
- **Target SDK Version**: API 33 (Android 13)
- **APK Size**: ~7.6MB (debug build)
- **Architecture**: Universal APK (supports all architectures)

---

For help with the main Reiverr application, see the [main README](../README.md).
