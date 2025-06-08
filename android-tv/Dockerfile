# Multi-stage build for Android TV APK
FROM --platform=linux/amd64 node:18-alpine as frontend-builder

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Copy package files
COPY package.json .
COPY package-lock.json .

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Build frontend for Android TV
RUN npm run build:androidtv

# Android build stage
FROM --platform=linux/amd64 eclipse-temurin:17-jdk-alpine as android-builder

# Install necessary packages
RUN apk add --no-cache \
    bash \
    wget \
    unzip \
    git

# Set environment variables
ENV ANDROID_HOME=/opt/android-sdk
ENV ANDROID_SDK_ROOT=$ANDROID_HOME
ENV PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# Create Android SDK directory
RUN mkdir -p $ANDROID_HOME

# Download and install Android SDK command line tools
RUN wget -q https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip -O /tmp/cmdline-tools.zip && \
    unzip -q /tmp/cmdline-tools.zip -d $ANDROID_HOME && \
    mkdir -p $ANDROID_HOME/cmdline-tools/latest && \
    mv $ANDROID_HOME/cmdline-tools/bin $ANDROID_HOME/cmdline-tools/latest/ && \
    mv $ANDROID_HOME/cmdline-tools/lib $ANDROID_HOME/cmdline-tools/latest/ && \
    rm /tmp/cmdline-tools.zip

# Accept Android SDK licenses
RUN yes | sdkmanager --licenses

# Install required Android SDK components
RUN sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0"

# Create working directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Copy Android TV project
COPY android-tv ./android-tv

# Copy built frontend assets from previous stage
COPY --from=frontend-builder /usr/src/app/android-tv/app/src/main/assets ./android-tv/app/src/main/assets

# Create local.properties with SDK path
RUN echo "sdk.dir=$ANDROID_HOME" > ./android-tv/local.properties

# Make gradlew executable
RUN chmod +x ./android-tv/gradlew

# Build the APK
WORKDIR /usr/src/app/android-tv
RUN ./gradlew assembleDebug

# Final stage for deployment
FROM --platform=linux/amd64 eclipse-temurin:17-jre-alpine

# Install ADB for deployment
RUN apk add --no-cache \
    bash \
    android-tools

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Copy the built APK and installation script
COPY --from=android-builder /usr/src/app/android-tv/app/build/outputs/apk/debug/app-debug.apk ./reiverr-androidtv.apk
COPY android-tv/install.sh ./install.sh

# Make install script executable
RUN chmod +x ./install.sh

# Set the entrypoint
ENTRYPOINT ["./install.sh"]
