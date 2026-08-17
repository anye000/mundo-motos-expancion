import sharp from 'sharp'
import { existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'

const inputPath = resolve('packages/frontend/public/mundo-isotipo.png')
const outputDir = resolve('packages/frontend/public')

const sizes = [
  { name: 'favicon-16.png', width: 16, height: 16 },
  { name: 'favicon-32.png', width: 32, height: 32 },
  { name: 'apple-touch-icon.png', width: 180, height: 180 },
  { name: 'logo-192.png', width: 192, height: 192 },
  { name: 'logo-512.png', width: 512, height: 512 },
  { name: 'icon-192x192.png', width: 192, height: 192 },
  { name: 'icon-512x512.png', width: 512, height: 512 },
]

const maskableSizes = [
  { name: 'maskable-icon-192x192.png', width: 192, height: 192 },
  { name: 'maskable-icon-512x512.png', width: 512, height: 512 },
]

async function generateIcons() {
  console.log('Generando iconos PWA desde:', inputPath)

  for (const { name, width, height } of sizes) {
    const outputPath = resolve(outputDir, name)
    await sharp(inputPath)
      .resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(outputPath)
    console.log(`✓ ${name} (${width}x${height})`)
  }

  for (const { name, width, height } of maskableSizes) {
    const outputPath = resolve(outputDir, name)
    const padding = Math.round(width * 0.1)
    await sharp(inputPath)
      .resize(width - padding * 2, height - padding * 2, { fit: 'contain' })
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputPath)
    console.log(`✓ ${name} (${width}x${height}, maskable con padding)`)
  }

  const icoPath = resolve(outputDir, 'favicon.ico')
  await sharp(inputPath)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toFile(icoPath)
  console.log(`✓ favicon.ico (32x32)`)

  console.log('\n✓ Todos los iconos PWA generados correctamente')
}

generateIcons().catch(console.error)