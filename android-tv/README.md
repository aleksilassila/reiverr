# Android TV App for Reiverr

This Android TV app packages the Reiverr frontend directly into the APK, similar to the Tizen implementation. The app loads the bundled frontend in a WebView and communicates with your Reiverr backend server.

## Docker Build & Deploy (Recommended)

The easiest way to build and deploy the Android TV app is using Docker, exactly like the Tizen setup:

```bash
# Build and deploy to your Android TV device (from project root)
npm run deploy:androidtv <ANDROID_TV_IP>

# Or manually with Docker
docker build -f ./android-tv/Dockerfile -t reiverr-androidtv .
docker run --rm reiverr-androidtv <ANDROID_TV_IP>

# Build frontend only (no Docker)
npm run build:androidtv
```

### Docker Prerequisites
- Docker installed on your system
- Android TV with ADB debugging enabled (Settings > Developer Options)
- Network access to your Android TV device

### Docker Features
- ✅ Complete build environment setup (no local Android SDK required)
- ✅ Automatic frontend building and APK packaging
- ✅ One-command deployment to Android TV
- ✅ Consistent builds across different machines
- ✅ Multi-stage build optimization
- ✅ **Same workflow as Tizen deployment** (`npm run deploy:tizen` vs `npm run deploy:androidtv`)

### Setup Your Android TV
1. Enable Developer Options: Settings > About > Build (tap 7 times)
2. Enable ADB Debugging: Settings > Developer Options > USB/Network debugging
3. Accept ADB connection prompt when first connecting

### Usage Examples
```bash
# Build frontend only (same as Tizen)
npm run build:androidtv      # Builds frontend to android-tv/dist/

# Deploy to Android TV (same pattern as Tizen)
npm run deploy:androidtv 192.168.1.100

# Manual Docker workflow
docker build -f ./android-tv/Dockerfile -t reiverr-androidtv .
docker run --rm reiverr-androidtv 192.168.1.100
```

📖 **Detailed Docker documentation**: [DOCKER.md](./DOCKER.md)

## Manual Build & Install (Alternative)

If you prefer to build manually without Docker:

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
