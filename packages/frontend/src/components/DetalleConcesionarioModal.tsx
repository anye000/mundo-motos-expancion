import { useState } from 'react'
import { Building2, History, Mail, MapPin, MessagesSquare, Phone, X } from 'lucide-react'
import { Concesionario } from '../types/concesionario'
import { HistorialInteracciones } from '@components/HistorialInteracciones'
import { HistorialEstados } from '@components/HistorialEstados'
import { ImagenSegura } from '@components/ImagenSegura'
import { ESTADO_BADGE, ESTADO_LABEL } from '@utils/estadosConcesionario'

export interface DetalleConcesionarioModalProps {
  concesionario: Concesionario | null
  onCerrar: () => void
}

/** Campo opcional de la ficha de control: se oculta cuando no hay valor. */
function CampoFicha({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
  if (!valor) return null
  return (
    <div>
      <p className="text-xs font-medium text-mm-gray-400">{etiqueta}</p>
      <p className="mt-1 text-sm text-mm-gray-200">{valor}</p>
    </div>
  )
}

function formatoUsd(valor: number | null): string | null {
  if (valor == null) return null
  return `$${valor.toLocaleString('en-US')}`
}

type Pestana = 'informacion' | 'interacciones' | 'historial'

const PESTANAS: { id: Pestana; label: string; icono: typeof History }[] = [
  { id: 'informacion', label: 'Información', icono: Building2 },
  { id: 'interacciones', label: 'Interacciones', icono: MessagesSquare },
  { id: 'historial', label: 'Historial de estados', icono: History },
]

/**
 * Modal de detalle de un concesionario con pestañas: información general,
 * historial de interacciones y línea de tiempo de cambios de estado.
 */
export function DetalleConcesionarioModal({
  concesionario,
  onCerrar,
}: DetalleConcesionarioModalProps) {
  const [pestana, setPestana] = useState<Pestana>('informacion')
  const [isFullViewOpen, setIsFullViewOpen] = useState(false)
  if (!concesionario) return null

  const esEstadoExpansion = ['proximo', 'en_ejecucion', 'completado'].includes(
    concesionario.estado
  )

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4"
      onClick={onCerrar}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-mm-gray-800 border border-mm-gray-600 shadow-xl animate-fadeInDown"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-2 border-mm-yellow px-6 py-4">
          <div className="flex items-center gap-2">
            {concesionario.image_url ? (
              <ImagenSegura
                src={concesionario.image_url}
                alt={concesionario.nombre}
                className="h-8 w-8 rounded-lg object-cover border border-mm-gray-600"
              />
            ) : (
              <Building2 className="h-5 w-5 text-mm-yellow" />
            )}
            <h2 className="text-lg font-bold text-mm-yellow">{concesionario.nombre}</h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-1 text-mm-gray-300 hover:bg-mm-gray-700 hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-1 border-b border-mm-gray-700 px-6 pt-3">
          {PESTANAS.map(({ id, label, icono: Icono }) => (
            <button
              key={id}
              type="button"
              onClick={() => setPestana(id)}
              className={`flex items-center gap-1.5 rounded-t-lg border-b-2 px-3 py-2 text-sm font-semibold transition-colors ${
                pestana === id
                  ? 'border-mm-yellow text-mm-yellow'
                  : 'border-transparent text-mm-gray-300 hover:text-white'
              }`}
            >
              <Icono className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-6 px-6 py-5">
          {pestana === 'informacion' && (
            <>
              {concesionario.image_url ? (
                <button
                  type="button"
                  onClick={() => setIsFullViewOpen(true)}
                  className="self-start rounded-xl border border-mm-gray-600 bg-mm-gray-900 p-1.5 transition-colors hover:border-mm-yellow cursor-pointer"
                  aria-label={`Ampliar foto de ${concesionario.nombre}`}
                  title="Ver en tamaño completo"
                >
                  <ImagenSegura
                    src={concesionario.image_url}
                    alt={concesionario.nombre}
                    className="h-40 w-full max-w-xs rounded-lg object-cover sm:h-48"
                    loading="lazy"
                  />
                </button>
              ) : (
                <div className="flex h-40 w-full max-w-xs items-center justify-center self-start rounded-xl border border-dashed border-mm-gray-600 bg-mm-gray-900">
                  <span className="flex flex-col items-center gap-2 text-mm-gray-500">
                    <Building2 className="h-8 w-8" />
                    <span className="text-sm font-bold tracking-wide text-mm-gray-400">
                      {concesionario.nombre.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="text-xs">Sin foto registrada</span>
                  </span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-mm-gray-400">Estado operativo</p>
                <span
                  className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${ESTADO_BADGE[concesionario.estado]}`}
                >
                  {ESTADO_LABEL[concesionario.estado]}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium text-mm-gray-400">RIF</p>
                <p className="mt-1 text-sm text-mm-gray-200">{concesionario.rif}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-mm-gray-400">Dirección</p>
                <p className="mt-1 flex items-start gap-1.5 text-sm text-mm-gray-200">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mm-yellow" />
                  {concesionario.direccion}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-mm-gray-400">Ciudad</p>
                <p className="mt-1 text-sm text-mm-gray-200">
                  {concesionario.ciudad} · {concesionario.departamento}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-mm-gray-400">Teléfono</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-mm-gray-200">
                  <Phone className="h-3.5 w-3.5 text-mm-yellow" />
                  {concesionario.telefono || 'No registrado'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-mm-gray-400">Email</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-mm-gray-200">
                  <Mail className="h-3.5 w-3.5 text-mm-yellow" />
                  {concesionario.email}
                </p>
              </div>
              {esEstadoExpansion && (
                <div>
                  <p className="text-xs font-medium text-mm-gray-400">Tipo de expansión</p>
                  <p className="mt-1 text-sm capitalize text-mm-gray-200">
                    {concesionario.tipo_expansion.replace('_', ' ')}
                  </p>
                </div>
              )}
              {concesionario.fecha_apertura_programada && (
                <div>
                  <p className="text-xs font-medium text-mm-gray-400">Apertura programada</p>
                  <p className="mt-1 text-sm text-mm-gray-200">
                    {concesionario.fecha_apertura_programada}
                  </p>
                </div>
              )}
              </div>

              <div className="rounded-lg border border-mm-gray-700 bg-mm-gray-900/50 p-4">
                <p className="mb-3 text-sm font-semibold text-mm-yellow">
                  Ficha de control de franquicia (Excel 2026)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CampoFicha etiqueta="Persona de contacto" valor={concesionario.persona_contacto} />
                  <CampoFicha
                    etiqueta="Contrato firmado"
                    valor={
                      concesionario.contrato_firmado === true
                        ? 'Sí'
                        : concesionario.contrato_firmado === false
                          ? 'No'
                          : null
                    }
                  />
                  <CampoFicha
                    etiqueta="Monto franquicia (US$)"
                    valor={formatoUsd(concesionario.monto_franquicia_usd)}
                  />
                  <CampoFicha etiqueta="Forma de pago" valor={concesionario.forma_pago} />
                  <CampoFicha etiqueta="Fecha de apertura" valor={concesionario.fecha_apertura} />
                  <CampoFicha
                    etiqueta="Días de crédito"
                    valor={concesionario.dias_credito != null ? String(concesionario.dias_credito) : null}
                  />
                  <CampoFicha
                    etiqueta="Vencimiento de crédito"
                    valor={concesionario.vencimiento_credito}
                  />
                  <CampoFicha
                    etiqueta="Monto pagado (US$)"
                    valor={formatoUsd(concesionario.monto_pagado_usd)}
                  />
                  <CampoFicha
                    etiqueta="Saldo pendiente (US$)"
                    valor={formatoUsd(concesionario.saldo_pendiente_usd)}
                  />
                  <CampoFicha etiqueta="Estatus de pago" valor={concesionario.estatus_pago} />
                  <CampoFicha
                    etiqueta="Nº motos inicial"
                    valor={
                      concesionario.num_motos_inicial != null
                        ? String(concesionario.num_motos_inicial)
                        : null
                    }
                  />
                  <CampoFicha
                    etiqueta="Metros cuadrados"
                    valor={
                      concesionario.metros_cuadrados != null
                        ? `${concesionario.metros_cuadrados} m²`
                        : null
                    }
                  />
                  <CampoFicha
                    etiqueta="Renovación de contrato"
                    valor={concesionario.fecha_renovacion_contrato}
                  />
                  <CampoFicha etiqueta="Fuente" valor={concesionario.fuente} />
                  <div className="sm:col-span-2">
                    <CampoFicha etiqueta="Observaciones" valor={concesionario.observaciones} />
                  </div>
                </div>
              </div>
            </>
          )}

          {pestana === 'interacciones' && (
            <div className="border-t border-mm-gray-700 pt-5">
              <HistorialInteracciones concesionarioId={concesionario.id} />
            </div>
          )}

          {pestana === 'historial' && (
            <div className="border-t border-mm-gray-700 pt-5">
              <HistorialEstados concesionarioId={concesionario.id} />
            </div>
          )}
        </div>
      </div>

      {isFullViewOpen && concesionario.image_url && (
        <div
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setIsFullViewOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsFullViewOpen(false)}
            className="absolute right-4 top-4 z-[1110] rounded-full bg-mm-gray-800/80 border border-mm-gray-600 p-2 text-mm-gray-200 hover:bg-mm-yellow hover:text-mm-black hover:border-mm-yellow transition-colors cursor-pointer"
            aria-label="Cerrar vista ampliada"
          >
            <X className="h-6 w-6" />
          </button>
          <ImagenSegura
            src={concesionario.image_url}
            alt={`${concesionario.nombre} - tamaño completo`}
            className="max-h-[92vh] max-w-full rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

export default DetalleConcesionarioModal
