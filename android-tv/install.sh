#!/bin/bash

if [ -z "$1" ]; then
    echo "Please pass the IP address of your Android TV device as part of the commandline arguments for this script."
    echo "Usage: $0 <ANDROID_TV_IP>"
    exit 1
fi

TV_IP="$1"

echo "🔍 Attempting to connect to Android TV at IP address $TV_IP"

# Connect to the device
adb connect $TV_IP:5555

# Wait a moment for connection
sleep 2

# Check if device is connected
if ! adb devices | grep -q "$TV_IP:5555"; then
    echo "❌ Could not connect to Android TV device at $TV_IP"
    echo "Please ensure:"
    echo "  - ADB debugging is enabled on your Android TV"
    echo "  - The device is reachable on the network"
    echo "  - You've accepted the ADB connection prompt on the TV"
    exit 1
fi

echo "✅ Connected to Android TV device"

# Check if app is already installed and uninstall if needed
APP_PACKAGE="com.reiverr.androidtv"
if adb -s $TV_IP:5555 shell pm list packages | grep -q "$APP_PACKAGE"; then
    echo "📱 Uninstalling existing Reiverr app..."
    adb -s $TV_IP:5555 uninstall $APP_PACKAGE
fi

# Install the APK
echo "📦 Installing Reiverr Android TV app..."
if adb -s $TV_IP:5555 install ./reiverr-androidtv.apk; then
    echo "✅ Reiverr Android TV app installed successfully!"
    echo ""
    echo "🎉 Installation complete!"
    echo "📺 You can now find the Reiverr app in your Android TV's app launcher"
else
    echo "❌ Failed to install the APK"
    echo "Please check the ADB connection and try again"
    exit 1
fi

# Disconnect from device
adb disconnect $TV_IP:5555
echo "🔌 Disconnected from Android TV device"
