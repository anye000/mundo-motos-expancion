import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

const svgBuffer = readFileSync(join(publicDir, 'logo-mundo-motos.svg'))

async function generateIcons() {
  // Icon 192x192 (any purpose)
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(join(publicDir, 'icon-192x192.png'))
  console.log('Generado: icon-192x192.png')

  // Icon 512x512 (any purpose)
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(join(publicDir, 'icon-512x512.png'))
  console.log('Generado: icon-512x512.png')

  // Maskable icon 192x192 (with padding for safe zone)
  const maskable192 = sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
  const maskLogo192 = await sharp(svgBuffer)
    .resize(152, 152) // 80% of 192 for safe zone
    .toBuffer()
  await maskable192
    .composite([{
      input: maskLogo192,
      left: 20,
      top: 20,
    }])
    .png()
    .toFile(join(publicDir, 'maskable-icon-192x192.png'))
  console.log('Generado: maskable-icon-192x192.png')

  // Maskable icon 512x512 (with padding for safe zone)
  const maskable512 = sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
  const maskLogo512 = await sharp(svgBuffer)
    .resize(410, 410) // 80% of 512 for safe zone
    .toBuffer()
  await maskable512
    .composite([{
      input: maskLogo512,
      left: 51,
      top: 51,
    }])
    .png()
    .toFile(join(publicDir, 'maskable-icon-512x512.png'))
  console.log('Generado: maskable-icon-512x512.png')

  // Apple touch icon 180x180
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(join(publicDir, 'apple-touch-icon.png'))
  console.log('Generado: apple-touch-icon.png')

  // Favicon 32x32
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(join(publicDir, 'favicon.png'))
  console.log('Generado: favicon.png')

  // Favicon ICO (using png as fallback - browsers accept .png with .ico extension)
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(join(publicDir, 'favicon.ico'))
  console.log('Generado: favicon.ico')

  console.log('\nTodos los iconos generados exitosamente.')
}

generateIcons().catch(console.error)
