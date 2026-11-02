import { useEffect, useState } from 'react'
import type { ImgHTMLAttributes } from 'react'

/**
 * SVG neutro en línea (data URI) que sustituye a las imágenes remotas caídas
 * (p. ej. i.ibb.co responde 503). Data URIs no pueden volver a fallar.
 */
const SVG_RESPALDO = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="#161a22"/><g fill="none" stroke="#4b5563" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"><rect x="22" y="36" width="52" height="34" rx="3"/><path d="M32 36v-6a6 6 0 0 1 6-6h20a6 6 0 0 1 6 6v6"/><path d="M22 50h52"/></g><circle cx="48" cy="62" r="5" fill="#ffd400"/></svg>`
)}`

interface ImagenSeguraProps extends ImgHTMLAttributes<HTMLImageElement> {
  src?: string
  alt: string
}

/**
 * <img> con respaldo anti-503: si la carga de `src` falla, muestra el
 * placeholder local SVG una única vez. Todos los hooks están en el nivel
 * superior (sin llamadas condicionales).
 */
export function ImagenSegura({ src, alt, ...propiedades }: ImagenSeguraProps) {
  const [fuente, setFuente] = useState<string | undefined>(src)
  const [respaldoActivo, setRespaldoActivo] = useState(false)

  // Al cambiar la imagen (otro concesionario), reintentar la URL original.
  useEffect(() => {
    setFuente(src)
    setRespaldoActivo(false)
  }, [src])

  if (!fuente) {
    return null
  }

  return (
    <img
      src={fuente}
      alt={alt}
      onError={() => {
        if (!respaldoActivo) {
          setRespaldoActivo(true)
          setFuente(SVG_RESPALDO)
        }
      }}
      {...propiedades}
    />
  )
}

export default ImagenSegura
