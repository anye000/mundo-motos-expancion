import type { CSSProperties } from 'react'

export const ESTILO_TOOLTIP: CSSProperties = {
  backgroundColor: '#0A0A0A',
  border: '1px solid #FFCC00',
  borderRadius: '0.5rem',
  color: '#FFFFFF',
  boxShadow: '0 0 16px rgba(255, 204, 0, 0.25)',
  padding: '0.5rem 0.75rem',
}

interface EntradaTooltip {
  name?: string | number
  value?: string | number
  color?: string
  payload?: { name?: string; color?: string }
}

interface TooltipPersonalizadoProps {
  active?: boolean
  label?: string | number
  payload?: EntradaTooltip[]
  total?: number
  formatearPorcentaje?: boolean
}

export function TooltipPersonalizado({
  active,
  label,
  payload,
  total,
  formatearPorcentaje = false,
}: TooltipPersonalizadoProps) {
  if (!active || !payload || payload.length === 0) return null

  const totalValido = total != null && total > 0

  return (
    <div style={ESTILO_TOOLTIP}>
      {label != null && label !== '' && (
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-mm-yellow">{label}</p>
      )}
      <ul className="flex flex-col gap-1">
        {payload.map((entrada, indice) => {
          const valor = Number(entrada.value ?? 0)
          const color = entrada.color ?? entrada.payload?.color ?? '#FFCC00'
          const porcentaje = totalValido ? (valor / (total as number)) * 100 : null
          return (
            <li key={indice} className="flex items-center justify-between gap-4 text-sm">
              <span className="flex items-center gap-2 text-mm-gray-300">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                {String(entrada.name ?? '')}
              </span>
              <span className="font-semibold text-white">
                {formatearPorcentaje && porcentaje != null
                  ? `${valor} · ${porcentaje.toFixed(1)}%`
                  : valor}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
