#!/bin/bash

if [ -z "$1" ]; then
	echo "Usage: $0 <TV_IP_ADDRESS> [CERTIFICATE_PASSWORD]";
	exit 1;
fi

# The checkout's tizen folder, mounted read-only by npm run deploy:tizen
CERTIFICATES=/tizen/certificates

if [ -f "$CERTIFICATES/author.p12" ] && [ -f "$CERTIFICATES/distributor.p12" ]; then
	if [ -z "$2" ]; then
		echo "Found certificates in tizen/certificates but no password. Provide the certificate password after the TV's IP address."
		exit 1
	fi
	CERTIFICATE_PASSWORD=$2
elif [ -n "$2" ]; then
	echo "Certificate password provided but tizen/certificates does not have author.p12 and distributor.p12."
	exit 1
else
	echo "No certificates in tizen/certificates, using the default developer certificate."
fi

author_certificates() {
	unzip -p ./tizen/Reiverr.wgt author-signature.xml | tr -d '\r\n' | grep -o '<X509Certificate>[^<]*'
}

if [ -n "$CERTIFICATE_PASSWORD" ]; then
	echo "Signing the package with the certificates in tizen/certificates"
	XML_PASSWORD=${CERTIFICATE_PASSWORD//&/"&amp;"}
	XML_PASSWORD=${XML_PASSWORD//</"&lt;"}
	XML_PASSWORD=${XML_PASSWORD//\"/"&quot;"}
	cat > /home/developer/tizen-studio-data/profile/profiles.xml <<EOF
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<profiles active="custom" version="3.1">
<profile name="custom">
<profileitem ca="" distributor="0" key="$CERTIFICATES/author.p12" password="$XML_PASSWORD" rootca=""/>
<profileitem ca="" distributor="1" key="$CERTIFICATES/distributor.p12" password="$XML_PASSWORD" rootca=""/>
<profileitem ca="" distributor="2" key="" password="" rootca=""/>
</profile>
</profiles>
EOF

	DEFAULT_AUTHOR=$(author_certificates)
	tizen package -t wgt -s custom -- ./tizen/Reiverr.wgt
	# The CLI exits successfully without signing when it cannot use the certificates, as with a wrong password
	SIGNED_AUTHOR=$(author_certificates)
	if [ -z "$SIGNED_AUTHOR" ] || [ "$SIGNED_AUTHOR" = "$DEFAULT_AUTHOR" ]; then
		echo "Could not sign the package with the certificates in tizen/certificates. Check the password."
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

echo "Attempting to install Reiverr.wgt..."
tizen install -n ./tizen/Reiverr.wgt -t "$TV_NAME"
