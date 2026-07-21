# SETUP — machine changes log

This file records anything installed **outside the project** (system-wide) while
building Lumitrail, per the working agreement.

## System-wide installs

### Map work (map-fix session): NONE

Nothing was installed system-wide during the map work. Everything added there
lives inside the project's `node_modules/` (see the project-scoped table below).

### Android APK build (this session, 2026-07-21)

To produce an installable Android APK on this Mac (there was no Android
toolchain before), the following were installed **system-wide via Homebrew**.
They are additive — nothing was removed, and existing Java 26 is untouched.

| What                                      | How                                                | Where it lives                                    | Why                                                                   |
| ----------------------------------------- | -------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------- |
| **JDK 17** (`openjdk@17`)                 | `brew install openjdk@17`                          | `/opt/homebrew/opt/openjdk@17`                    | Android Gradle needs JDK 17; system Java 26 is too new for the build  |
| **Android command-line tools**            | `brew install --cask android-commandlinetools`     | `/opt/homebrew/share/android-commandlinetools`    | Provides `sdkmanager` to fetch SDK components (no Android Studio GUI) |
| **platform-tools** (adb, etc.)            | `sdkmanager "platform-tools"`                      | `$ANDROID_HOME/platform-tools`                    | adb + core device tooling                                             |
| **SDK platform, build-tools, NDK, CMake** | auto-downloaded by Gradle during `assembleRelease` | `$ANDROID_HOME/{platforms,build-tools,ndk,cmake}` | Required to compile the native code (Hermes, react-native-maps) → APK |

`ANDROID_HOME` used for the build: `/opt/homebrew/share/android-commandlinetools`
(set inline per-command; **not** persisted to your shell profile). SDK licenses
were accepted non-interactively via `sdkmanager --licenses`.

To run the build again yourself:

```bash
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
cd android && ./gradlew :app:assembleRelease   # APK → app/build/outputs/apk/release/
```

To fully undo these machine changes later:
`brew uninstall openjdk@17`, `brew uninstall --cask android-commandlinetools`,
and `rm -rf /opt/homebrew/share/android-commandlinetools` (the downloaded SDK).

## Project-scoped installs (inside `/Users/jereenvalsson/personal/lumitrail`)

Added to the project's dependencies (local `node_modules`, recorded in
`package.json` / `package-lock.json`):

| Package              | Version | Why                                                                                       | Command used                          |
| -------------------- | ------- | ----------------------------------------------------------------------------------------- | ------------------------------------- |
| `react-native-maps`  | 1.27.2  | Real interactive basemap (Google/Apple Maps) with Polygon-with-holes fog overlay          | `npx expo install react-native-maps`  |
| `expo-splash-screen` | ~57.0.4 | Branded splash config referenced by `app.json` (added in the prior session's config pass) | `npx expo install expo-splash-screen` |
| `tsx` (dev)          | ^4.x    | Runs the headless `npm run demo` with tsconfig path aliases (prior session)               | `npm install --save-dev tsx`          |

The SVG-based rasterisation used for brand assets in the earlier session ran via
`npx --yes sharp-cli` (executed from the npx cache — **not** installed into the
project or system).

## Platform toolchains

- **Android:** now installed (see "Android APK build" above). Needs the SDK +
  a **free Google Maps API key** in `.env` (see `README.md` → "Google Maps API
  key"). Build the APK with `./gradlew :app:assembleRelease`, or build + install
  onto a connected device with `npx expo run:android`.
- **iOS:** still **not** installed here. Needs full **Xcode** (from the App
  Store — this machine only has the Command Line Tools) and **CocoaPods**
  (`brew install cocoapods` or `sudo gem install cocoapods`). Apple Maps needs
  no key. Run: `npx expo run:ios`.

Verification: `npm run typecheck`, `npm run lint`, `npm run format:check`,
`npm test` (108 tests / 19 suites), and — the real proof — a signed release APK
built and installed on a physical Pixel 10 Pro XL, launching to the live Google
Maps basemap with the fog overlay and HUD (no crash).
