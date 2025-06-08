#!/bin/bash
# Android TV Docker Build Test Script

set -e

echo "🧪 Testing Android TV Docker build process..."

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi

echo "✅ Docker found: $(docker --version)"

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "android-tv" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

echo "✅ Project structure verified"

# Test frontend build first
echo "🏗️  Testing frontend build..."

# Check if assets already exist or try to build
if [ -d "android-tv/app/src/main/assets" ] && [ -f "android-tv/app/src/main/assets/index.html" ]; then
    echo "✅ Frontend assets already exist"
elif npm run build:androidtv > /dev/null 2>&1; then
    echo "✅ Frontend build successful"
    
    # Check if assets were copied
    if [ -d "android-tv/app/src/main/assets" ] && [ -f "android-tv/app/src/main/assets/index.html" ]; then
        echo "✅ Frontend assets copied to Android project"
    else
        echo "❌ Frontend assets not found in Android project"
        exit 1
    fi
else
    echo "❌ Frontend build failed"
    exit 1
fi

# Test Docker build
echo "🏗️  Testing Docker build (this may take several minutes on first run)..."
if docker build -f ./android-tv/Dockerfile -t reiverr-androidtv . --quiet > /dev/null 2>&1; then
    echo "✅ Docker build successful"
else
    echo "❌ Docker build failed"
    exit 1
fi

# Check if APK was created in the image
echo "🔍 Verifying APK creation..."
if docker run --rm reiverr-androidtv /bin/bash -c "ls -la /usr/src/app/reiverr-androidtv.apk" > /dev/null 2>&1; then
    APK_SIZE=$(docker run --rm reiverr-androidtv /bin/bash -c "ls -lh /usr/src/app/reiverr-androidtv.apk | awk '{print \$5}'")
    echo "✅ APK created successfully: $APK_SIZE"
else
    echo "❌ APK not found in Docker image"
    exit 1
fi

# Test install script existence
echo "🔍 Verifying install script..."
if docker run --rm reiverr-androidtv /bin/bash -c "test -x /usr/src/app/install.sh"; then
    echo "✅ Install script is executable"
else
    echo "❌ Install script not found or not executable"
    exit 1
fi

# Clean up - no test image to remove since we're using the main image
echo "🧹 Build test completed"

echo ""
echo "🎉 Android TV Docker build test completed successfully!"
echo ""
echo "✅ All checks passed:"
echo "   - Docker build works correctly"
echo "   - APK is generated ($APK_SIZE)"
echo "   - Install script is ready"
echo ""
echo "To deploy to your Android TV:"
echo "   npm run deploy:androidtv <ANDROID_TV_IP>"
echo ""
echo "📖 For more information, see android-tv/DOCKER.md"
