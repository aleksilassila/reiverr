#!/bin/bash

if [ -z "$1" ]; then
    echo "Please pass the IP address of your Samsung TV as part of the commandline arguments for this script.";
		exit 1;
fi

if [ -z "$2" ]; then
	echo "Certificate information not provided, using default dev certificate."
else
	if [ -f /certificates/author.p12 ] && [ -f /certificates/distributor.p12 ]; then
		CERTIFICATE_PASSWORD=$2
	else
		echo "Certificate information provided but certificate files not found."
		exit 1
	fi
fi	

TV_IP="$1";

echo "Attempting to connect to Samsung TV at IP address $TV_IP"
sdb connect $1

echo "Attempting to get the TV name..."
TV_NAME=$(sdb devices | grep -E 'device\s+\w+[-]?\w+' -o | sed 's/device//' - | xargs)

if [ -z "$TV_NAME" ]; then
    echo "Could not find the TV name.";
		exit 1;
fi
echo "Found TV name: $TV_NAME"

# echo "Downloading jellyfin-tizen-builds $JELLYFIN_BUILD_OPTION.wgt from release: $TAG"
# wget -q --show-progress "$DOWNLOAD_URL"; echo ""

if ! [ -z "$CERTIFICATE_PASSWORD" ]; then
	echo "Attempting to sign package using provided certificate"
	sed -i "s/_CERTIFICATEPASSWORD_/$CERTIFICATE_PASSWORD/" profile.xml
	sed -i '/<\/profile>/ r profile.xml' /home/developer/tizen-studio-data/profile/profiles.xml
	tizen package -t wgt -s custom -- $JELLYFIN_BUILD_OPTION.wgt
fi

echo "Attempting to install Reiverr.wgt..."
tizen install -n ./tizen/Reiverr.wgt -t "$TV_NAME"
