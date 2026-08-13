import { memo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DatosBarra } from './formateo'
import { TooltipPersonalizado } from './tooltip'

interface GraficoBarrasProps {
  datos: DatosBarra[]
  activo: string | null
  total: number
  onSeleccionar: (clave: string | null) => void
}

export const GraficoBarras = memo(function GraficoBarras({
  datos,
  activo,
  total,
  onSeleccionar,
}: GraficoBarrasProps) {
  if (datos.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-mm-gray-700 py-10 text-sm text-mm-gray-400">
        Sin datos para mostrar.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={datos} margin={{ top: 4, right: 4, left: -18, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
        <XAxis
          dataKey="nombre"
          tick={{ fill: '#A3A3A3', fontSize: 11 }}
          axisLine={{ stroke: '#404040' }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fill: '#A3A3A3', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: 'rgba(255, 204, 0, 0.08)' }}
          content={<TooltipPersonalizado total={total} formatearPorcentaje />}
        />
        <Bar
          dataKey="value"
          radius={[6, 6, 0, 0]}
          onClick={(entrada: unknown) => {
            const clave = (entrada as { clave?: string } | null)?.clave
            onSeleccionar(clave === activo ? null : clave ?? null)
          }}
        >
          {datos.map((d) => {
            const seleccionado = activo === d.clave
            return (
              <Cell
                key={d.clave}
                fill="#FFCC00"
                opacity={activo && !seleccionado ? 0.35 : 1}
                style={{
                  cursor: 'pointer',
                  filter: seleccionado ? 'drop-shadow(0 0 6px rgba(255, 204, 0, 0.6))' : undefined,
                }}
              />
            )
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
})
