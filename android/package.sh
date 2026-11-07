#!/bin/sh
# Signs the APK the image built into android/Reiverr.apk and, given a TV address, installs it over adb.
# Usage: package.sh [TV_IP[:PORT]]
# KEYSTORE_PASSWORD: the password of android/keystore/reiverr.jks, made here when missing. Default: reiverr
set -eu

KEYSTORE=/out/keystore/reiverr.jks
PASSWORD=${KEYSTORE_PASSWORD:-reiverr}
UNSIGNED=app/build/outputs/apk/release/app-release-unsigned.apk

if [ ! -f "$KEYSTORE" ]; then
	echo "No keystore at android/keystore/reiverr.jks, creating one. Keep it: an update has to be signed with the same key as the installed app."
	mkdir -p "$(dirname "$KEYSTORE")"
	keytool -genkeypair -keystore "$KEYSTORE" -storepass "$PASSWORD" -keypass "$PASSWORD" \
		-alias reiverr -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Reiverr"
fi

zipalign -f -p 4 "$UNSIGNED" /tmp/Reiverr-aligned.apk
apksigner sign --ks "$KEYSTORE" --ks-pass "pass:$PASSWORD" --out /out/Reiverr.apk /tmp/Reiverr-aligned.apk
apksigner verify /out/Reiverr.apk
echo "Wrote android/Reiverr.apk"

if [ $# -eq 0 ]; then
	exit 0
fi

TV="$1"
case "$TV" in
	*:*) ;;
	*) TV="$TV:5555" ;;
esac

# adb identifies itself to the TV with the key in ~/.android. Kept next to the keystore, so that the TV asks once.
[ -f /out/keystore/adbkey ] || adb keygen /out/keystore/adbkey
mkdir -p ~/.android
cp /out/keystore/adbkey /out/keystore/adbkey.pub ~/.android/

echo "Installing on $TV. Accept the debugging prompt on the TV if it shows one."
adb connect "$TV"
if ! timeout 60 adb -s "$TV" wait-for-device; then
	echo "$TV was not ready within 60 seconds. Accept the debugging prompt on the TV, check that ADB debugging is on, and run this again." >&2
	exit 1
fi
adb -s "$TV" install -r /out/Reiverr.apk
