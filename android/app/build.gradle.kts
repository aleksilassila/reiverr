plugins {
    alias(libs.plugins.android.application)
}

// The TV bundle of the frontend, written by `npm run build:android -w frontend`
val webBundle = rootProject.file("../frontend/dist.android")

// The version of the root package.json. versionCode has to grow from release to release:
// 3.0.0-beta.1 -> 3000001, 3.0.0 -> 3000099, 3.0.1 -> 3000199. The word of a prerelease does not count,
// so 3.0.0-beta.5 -> 3.0.0-rc.1 would go down and installed apps would refuse the update
val packageVersion = Regex("\"version\":\\s*\"([^\"]+)\"")
    .find(rootProject.file("../package.json").readText())!!.groupValues[1]
val versionMatch = Regex("(\\d+)\\.(\\d+)\\.(\\d+)(?:-[a-z]+\\.(\\d+))?").matchEntire(packageVersion)
    ?: throw GradleException("Cannot derive a version code from the version $packageVersion")
val (major, minor, patch, prerelease) = versionMatch.destructured
val packageVersionCode = major.toInt() * 1_000_000 + minor.toInt() * 10_000 + patch.toInt() * 100 +
    (if (prerelease.isEmpty()) 99 else prerelease.toInt())

android {
    namespace = "dev.reiverr.tv"
    compileSdk = 36

    defaultConfig {
        applicationId = "dev.reiverr.tv"
        minSdk = 24 // androidx.webkit asks for it
        targetSdk = 36
        versionCode = packageVersionCode
        versionName = packageVersion
    }

    buildFeatures {
        buildConfig = true
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            // Signed after the build by package.sh with the keystore in android/keystore
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    sourceSets.named("main") {
        assets.directories += webBundle.path
    }
}

// Without the bundle the app would open on an empty page
tasks.named("preBuild") {
    doFirst {
        if (!webBundle.resolve("index.html").isFile) {
            throw GradleException("No frontend bundle at $webBundle; run `npm run build:android -w frontend` first")
        }
    }
}

dependencies {
    implementation(libs.androidx.webkit)
}
