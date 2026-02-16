# Icon Generation

This directory contains scripts for generating app icons from the logo.

## Current Status

The logo has been integrated throughout the app:
- Web favicon: `public/favicon.svg` (simplified SVG version)
- PWA icons: `public/assets/icons/icon-192.png` and `icon-512.png` (currently using full logo)
- Android icons: Foreground PNGs in all mipmap directories (currently using full logo)

## Generating Properly Sized Icons

For production, you should generate properly sized icons:

### Option 1: Use the generate-icons script

1. Install sharp: `npm install --save-dev sharp`
2. Run: `node scripts/generate-icons.mjs`

This will:
- Generate PWA icons (192x192, 512x512) from the logo
- Generate Android foreground icons for all density folders
- Properly resize and optimize images

### Option 2: Manual generation

Use an image editor or online tool to create:
- **PWA icons**: 192x192px and 512x512px PNG files
- **Android icons**: 
  - mdpi: 108x108px
  - hdpi: 162x162px  
  - xhdpi: 216x216px
  - xxhdpi: 324x324px
  - xxxhdpi: 432x432px

For Android adaptive icons:
- Foreground should have transparent background
- Focus on the rocket emblem for small sizes
- Background color is set to black (#000000) in `android/app/src/main/res/values/ic_launcher_background.xml`

## Logo Location

Source logo: `public/assets/logo.png`
- Full logo with "PRE-FLIGHT" text
- Use full logo for larger displays (home screen, PWA icons)
- Extract rocket emblem portion for small icons (favicon, header)
