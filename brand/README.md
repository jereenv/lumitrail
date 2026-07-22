# Lumitrail Brand Assets

This directory contains all SVG source files for the Lumitrail brand. PNGs are exported to `assets/` and `assets/store/`.

## Palette

| Name             | Hex       | Usage                                 |
| ---------------- | --------- | ------------------------------------- |
| Sky Blue         | `#BFE9FF` | Icon gradient top / splash background |
| Mint Green       | `#6FE0B0` | Icon gradient bottom                  |
| Map Mint         | `#A8EDCC` | Street lines on map block             |
| Fog Mint         | `#B8F0D8` | Fog wedge overlay                     |
| Coral Pin        | `#FF7A66` | Map pin body                          |
| Coral Pin (dark) | `#CC4433` | Map pin stroke / outline              |
| Cream            | `#FFF8EE` | Map block fill, trail path, pin dot   |
| Map Border       | `#E8DDCC` | Map block stroke                      |

---

## SVG Sources

| File                  | Dimensions | Purpose                                                                                         |
| --------------------- | ---------- | ----------------------------------------------------------------------------------------------- |
| `icon.svg`            | 1024×1024  | Master icon — sky→mint gradient + map block + fog wedge + coral pin, rounded rect implied by OS |
| `icon-foreground.svg` | 1024×1024  | Android adaptive icon foreground (transparent bg, pin/map/fog/trail in central 66% safe zone)   |
| `icon-background.svg` | 1024×1024  | Android adaptive icon background (sky→mint vertical gradient field only)                        |
| `icon-monochrome.svg` | 1024×1024  | Android 13+ themed icon (single-color white pin silhouette on transparent)                      |
| `feature-graphic.svg` | 1024×500   | Play Store feature graphic                                                                      |
| `wordmark.svg`        | 680×120    | "Lumitrail" wordmark + tagline lockup                                                           |
| `screenshot-1.svg`    | 1080×1920  | App screen: fog map with revealed glowing trail                                                 |
| `screenshot-2.svg`    | 1080×1920  | App screen: stats dashboard                                                                     |
| `screenshot-3.svg`    | 1080×1920  | App screen: achievements / badges grid                                                          |
| `screenshot-4.svg`    | 1080×1920  | App screen: level-up / XP moment                                                                |
| `screenshot-5.svg`    | 1080×1920  | App screen: leaderboard (global + friends)                                                      |
| `screenshot-6.svg`    | 1080×1920  | App screen: friends / shareable snapshot                                                        |

---

## PNG Exports

| Output path                                     | Dimensions | Source SVG                  | sharp-cli command                                                                                         |
| ----------------------------------------------- | ---------- | --------------------------- | --------------------------------------------------------------------------------------------------------- |
| `assets/icon.png`                               | 1024×1024  | `brand/icon.svg`            | `npx --yes sharp-cli -i brand/icon.svg -o assets/icon.png resize 1024 1024`                               |
| `assets/adaptive-icon.png`                      | 1024×1024  | `brand/icon-foreground.svg` | `npx --yes sharp-cli -i brand/icon-foreground.svg -o assets/adaptive-icon.png resize 1024 1024`           |
| `assets/android-icon-foreground.png`            | 1024×1024  | `brand/icon-foreground.svg` | `npx --yes sharp-cli -i brand/icon-foreground.svg -o assets/android-icon-foreground.png resize 1024 1024` |
| `assets/android-icon-background.png`            | 1024×1024  | `brand/icon-background.svg` | `npx --yes sharp-cli -i brand/icon-background.svg -o assets/android-icon-background.png resize 1024 1024` |
| `assets/android-icon-monochrome.png`            | 1024×1024  | `brand/icon-monochrome.svg` | `npx --yes sharp-cli -i brand/icon-monochrome.svg -o assets/android-icon-monochrome.png resize 1024 1024` |
| `assets/splash-icon.png`                        | 1024×1024  | `brand/icon.svg`            | `npx --yes sharp-cli -i brand/icon.svg -o assets/splash-icon.png resize 1024 1024`                        |
| `assets/favicon.png`                            | 48×48      | `brand/icon.svg`            | `npx --yes sharp-cli -i brand/icon.svg -o assets/favicon.png resize 48 48`                                |
| `assets/android/mipmap-mdpi/ic_launcher.png`    | 48×48      | `brand/icon.svg`            | `npx --yes sharp-cli -i brand/icon.svg -o assets/android/mipmap-mdpi/ic_launcher.png resize 48 48`        |
| `assets/android/mipmap-hdpi/ic_launcher.png`    | 72×72      | `brand/icon.svg`            | `npx --yes sharp-cli -i brand/icon.svg -o assets/android/mipmap-hdpi/ic_launcher.png resize 72 72`        |
| `assets/android/mipmap-xhdpi/ic_launcher.png`   | 96×96      | `brand/icon.svg`            | `npx --yes sharp-cli -i brand/icon.svg -o assets/android/mipmap-xhdpi/ic_launcher.png resize 96 96`       |
| `assets/android/mipmap-xxhdpi/ic_launcher.png`  | 144×144    | `brand/icon.svg`            | `npx --yes sharp-cli -i brand/icon.svg -o assets/android/mipmap-xxhdpi/ic_launcher.png resize 144 144`    |
| `assets/android/mipmap-xxxhdpi/ic_launcher.png` | 192×192    | `brand/icon.svg`            | `npx --yes sharp-cli -i brand/icon.svg -o assets/android/mipmap-xxxhdpi/ic_launcher.png resize 192 192`   |
| `assets/store/feature-graphic.png`              | 1024×500   | `brand/feature-graphic.svg` | `npx --yes sharp-cli -i brand/feature-graphic.svg -o assets/store/feature-graphic.png resize 1024 500`    |
| `assets/store/thumbnail.png`                    | 512×512    | `brand/icon.svg`            | `npx --yes sharp-cli -i brand/icon.svg -o assets/store/thumbnail.png resize 512 512`                      |
| `assets/store/screenshot-1.png`                 | 1080×1920  | `brand/screenshot-1.svg`    | `npx --yes sharp-cli -i brand/screenshot-1.svg -o assets/store/screenshot-1.png resize 1080 1920`         |
| `assets/store/screenshot-2.png`                 | 1080×1920  | `brand/screenshot-2.svg`    | `npx --yes sharp-cli -i brand/screenshot-2.svg -o assets/store/screenshot-2.png resize 1080 1920`         |
| `assets/store/screenshot-3.png`                 | 1080×1920  | `brand/screenshot-3.svg`    | `npx --yes sharp-cli -i brand/screenshot-3.svg -o assets/store/screenshot-3.png resize 1080 1920`         |
| `assets/store/screenshot-4.png`                 | 1080×1920  | `brand/screenshot-4.svg`    | `npx --yes sharp-cli -i brand/screenshot-4.svg -o assets/store/screenshot-4.png resize 1080 1920`         |
| `assets/store/screenshot-5.png`                 | 1080×1920  | `brand/screenshot-5.svg`    | `npx --yes sharp-cli -i brand/screenshot-5.svg -o assets/store/screenshot-5.png resize 1080 1920`         |
| `assets/store/screenshot-6.png`                 | 1080×1920  | `brand/screenshot-6.svg`    | `npx --yes sharp-cli -i brand/screenshot-6.svg -o assets/store/screenshot-6.png resize 1080 1920`         |

---

## Regenerate all PNGs at once

Run the following from the project root:

```bash
# Core icons
npx --yes sharp-cli -i brand/icon.svg -o assets/icon.png resize 1024 1024
npx --yes sharp-cli -i brand/icon-foreground.svg -o assets/adaptive-icon.png resize 1024 1024
npx --yes sharp-cli -i brand/icon-foreground.svg -o assets/android-icon-foreground.png resize 1024 1024
npx --yes sharp-cli -i brand/icon-background.svg -o assets/android-icon-background.png resize 1024 1024
npx --yes sharp-cli -i brand/icon-monochrome.svg -o assets/android-icon-monochrome.png resize 1024 1024
npx --yes sharp-cli -i brand/icon.svg -o assets/splash-icon.png resize 1024 1024
npx --yes sharp-cli -i brand/icon.svg -o assets/favicon.png resize 48 48

# Android density set
npx --yes sharp-cli -i brand/icon.svg -o assets/android/mipmap-mdpi/ic_launcher.png resize 48 48
npx --yes sharp-cli -i brand/icon.svg -o assets/android/mipmap-hdpi/ic_launcher.png resize 72 72
npx --yes sharp-cli -i brand/icon.svg -o assets/android/mipmap-xhdpi/ic_launcher.png resize 96 96
npx --yes sharp-cli -i brand/icon.svg -o assets/android/mipmap-xxhdpi/ic_launcher.png resize 144 144
npx --yes sharp-cli -i brand/icon.svg -o assets/android/mipmap-xxxhdpi/ic_launcher.png resize 192 192

# Store assets
npx --yes sharp-cli -i brand/feature-graphic.svg -o assets/store/feature-graphic.png resize 1024 500
npx --yes sharp-cli -i brand/icon.svg -o assets/store/thumbnail.png resize 512 512
npx --yes sharp-cli -i brand/screenshot-1.svg -o assets/store/screenshot-1.png resize 1080 1920
npx --yes sharp-cli -i brand/screenshot-2.svg -o assets/store/screenshot-2.png resize 1080 1920
npx --yes sharp-cli -i brand/screenshot-3.svg -o assets/store/screenshot-3.png resize 1080 1920
npx --yes sharp-cli -i brand/screenshot-4.svg -o assets/store/screenshot-4.png resize 1080 1920
npx --yes sharp-cli -i brand/screenshot-5.svg -o assets/store/screenshot-5.png resize 1080 1920
npx --yes sharp-cli -i brand/screenshot-6.svg -o assets/store/screenshot-6.png resize 1080 1920
```
