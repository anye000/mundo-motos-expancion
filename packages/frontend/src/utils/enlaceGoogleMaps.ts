/** Utilidades para extraer coordenadas de enlaces de Google Maps. */

export interface CoordenadasEnlace {
  lat: number
  lng: number
}

// Formats típicos de URL de Google Maps que contienen coordenadas:
//  - https://www.google.com/maps/place/X/@lat,lng,17z/...
//  - https://www.google.com/maps/@lat,lng,15z
//  - https://www.google.com/maps/dir/.../@lat,lng,12z/...
//  - https://www.google.com/maps?q=lat,lng
//  - https://www.google.com/maps?ll=lat,lng&z=15
const RE_AT = /@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/
const RE_Q = /[?&]q=(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/
const RE_LL = /[?&]ll=(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/

/** Detecta si el texto parece un enlace de Google Maps (largo o corto). */
export function esEnlaceGoogleMaps(enlace: string): boolean {
  return /google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl/i.test(enlace)
}

/** Detecta enlaces cortos (`maps.app.goo.gl/...`) que requieren resolver el redirect. */
export function esEnlaceCortoGoogleMaps(enlace: string): boolean {
  return /(?:maps\.app\.)?goo\.gl\/maps\//i.test(enlace) || /maps\.app\.goo\.gl\//i.test(enlace)
}

/**
 * Extrae las coordenadas directamente de la URL sin resolverla.
 * Devuelve `null` si no hay lat/lng reconocibles.
 */
export function extraerCoordenadasDeEnlace(enlace: string): CoordenadasEnlace | null {
  const texto = enlace.trim()
  if (!texto) return null
  // Se prioriza q= y ll= (parámetros explícitos) antes que @ (coordenada de vista).
  for (const re of [RE_Q, RE_LL, RE_AT]) {
    const coincidencia = texto.match(re)
    if (coincidencia) {
      const lat = Number(coincidencia[1])
      const lng = Number(coincidencia[2])
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng }
      }
    }
  }
  return null
}

/**
 * Resuelve las coordenadas de un enlace de Google Maps.
 * Para URLs largas extrae las coordenadas directamente; para enlaces cortos
 * intenta seguir el redirect (fetch) y re-parsear la URL final.
 * Devuelve `null` si no pudo determinarlas.
 */
export async function resolverCoordenadasGoogleMaps(
  enlace: string
): Promise<CoordenadasEnlace | null> {
  const directo = extraerCoordenadasDeEnlace(enlace)
  if (directo) return directo
  if (!esEnlaceCortoGoogleMaps(enlace)) return null

  try {
    const respuesta = await fetch(enlace, { redirect: 'follow', method: 'GET' })
    const resuelto = extraerCoordenadasDeEnlace(respuesta.url)
    return resuelto ?? null
  } catch {
    return null
  }
}