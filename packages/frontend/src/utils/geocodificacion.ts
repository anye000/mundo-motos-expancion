/** Cliente de geocodificación con Nominatim (OpenStreetMap). Solo lectura, sin claves. */

export interface DireccionNominatim {
  house_number?: string;
  road?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  state?: string;
}

export interface ResultadoGeocodificacion {
  lat: number;
  lng: number;
  displayName: string;
  direccion: string;
  ciudad: string;
  departamento: string;
}

interface ResultadoNominatim {
  lat: string;
  lon: string;
  display_name: string;
  address?: DireccionNominatim;
}

function extraerCiudad(address: DireccionNominatim): string {
  return address.city ?? address.town ?? address.village ?? address.municipality ?? '';
}

function extraerDireccion(address: DireccionNominatim): string {
  return [address.house_number, address.road].filter(Boolean).join(' ');
}

/**
 * Busca una dirección o ciudad en OpenStreetMap vía Nominatim.
 * Acotada a Colombia (`countrycodes=co`). Acepta un `AbortSignal` para cancelar
 * peticiones obsoletas desde el componente (debounce).
 */
export async function buscarDireccion(
  consulta: string,
  signal?: AbortSignal
): Promise<ResultadoGeocodificacion[]> {
  if (!consulta.trim()) return [];

  const params = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    limit: '5',
    countrycodes: 'co',
    'accept-language': 'es',
    q: consulta.trim(),
  });

  const respuesta = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!respuesta.ok) {
    throw new Error('Error al consultar el servicio de geocodificación');
  }

  const resultados: ResultadoNominatim[] = await respuesta.json();

  return resultados.map((r) => {
    const address = r.address ?? {};
    return {
      lat: Number(r.lat),
      lng: Number(r.lon),
      displayName: r.display_name,
      direccion: extraerDireccion(address),
      ciudad: extraerCiudad(address),
      departamento: address.state ?? '',
    };
  });
}

export interface ResultadoUbicacionInversa {
  direccion: string;
  ciudad: string;
  departamento: string;
}

/**
 * Geocodificación inversa: a partir de una coordenada devuelve la dirección,
 * ciudad y departamento más próximos vía Nominatim. Acepta un `AbortSignal`
 * para cancelar peticiones obsoletas (p. ej. cuando el usuario hace varios clics).
 */
export async function geocodificarInversa(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<ResultadoUbicacionInversa> {
  const params = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    'accept-language': 'es',
    lat: String(lat),
    lon: String(lng),
  });

  const respuesta = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!respuesta.ok) {
    throw new Error('Error al consultar el servicio de geocodificación');
  }

  const datos = (await respuesta.json()) as { address?: DireccionNominatim };
  const address = datos.address ?? {};
  return {
    direccion: extraerDireccion(address),
    ciudad: extraerCiudad(address),
    departamento: address.state ?? '',
  };
}
