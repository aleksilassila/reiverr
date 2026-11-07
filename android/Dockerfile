# syntax=docker/dockerfile:1
# check=skip=FromPlatformFlagConstDisallowed

# The frontend's TV bundle
FROM node:24-alpine AS frontend

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/package.json
RUN npm i

COPY frontend ./frontend
RUN npm run --prefix frontend build:android

# The app, compiled unsigned. package.sh signs it when the container runs, with the keystore mounted under /out.
# amd64: Google ships the build tools for x86_64 only
FROM --platform=linux/amd64 eclipse-temurin:17-jdk AS android

ENV ANDROID_HOME=/opt/android-sdk
ENV PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/36.0.0

RUN apt-get update && apt-get install -y --no-install-recommends unzip && rm -rf /var/lib/apt/lists/*

# The command-line tools (sdkmanager) and, through them, adb, the platform and the build tools (aapt2, zipalign, apksigner)
RUN curl -fsSL https://dl.google.com/android/repository/commandlinetools-linux-16111833_latest.zip -o /tmp/cmdline-tools.zip \
	&& echo "e025545c62a8e64c7559119566a569fb1dec5f60  /tmp/cmdline-tools.zip" | sha1sum -c \
	&& mkdir -p $ANDROID_HOME/cmdline-tools \
	&& unzip -q /tmp/cmdline-tools.zip -d $ANDROID_HOME/cmdline-tools \
	&& mv $ANDROID_HOME/cmdline-tools/cmdline-tools $ANDROID_HOME/cmdline-tools/latest \
	&& rm /tmp/cmdline-tools.zip
RUN yes | sdkmanager --licenses > /dev/null \
	&& sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0"

WORKDIR /usr/src/app/android

# The Gradle distribution and the dependencies stay in the build cache across builds.
# --chmod: the scripts are not executable in git, so a checkout does not have them executable
COPY --chmod=755 android/gradlew ./
COPY android/gradle.properties android/settings.gradle.kts android/build.gradle.kts ./
COPY android/gradle ./gradle
RUN --mount=type=cache,target=/root/.gradle ./gradlew --no-daemon --version

COPY android/app ./app
# app/build.gradle.kts takes the version from the root package.json
COPY package.json /usr/src/app/package.json
COPY --from=frontend /usr/src/app/frontend/dist.android /usr/src/app/frontend/dist.android
RUN --mount=type=cache,target=/root/.gradle ./gradlew --no-daemon :app:assembleRelease

COPY --chmod=755 android/package.sh ./package.sh
ENTRYPOINT ["/usr/src/app/android/package.sh"]
