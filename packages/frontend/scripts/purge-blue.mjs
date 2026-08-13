// Purga de marca post-build: elimina CUALQUIER rastro de azul/cian y de grises
// azulados de los assets compilados (colores por defecto de librerías como
// Leaflet o paletas viejas) y falla el build si queda alguno en dist/.
// Ejecutar tras `vite build`.
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, extname } from 'node:path'

const DIST = join(process.cwd(), 'dist')

// Grises azulados (paletas gray/slate/zinc por defecto de Tailwind y valores
// hardcodeados antiguos). Un gris con tinte frío también rompe la marca.
const GRISES_AZULADOS = [
  '111827',
  '1f2937',
  '374151',
  '4b5563',
  '6b7280',
  '9ca3af',
  'd1d5db',
  'e5e7eb',
  'f3f4f6',
  'f9fafb',
  '0f172a',
  '1e293b',
  '334155',
  '475569',
  '64748b',
  '94a3b8',
  'cbd5e1',
  'e2e8f0',
  'f1f5f9',
  'f8fafc',
  '18181b',
  '27272a',
  '3f3f46',
  '52525b',
  '71717a',
  'a1a1aa',
  'd4d4d8',
  'e4e4e7',
  'f4f4f5',
]

// Pares [hex sin '#', reemplazo]: azules/cianes van a amarillo corporativo,
// grises azulados a gris neutro #a3a3a3.
const REEMPLAZABLES = [
  ['3388ff', 'FFCC00'],
  ['0078a8', 'FFCC00'],
  ['0078d4', 'FFCC00'],
  ['3b82f6', 'FFCC00'],
  ['0ea5e9', 'FFCC00'],
  ['06b6d4', 'FFCC00'],
  ['38bdf8', 'FFCC00'],
  ['60a5fa', 'FFCC00'],
  ['93c5fd', 'FFCC00'],
  ['bfdbfe', 'FFCC00'],
  ['dbeafe', 'FFCC00'],
  ['2563eb', 'FFCC00'],
  ['1d4ed8', 'FFCC00'],
  ['1e40af', 'FFCC00'],
  ['0284c7', 'FFCC00'],
  ['0369a1', 'FFCC00'],
  ['075985', 'FFCC00'],
  ['0891b2', 'FFCC00'],
  ['0e7490', 'FFCC00'],
  ['155e75', 'FFCC00'],
  ['22d3ee', 'FFCC00'],
  ['67e8f9', 'FFCC00'],
  ['a5f3fc', 'FFCC00'],
  ['2196f3', 'FFCC00'],
  ['1976d2', 'FFCC00'],
  ['1e88e5', 'FFCC00'],
  ['42a5f5', 'FFCC00'],
  ['0d6efd', 'FFCC00'],
  ['1d6ee8', 'FFCC00'],
  ['0a84ff', 'FFCC00'],
  ['0066cc', 'FFCC00'],
  ['1e90ff', 'FFCC00'],
  ['2f80ed', 'FFCC00'],
  ['4d90fe', 'FFCC00'],
  ['b4d5fe', 'FFCC00'],
  ['005fcc', 'FFCC00'],
  // Atajo CSS de Leaflet (#38f = #3388ff)
  ['38f', 'FFCC00'],
  ...GRISES_AZULADOS.map((hex) => [hex, 'a3a3a3']),
]

const EXT_EDITABLES = new Set(['.css', '.js', '.mjs', '.html', '.json', '.webmanifest', '.svg'])

async function walk(dir) {
  const entradas = await readdir(dir, { withFileTypes: true })
  const archivos = []
  for (const entrada of entradas) {
    const ruta = join(dir, entrada.name)
    if (entrada.isDirectory()) archivos.push(...(await walk(ruta)))
    else archivos.push(ruta)
  }
  return archivos
}

let archivosPurgados = 0
const pendientes = []

for (const archivo of await walk(DIST)) {
  if (!EXT_EDITABLES.has(extname(archivo).toLowerCase())) continue

  let contenido = await readFile(archivo, 'utf8')
  const original = contenido

  for (const [hex, reemplazo] of REEMPLAZABLES) {
    const regex = new RegExp('#' + hex + '(?![0-9a-fA-F])', 'gi')
    contenido = contenido.replace(regex, '#' + reemplazo)
  }

  if (contenido !== original) {
    archivosPurgados++
    await writeFile(archivo, contenido, 'utf8')
  }

  for (const [hex] of REEMPLAZABLES) {
    const regex = new RegExp('#' + hex + '(?![0-9a-fA-F])', 'gi')
    if (regex.test(contenido)) pendientes.push(`${archivo} -> #${hex}`)
  }
}

if (pendientes.length > 0) {
  console.error('[purge-blue] ERROR: aun quedan azules/grises azulados en el build:')
  for (const p of pendientes) console.error('  ' + p)
  process.exit(1)
}

console.log(
  `[purge-blue] OK: ${archivosPurgados} archivo(s) purgados. CERO rastro de azul/cian y grises azulados en dist/.`
)
