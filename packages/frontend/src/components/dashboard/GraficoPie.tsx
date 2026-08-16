import { memo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { DatosPie } from './kpis'
import { TooltipPersonalizado } from './tooltip'

interface GraficoPieProps {
  datos: DatosPie[]
  activo: string | null
  onSeleccionar: (estado: string | null) => void
}

export const GraficoPie = memo(function GraficoPie({ datos, activo, onSeleccionar }: GraficoPieProps) {
  const total = datos.reduce((acumulado, d) => acumulado + d.value, 0)
  const porcentaje = (valor: number): number => (total > 0 ? (valor / total) * 100 : 0)

  if (total === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-mm-gray-700 py-10 text-sm text-mm-gray-400">
        Sin datos para mostrar.
      </div>
    )
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={230}>
        <PieChart>
          <Pie
            data={datos}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={88}
            paddingAngle={2}
            stroke="#000000"
            strokeWidth={2}
            className="cursor-pointer"
            onClick={(entrada: unknown) => {
              const clave = (entrada as { clave?: string } | null)?.clave
              onSeleccionar(clave === activo ? null : clave ?? null)
            }}
          >
            {datos.map((d) => (
              <Cell
                key={d.clave}
                fill={d.color}
                opacity={activo && activo !== d.clave ? 0.4 : 1}
                style={{
                  cursor: 'pointer',
                  outline: 'none',
                  filter: activo === d.clave ? 'drop-shadow(0 0 8px rgba(255, 204, 0, 0.5))' : undefined,
                }}
              />
            ))}
          </Pie>
          <Tooltip content={<TooltipPersonalizado total={total} formatearPorcentaje />} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="mt-3 flex flex-col gap-1.5">
        {datos.map((d) => {
          const seleccionado = activo === d.clave
          return (
            <li key={d.clave}>
              <button
                type="button"
                onClick={() => onSeleccionar(seleccionado ? null : d.clave)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  seleccionado
                    ? 'border-mm-yellow/70 bg-mm-yellow/10'
                    : 'border-transparent hover:border-mm-yellow/40 hover:bg-mm-yellow/5'
                }`}
              >
                <span className="flex items-center gap-2 text-mm-gray-300">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: d.color,
                      boxShadow: seleccionado ? '0 0 8px rgba(255, 204, 0, 0.8)' : undefined,
                    }}
                  />
                  {d.name}
                </span>
                <span className="text-mm-gray-400">
                  {d.value} ·{' '}
                  <span className="font-semibold text-white">{porcentaje(d.value).toFixed(1)}%</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
})
