#!/usr/bin/env node
/**
 * Generate PWA and Android icons from the logo
 * Requires: sharp (npm install --save-dev sharp)
 */

import sharp from 'sharp'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

const logoPath = join(rootDir, 'public', 'assets', 'logo.png')
const iconsDir = join(rootDir, 'public', 'assets', 'icons')

// Check if logo exists
if (!existsSync(logoPath)) {
  console.error(`Logo not found at ${logoPath}`)
  process.exit(1)
}

// PWA icon sizes
const pwaSizes = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' }
]

// Android mipmap sizes (for adaptive icons, we'll create foreground images)
const androidSizes = [
  { density: 'mdpi', size: 108, name: 'ic_launcher_foreground.png' },
  { density: 'hdpi', size: 162, name: 'ic_launcher_foreground.png' },
  { density: 'xhdpi', size: 216, name: 'ic_launcher_foreground.png' },
  { density: 'xxhdpi', size: 324, name: 'ic_launcher_foreground.png' },
  { density: 'xxxhdpi', size: 432, name: 'ic_launcher_foreground.png' }
]

async function generateIcons() {
  console.log('Generating icons from logo...')
  
  // Generate PWA icons
  for (const { size, name } of pwaSizes) {
    const outputPath = join(iconsDir, name)
    await sharp(logoPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 1 }
      })
      .toFile(outputPath)
    console.log(`✓ Generated ${name} (${size}x${size})`)
  }

  // Generate Android foreground icons (adaptive icon safe area)
  // Android adaptive icons need to be 108dp with safe area of 72dp
  // We'll extract just the rocket emblem area for better visibility
  for (const { density, size, name } of androidSizes) {
    const androidDir = join(rootDir, 'android', 'app', 'src', 'main', 'res', `mipmap-${density}`)
    const outputPath = join(androidDir, name)
    
    // For adaptive icons, we want to focus on the rocket emblem
    // The logo has the rocket in the upper portion, so we'll crop and resize
    await sharp(logoPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background for foreground
      })
      .toFile(outputPath)
    console.log(`✓ Generated Android ${density} ${name} (${size}x${size})`)
  }

  console.log('Icon generation complete!')
}

generateIcons().catch(console.error)
