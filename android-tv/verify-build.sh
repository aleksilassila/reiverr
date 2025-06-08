#!/bin/bash
# Android TV Build Verification Script

set -e

echo "🔍 Verifying Android TV build environment..."

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "android-tv" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

echo "✅ Project structure verified"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js found: $NODE_VERSION"

# Check npm dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
fi

echo "✅ NPM dependencies ready"

# Build frontend for Android TV
echo "🏗️  Building frontend for Android TV..."
npm run build:androidtv

if [ ! -f "android-tv/app/src/main/assets/index.html" ]; then
    echo "❌ Error: Frontend build failed - assets not found"
    exit 1
fi

echo "✅ Frontend build successful"

# Check Android SDK
if [ ! -f "android-tv/local.properties" ]; then
    echo "❌ Error: Android SDK not configured. Please set up Android SDK first."
    echo "   See android-tv/README.md for instructions"
    exit 1
fi

echo "✅ Android SDK configured"

# Build APK
echo "🏗️  Building Android TV APK..."
cd android-tv

if [ ! -f "gradlew" ]; then
    echo "❌ Error: Gradle wrapper not found"
    exit 1
fi

chmod +x gradlew
./gradlew assembleDebug

if [ ! -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
    echo "❌ Error: APK build failed"
    exit 1
fi

APK_SIZE=$(ls -lh app/build/outputs/apk/debug/app-debug.apk | awk '{print $5}')
echo "✅ APK build successful: $APK_SIZE"

cd ..

echo ""
echo "🎉 Android TV build verification complete!"
echo ""
echo "📱 APK location: android-tv/app/build/outputs/apk/debug/app-debug.apk"
echo "📖 Installation guide: android-tv/README.md"
echo ""
echo "To install on your Android TV:"
echo "   adb install android-tv/app/build/outputs/apk/debug/app-debug.apk"
