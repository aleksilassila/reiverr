# Docker Setup for Android TV

This document describes the Docker-based build and deployment process for the Reiverr Android TV app.

## Overview

The Docker setup provides:
- ✅ Complete Android SDK environment in a container
- ✅ Automatic frontend building and asset bundling  
- ✅ APK compilation and signing
- ✅ One-command deployment to Android TV devices
- ✅ No local Android development setup required

## Architecture

The build process uses a multi-stage Docker approach:

1. **Frontend Builder Stage** (`node:18-alpine`)
   - Installs npm dependencies
   - Builds the frontend for TV platform using `npm run build:androidtv`
   - Copies built assets to Android project

2. **Android Builder Stage** (`eclipse-temurin:17-jdk-alpine`)
   - Installs Android SDK and build tools
   - Sets up Android development environment
   - Compiles the APK using Gradle
   - Outputs debug APK for deployment

3. **Deployment Stage** (`eclipse-temurin:17-jre-alpine`)
   - Installs ADB for device communication
   - Copies the built APK and installation script
   - Provides runtime for deployment to Android TV

## Usage

### Quick Deploy (Recommended)
```bash
# From project root - exactly like Tizen
npm run deploy:androidtv 192.168.1.100
```

### Frontend Build Only
```bash
# Build frontend assets only (no Docker)
npm run build:androidtv
```

### Manual Docker Commands
```bash
# Build the Docker image
docker build -f ./android-tv/Dockerfile -t reiverr-androidtv .

# Deploy to Android TV
docker run --rm reiverr-androidtv 192.168.1.100
```

## Prerequisites

### Docker Host
- Docker installed and running
- Network access to Android TV device

### Android TV Device
1. Enable Developer Options:
   - Go to Settings > Device Preferences > About
   - Click "Build" 7 times until developer mode is enabled

2. Enable ADB Debugging:
   - Go to Settings > Device Preferences > Developer Options
   - Enable "USB debugging" and "Network debugging"

3. Allow ADB Connection:
   - The first time you connect, approve the ADB connection prompt on your TV

## Build Process Details

### Environment Variables
- `ANDROID_HOME=/opt/android-sdk` - Android SDK location
- `ANDROID_SDK_ROOT=$ANDROID_HOME` - SDK root for compatibility

### Android SDK Components
- Platform Tools (ADB, Fastboot)
- Android API 33 Platform
- Build Tools 33.0.0

### Build Output
- APK Location: `/usr/src/app/reiverr-androidtv.apk`
- APK Size: ~7-8MB (debug build)
- Target SDK: API 33 (Android 13)
- Min SDK: API 21 (Android 5.0)

## Troubleshooting

### Connection Issues
```bash
# Check if device is accessible
adb connect <ANDROID_TV_IP>:5555
adb devices

# Manual APK install
adb -s <ANDROID_TV_IP>:5555 install reiverr-androidtv.apk
```

### Build Issues
```bash
# Check Docker build logs
docker build -f ./android-tv/Dockerfile -t reiverr-androidtv . --no-cache

# Run container interactively for debugging
docker run -it reiverr-androidtv /bin/bash
```

### APK Issues
```bash
# Verify APK integrity
docker run --rm reiverr-androidtv /bin/bash -c "ls -la /usr/src/app/"
```

## Comparison with Tizen

The Android TV Docker workflow now **exactly** matches the Tizen workflow:

| Command | Tizen | Android TV | Purpose |
|---------|-------|------------|---------|
| **Frontend Build** | `npm run build:tizen` | `npm run build:androidtv` | Build frontend assets only |
| **Deploy** | `npm run deploy:tizen <TV_IP>` | `npm run deploy:androidtv <TV_IP>` | Docker build + deploy |
| **Output Location** | `tizen/dist/` | `android-tv/dist/` + assets copy | Frontend assets |
| **Final Package** | WGT package | APK file | Installation package |
| **Protocol** | SDB (Samsung Debug Bridge) | ADB (Android Debug Bridge) | Device communication |

### Workflow Equivalence

Both platforms now use **identical** command patterns:

```bash
# Frontend build only
npm run build:tizen          # → tizen/dist/
npm run build:androidtv     # → android-tv/dist/ + assets

# Full deployment  
npm run deploy:tizen 192.168.1.100      # Docker build + SDB install
npm run deploy:androidtv 192.168.1.100  # Docker build + ADB install
```

### Docker Process Comparison

Both use the same multi-stage approach:

1. **Frontend Stage**: `npm run build:tizen` / `npm run build:androidtv`
2. **Package Stage**: Platform-specific SDK builds final package
3. **Deploy Stage**: Install to TV using respective debug bridge

## Security Notes

- The Docker container runs with standard user privileges
- ADB connection requires explicit user approval on TV
- Debug APK is unsigned (for development only)
- Production builds would require proper signing certificates

## Performance

- **Build Time**: ~3-5 minutes (first build with SDK download)
- **Rebuild Time**: ~1-2 minutes (with Docker layer caching)
- **Deploy Time**: ~30 seconds (ADB transfer and install)
- **Image Size**: ~150MB (includes full Android SDK)

## Future Improvements

- [ ] Add signing support for release builds
- [ ] Optimize Docker image size
- [ ] Add support for multiple device deployment
- [ ] Include APK verification step
- [ ] Add automated testing in container
