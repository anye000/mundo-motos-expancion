import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import zlib from 'zlib'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

const BLACK = [0, 0, 0]
const YELLOW = [255, 204, 0]
const TRANSPARENT = [0, 0, 0, 0]

function createPNG(width, height, pixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData[8] = 8  // bit depth
  ihdrData[9] = 6  // RGBA
  ihdrData[10] = 0 // compression
  ihdrData[11] = 0 // filter
  ihdrData[12] = 0 // interlace
  const ihdr = makeChunk('IHDR', ihdrData)

  // Build raw image data (filter byte 0 per row)
  const rawData = Buffer.alloc(height * (1 + width * 4))
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0 // filter: none
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4
      const dstIdx = y * (1 + width * 4) + 1 + x * 4
      rawData[dstIdx] = pixels[srcIdx]
      rawData[dstIdx + 1] = pixels[srcIdx + 1]
      rawData[dstIdx + 2] = pixels[srcIdx + 2]
      rawData[dstIdx + 3] = pixels[srcIdx + 3]
    }
  }

  const compressed = zlib.deflateSync(rawData)
  const idat = makeChunk('IDAT', compressed)
  const iend = makeChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdr, idat, iend])
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuffer = Buffer.from(type, 'ascii')
  const crcData = Buffer.concat([typeBuffer, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(crcData), 0)
  return Buffer.concat([len, typeBuffer, data, crc])
}

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let j = 0; j < 8; j++) {
      c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0)
    }
  }
  return (c ^ 0xffffffff) >>> 0
}

function drawIcon(size, maskable = false) {
  const pixels = new Uint8Array(size * size * 4)
  const cx = size / 2
  const cy = size / 2
  const radius = size / 2

  // Safe zone for maskable: 80% centered
  const safeRadius = maskable ? size * 0.4 : radius
  const safeCx = size / 2
  const safeCy = size / 2

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4
      const distFromCenter = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)

      if (distFromCenter <= radius) {
        // Inside circle
        pixels[idx] = BLACK[0]
        pixels[idx + 1] = BLACK[1]
        pixels[idx + 2] = BLACK[2]
        pixels[idx + 3] = 255

        // Draw "M" letter in yellow within safe zone
        const relX = (x - safeCx) / safeRadius
        const relY = (y - safeCy) / safeRadius

        // M shape: normalized coords from -0.5 to 0.5
        if (relY >= -0.3 && relY <= 0.35) {
          const mLeftOuter = -0.32
          const mLeftInner = -0.16
          const mRightOuter = 0.32
          const mRightInner = 0.16
          const mPeak = -0.3
          const mBase = 0.35
          const strokeW = 0.06

          // Left vertical bar
          if (relX >= mLeftOuter && relX <= mLeftOuter + strokeW && relY >= mPeak && relY <= mBase) {
            pixels[idx] = YELLOW[0]; pixels[idx + 1] = YELLOW[1]; pixels[idx + 2] = YELLOW[2]
          }
          // Right vertical bar
          if (relX >= mRightOuter - strokeW && relX <= mRightOuter && relY >= mPeak && relY <= mBase) {
            pixels[idx] = YELLOW[0]; pixels[idx + 1] = YELLOW[1]; pixels[idx + 2] = YELLOW[2]
          }
          // Left diagonal (from top-left to middle)
          if (relY >= mPeak && relY <= 0.05) {
            const t = (relY - mPeak) / (0.05 - mPeak)
            const diagX = mLeftOuter + t * (0 - mLeftOuter)
            if (Math.abs(relX - diagX) < strokeW * 0.8) {
              pixels[idx] = YELLOW[0]; pixels[idx + 1] = YELLOW[1]; pixels[idx + 2] = YELLOW[2]
            }
          }
          // Right diagonal (from top-right to middle)
          if (relY >= mPeak && relY <= 0.05) {
            const t = (relY - mPeak) / (0.05 - mPeak)
            const diagX = mRightOuter + t * (0 - mRightOuter)
            if (Math.abs(relX - diagX) < strokeW * 0.8) {
              pixels[idx] = YELLOW[0]; pixels[idx + 1] = YELLOW[1]; pixels[idx + 2] = YELLOW[2]
            }
          }
          // Bottom horizontal bar
          if (relY >= mBase - strokeW && relY <= mBase) {
            if (relX >= mLeftOuter && relX <= mRightOuter) {
              pixels[idx] = YELLOW[0]; pixels[idx + 1] = YELLOW[1]; pixels[idx + 2] = YELLOW[2]
            }
          }
        }

        // Yellow border ring
        if (distFromCenter > radius - size * 0.03 && distFromCenter <= radius) {
          pixels[idx] = YELLOW[0]; pixels[idx + 1] = YELLOW[1]; pixels[idx + 2] = YELLOW[2]
        }
      } else {
        // Transparent outside circle (for maskable)
        pixels[idx] = 0; pixels[idx + 1] = 0; pixels[idx + 2] = 0; pixels[idx + 3] = 0
      }
    }
  }
  return Buffer.from(pixels)
}

// Generate icons
const icon192 = drawIcon(192)
writeFileSync(join(publicDir, 'icon-192x192.png'), createPNG(192, 192, icon192))

const icon512 = drawIcon(512)
writeFileSync(join(publicDir, 'icon-512x512.png'), createPNG(512, 512, icon512))

const iconMask192 = drawIcon(192, true)
writeFileSync(join(publicDir, 'maskable-icon-192x192.png'), createPNG(192, 192, iconMask192))

const iconMask512 = drawIcon(512, true)
writeFileSync(join(publicDir, 'maskable-icon-512x512.png'), createPNG(512, 512, iconMask512))

// Apple touch icon 180x180
const iconApple = drawIcon(180)
writeFileSync(join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, iconApple))

// Favicon 32x32
const favicon = drawIcon(32)
writeFileSync(join(publicDir, 'favicon.ico'), createPNG(32, 32, favicon))

console.log('Iconos generados exitosamente en public/')
